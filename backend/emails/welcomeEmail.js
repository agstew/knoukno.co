// Welcome email template for Kno U Kno
const generateWelcomeEmail = (user, subscription) => {
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 2);
  
  const tierDetails = {
    member: { questions: 50, examples: 50, answers: 50, price: 39 },
    'member-bonus': { questions: 150, examples: 150, answers: 150, price: 199 },
    pro: { questions: 75, examples: 75, answers: 75, price: 0 },
    'pro-bonus': { questions: 175, examples: 175, answers: 175, price: 299 },
  };

  const tier = tierDetails[subscription.tier] || tierDetails.member;

  return {
    subject: `Welcome to Kno U Kno! Your 2-Year Business Learning Journey Starts Now 🎉`,
    html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background: linear-gradient(135deg, #0e7f8d 0%, #0a4d67 100%);
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px solid #0e7f8d;
        padding-bottom: 20px;
      }
      .logo { font-size: 28px; font-weight: 900; color: #0e7f8d; margin: 0; }
      .greeting { font-size: 20px; color: #0c1117; margin: 20px 0 10px 0; }
      .details-box {
        background: #f5f7fa;
        border-left: 4px solid #d6b06a;
        padding: 20px;
        margin: 20px 0;
        border-radius: 6px;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin: 10px 0;
        font-size: 14px;
      }
      .detail-label { color: #666; font-weight: 500; }
      .detail-value { color: #0e7f8d; font-weight: 600; }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #0e7f8d 0%, #0a4d67 100%);
        color: white;
        padding: 14px 32px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin: 10px 0;
      }
      .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #0c1117;
        margin: 25px 0 15px 0;
        border-bottom: 2px solid #d6b06a;
        padding-bottom: 10px;
      }
      .checklist { list-style: none; padding: 0; }
      .checklist li { padding: 10px 0; }
      .checklist li:before { content: "✅ "; color: #0e7f8d; margin-right: 8px; }
      .link { color: #0e7f8d; text-decoration: none; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <p class="logo">Kno U Kno</p>
      </div>
      <h2 class="greeting">Welcome, ${user.firstName || 'Learner'}! 🚀</h2>
      <p>Thank you for joining Kno U Kno! We're thrilled to have you on your 2-year business learning journey.</p>
      <div class="details-box">
        <h3 style="margin: 0 0 15px 0;">Your Subscription Details</h3>
        <div class="detail-row">
          <span class="detail-label">Plan:</span>
          <span class="detail-value">${subscription.tier.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expires:</span>
          <span class="detail-value">${expirationDate.toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Questions:</span>
          <span class="detail-value">${tier.questions}</span>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="https://www.knoukno.co/login" class="button">Log In Now</a>
      </div>
      <h3 class="section-title">Getting Started</h3>
      <ol><li>Log in to your account</li><li>Select a Business Topic</li><li>Start answering questions</li><li>Track your progress</li></ol>
      <h3 class="section-title">What You Get</h3>
      <ul class="checklist">
        <li>${tier.questions} AI-generated questions</li>
        <li>${tier.examples} detailed examples</li>
        <li>Full grading and tracking</li>
        <li>Save and print your progress</li>
      </ul>
      <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px;">
        💡 <strong>Pro Tip:</strong> You have 2 full years to complete your journey. Take your time and answer thoroughly!
      </p>
      <p style="margin-top: 30px;"><strong>Welcome to Kno U Kno. Let's build your business foundation together.</strong></p>
      <p style="color: #0e7f8d; font-weight: 600;">The Kno U Kno Team</p>
    </div>
  </body>
</html>
    `,
  };
};

module.exports = { generateWelcomeEmail };
