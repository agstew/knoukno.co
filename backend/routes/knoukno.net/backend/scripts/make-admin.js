// Usage: node scripts/make-admin.js user@example.com
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const email = (process.argv[2] || '').toLowerCase().trim();
  if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  console.log(user ? `${user.email} is now an admin.` : `No user found with email ${email}.`);
  await mongoose.disconnect();
  process.exit(user ? 0 : 1);
})().catch(err => {
  console.error(err.message);
  process.exit(1);
});
