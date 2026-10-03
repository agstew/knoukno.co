require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const contentRoutes = require('./routes/content');
const titleRoutes = require('./routes/titles');
const { seedContent } = require('./seed');

const app = express();
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production' && (!process.env.MONGO_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Production requires MONGO_URI and a JWT_SECRET of at least 32 characters.');
}

app.use(helmet());
// CLIENT_URL may be a single origin or a comma-separated list (e.g. multiple custom domains on one Railway service)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

let databaseReady = false;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/knoukno')
  .then(async () => {
    await seedContent();
    databaseReady = true;
    console.log('MongoDB connected');
  })
  .catch(err => console.error('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/titles', titleRoutes);

app.get('/api/health', (req, res) => res.status(databaseReady ? 200 : 503).json({ status: databaseReady ? 'ok' : 'unavailable' }));

const frontendBuild = path.join(__dirname, 'public');
if (fs.existsSync(path.join(frontendBuild, 'index.html'))) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
