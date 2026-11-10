// Daily tips email for 2-year subscription
const generateDailyTipEmail = (user, dayNumber) => {
  const businessTopics = [
    {
      topic: 'Business Law & Compliance',
      tips: [
        'Understand business structure options: LLC, Corporation, Sole Proprietorship',
        'Know your tax obligations and deadlines',
        'Protect your intellectual property with trademarks',
        'Keep detailed records for legal protection',
      ],
    },
    {
      topic: 'Location & Logistics',
      tips: [
        'Analyze foot traffic and demographics for your location',
        'Consider rent costs vs. revenue potential',
        'Evaluate zoning restrictions and regulations',
        'Plan for parking, accessibility, and visibility',
      ],
    },
    {
      topic: 'Hiring & Team Building',
      tips: [
        'Define clear job roles and responsibilities',
        'Develop a strong company culture from day one',
        'Invest in employee training and development',
        'Create competitive compensation packages',
      ],
    },
    {
      topic: 'Customer & People Skills',
      tips: [
        'Build genuine relationships with customers',
        'Listen to feedback and adapt your services',
        'Create loyal customers through exceptional service',
        'Use data to understand customer behavior',
      ],
    },
  ];

  const currentTopic = businessTopics[dayNumber % businessTopics.length];
  const dailyTip = currentTopic.tips[Math.floor(Math.random() * currentTopic.tips.length)];

  return {
    subject: `Daily Tip: ${currentTopic.topic} - Day ${dayNumber} of Your 2-Year Journey 💡`,
    html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f5f7fa;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 30px;
      }
      .tip-header {
        background: linear-gradient(135deg, #0e7f8d 0%, #0a4d67 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      .tip-content {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 20px;
        margin: 20px 0;
        border-radius: 6px;
      }
      .cta-button {
        display: inline-block;
        background: #0e7f8d;
        color: white;
        padding: 12px 28px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin: 15px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="tip-header">
        <h2 style="margin: 0; font-size: 22px;">Day ${dayNumber} of Your Learning Journey</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${currentTopic.topic}</p>
      </div>
      
      <p>Hi ${user.firstName || 'Learner'},</p>
      
      <p>Here's your daily business tip to keep you on track with your learning goals:</p>
      
      <div class="tip-content">
        <strong>Today's Tip:</strong><br>
        ${dailyTip}
      </div>
      
      <p>This aligns perfectly with the topics you're exploring in Kno U Kno. As you answer questions about <strong>${currentTopic.topic}</strong>, keep this tip in mind!</p>
      
      <div style="text-align: center;">
        <a href="https://www.knoukno.co/dashboard" class="cta-button">Continue Learning</a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        You're ${Math.round((dayNumber / 730) * 100)}% through your 2-year journey! Keep up the great work.
      </p>
      
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
        © 2026 Kno U Kno | <a href="https://www.knoukno.co" style="color: #0e7f8d; text-decoration: none;">www.knoukno.co</a>
      </p>
    </div>
  </body>
</html>
    `,
  };
};

module.exports = { generateDailyTipEmail };
