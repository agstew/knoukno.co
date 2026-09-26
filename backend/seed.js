require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');
const Business = require('./models/Business');

const businesses = [
  { title: 'Starting Your Business', description: 'Foundational steps and decisions for launching a business', category: 'start' },
  { title: 'Managing Operations', description: 'Day-to-day operations, processes, and systems management', category: 'manage' },
  { title: 'Business Finances', description: 'Financial management, cash flow, accounting, and funding', category: 'money' },
  { title: 'Employee Management', description: 'Hiring, training, performance management, and team building', category: 'manage' },
  { title: 'Business Growth', description: 'Scaling strategies, market expansion, and growth planning', category: 'manage' }
];

const questions = [
  {
    businessTitle: 'Business Finances',
    questionText: 'When a business has irregular monthly revenue and fixed operational costs including rent, utilities, payroll, and vendor payments, how do you establish a cash flow management system that prevents insolvency during low-revenue months? Consider that you must maintain employee pay schedules, honor vendor contracts, and keep utility services active while simultaneously trying to reinvest in inventory or services. What specific financial tools, reserve fund strategies, and payment prioritization methods would you implement to navigate a 60-day period where incoming revenue drops by 40% while expenses remain constant? Describe the step-by-step process you would follow from the moment you identify the revenue shortfall through to stabilizing operations, including which expenses get deferred, which financial instruments you would leverage, and how you communicate with stakeholders during the crisis.',
    example: 'A retail business averages $15,000/month but drops to $9,000 for two months during off-season while monthly costs stay at $12,000.',
    category: 'money',
    tierAccess: 'members',
    questionNumber: 1
  },
  {
    businessTitle: 'Business Finances',
    questionText: 'A business collects revenue in cash and through digital payments but has multiple expense categories that each need to be tracked separately for tax, budgeting, and reporting purposes. How do you design and implement an accounting system from scratch that gives you real-time visibility into your financial health without hiring a full-time accountant? Walk through the chart of accounts you would set up, the reconciliation process you would follow weekly and monthly, the reports you would generate to make operational decisions, and how you would prepare this data for tax filing. Include how you handle mixed-use expenses, owner draws versus salary, and the documentation practices needed to withstand an audit.',
    example: 'A service business owner collects $8,000/week from clients across cash, check, and Stripe payments while paying 12 different vendors plus employee wages.',
    category: 'money',
    tierAccess: 'free',
    questionNumber: 2
  },
  {
    businessTitle: 'Business Finances',
    questionText: 'When evaluating whether a business should take on debt financing versus seeking equity investment versus bootstrapping growth from internal cash flow, what framework do you use to make this decision? Consider factors including current debt-to-equity ratio, the cost of capital from each source, dilution impact on ownership, covenants and restrictions that come with debt, the timeline for needing capital, and the risk profile of the business model. Describe in detail how you would calculate the true cost of each financing option, what financial projections you would build to justify the decision, and what criteria would cause you to choose one path over another. Include how operational stage, industry, and market timing affect the calculus.',
    example: 'A tech startup with $200K ARR needs $500K to hire 3 engineers and launch a new product line within 8 months before a competitor does.',
    category: 'money',
    tierAccess: 'pro',
    questionNumber: 3
  },
  {
    businessTitle: 'Business Finances',
    questionText: 'How do you construct a comprehensive annual budget for a business that includes revenue forecasting, expense planning, capital expenditure decisions, and contingency reserves when your historical data is limited or unreliable? Describe the methodology for building bottom-up versus top-down budgets, how you handle multiple revenue streams with different margin profiles, how you account for seasonality and macroeconomic uncertainty, and how you build in variance thresholds that trigger a budget review. Walk through the specific spreadsheet structure or software approach you would use, the assumptions that must be documented, and how the budget connects to operational decisions throughout the year.',
    example: 'A two-year-old logistics company with three service lines and lumpy contract-based revenue needs to plan headcount, fleet, and marketing spend for the coming year.',
    category: 'money',
    tierAccess: 'members',
    questionNumber: 4
  },
  {
    businessTitle: 'Starting Your Business',
    questionText: 'When launching a new business, how do you rigorously validate that sufficient market demand exists before committing significant capital to operations, inventory, or staffing? Walk through the entire validation process including how you identify your target customer segment, design and conduct customer discovery interviews, interpret the signals versus noise in the feedback, build and test a minimum viable offer, and make the go or no-go decision based on the data. Include how you distinguish between someone saying they like your idea versus someone actually paying for it, how many data points are sufficient for confidence, and what failure modes in the validation process lead entrepreneurs to false positives.',
    example: 'An entrepreneur wants to launch a premium cleaning service targeting vacation rental hosts in a mid-size market before quitting their day job.',
    category: 'start',
    tierAccess: 'free',
    questionNumber: 5
  },
  {
    businessTitle: 'Starting Your Business',
    questionText: 'Choosing the right legal structure for a new business involves tradeoffs across liability protection, tax treatment, operational complexity, fundraising capability, and ownership flexibility. Walk through the decision framework for choosing between sole proprietorship, LLC, S-Corp, C-Corp, and partnership structures. For each structure, explain the specific liability protections it provides and their limits, how income flows and gets taxed at each level, the compliance and administrative burden it creates, and the types of businesses or growth trajectories it best suits. Include how state of incorporation affects the decision, when and how to convert from one structure to another, and which professional advisors should be involved at each stage.',
    example: 'A solo consultant considering their first hire and a potential outside investor must choose between remaining an LLC or electing S-Corp status while leaving room for future equity grants.',
    category: 'start',
    tierAccess: 'free',
    questionNumber: 6
  },
  {
    businessTitle: 'Starting Your Business',
    questionText: 'Before opening for business, what is the complete set of operational systems, processes, and infrastructure that must be in place to handle customers, money, and work delivery reliably from day one? Describe the order of operations for setting up business banking, payment processing, invoicing, customer communication, service delivery workflows, and record-keeping. Include what technology stack you would choose and why, how you design processes that do not depend on memory or tribal knowledge, what documentation you create before the first customer arrives, and how you stress-test your systems before going live. Walk through how these foundational systems prevent the common operational failures that cause early-stage businesses to lose customers and revenue.',
    example: 'A home services company is preparing to take its first five paying customers and must have booking, payment, scheduling, and service delivery working reliably.',
    category: 'start',
    tierAccess: 'members',
    questionNumber: 7
  },
  {
    businessTitle: 'Starting Your Business',
    questionText: 'How do you develop a pricing strategy for a new business when you lack the cost data, competitive intelligence, and customer price sensitivity information that established companies have? Walk through the methods for calculating your true cost of goods sold and overhead allocation, researching competitive pricing in your market, testing price points with early customers, and setting prices that cover costs while positioning you correctly against alternatives. Include how to price differently for early customers versus at scale, when and how to raise prices once established, how pricing communicates quality to customers, and how to avoid the trap of underpricing to win business that ultimately destroys the unit economics of the company.',
    example: 'A new B2B software consultancy has to price a 3-month engagement without knowing their actual utilization rate, overhead allocation per project, or what competitors charge.',
    category: 'start',
    tierAccess: 'pro',
    questionNumber: 8
  },
  {
    businessTitle: 'Managing Operations',
    questionText: 'How do you design and implement standard operating procedures for a business that relies on human labor when the work involves both routine tasks and significant judgment calls? Describe the process for documenting current workflows, identifying the critical decision points where variance causes quality problems, writing procedures that are specific enough to produce consistent results but flexible enough to handle real-world variation, and training employees to follow them. Include how you handle the difference between what people say they do and what they actually do, how you version-control your procedures as the business evolves, how you measure adherence and outcomes, and what happens when a procedure fails in a real customer situation.',
    example: 'A multi-location food service operation needs to standardize its food preparation, customer service interactions, and complaint resolution across sites with different staff.',
    category: 'manage',
    tierAccess: 'free',
    questionNumber: 9
  },
  {
    businessTitle: 'Managing Operations',
    questionText: 'When a business is experiencing quality problems that are causing customer complaints, refund requests, and negative reviews, how do you diagnose the root cause and implement a systematic fix without shutting down operations? Describe the process for distinguishing between random variation and systemic process failure, conducting a root cause analysis without triggering defensive reactions from the team, designing and testing a corrective action, implementing it at scale, and monitoring to confirm the problem is actually resolved. Include how you manage customer relationships during the remediation period, how you communicate internally about the problem without creating blame culture, and how you build quality checkpoints that catch problems before they reach customers.',
    example: 'An e-commerce fulfillment operation is receiving a 12% defect rate on orders during peak season, with wrong items shipped, damaged packaging, and missing components.',
    category: 'manage',
    tierAccess: 'members',
    questionNumber: 10
  },
  {
    businessTitle: 'Managing Operations',
    questionText: 'How do you design a technology stack for a small-to-medium business that covers operations, customer management, communications, and financial tracking without creating a fragmented mess of disconnected tools that create data silos and manual reconciliation work? Walk through the evaluation criteria for selecting business software, how to map data flows between systems, what integrations are essential versus nice-to-have, how to manage the migration from manual processes to software without losing operational continuity, and how to build in the flexibility to change tools as the business grows. Include how to calculate the true cost of software including implementation, training, and ongoing administration, and how to avoid vendor lock-in.',
    example: 'A 15-person professional services firm is using four separate spreadsheets, two email systems, and no CRM to manage clients, projects, invoicing, and internal communications.',
    category: 'manage',
    tierAccess: 'pro',
    questionNumber: 11
  },
  {
    businessTitle: 'Managing Operations',
    questionText: 'When a business needs to scale its operational capacity to handle significantly more volume, what is the correct sequence of decisions around hiring, process improvement, automation, and capital investment? Describe how to identify the actual constraint that is limiting throughput, how to distinguish between problems that require more people versus better processes versus technology, and how to sequence investments to get the most capacity gain per dollar spent. Include how to avoid the common trap of hiring to solve process problems, how to measure operational efficiency before and after changes, and how to plan for the operational complexity that comes with each doubling of volume.',
    example: 'A manufacturing operation running at 80% utilization needs to increase monthly output by 40% within six months to fulfill a new contract without building a new facility.',
    category: 'manage',
    tierAccess: 'members',
    questionNumber: 12
  },
  {
    businessTitle: 'Employee Management',
    questionText: 'How do you design a compensation and benefits structure for a growing business that allows you to attract qualified candidates, retain top performers, stay competitive with the market, and manage total labor costs within budget? Walk through how to conduct a compensation benchmarking analysis, design pay bands and progression criteria, structure base pay versus variable pay versus benefits, handle pay equity across roles and tenure, and communicate compensation philosophy to the team. Include how to handle pay conversations when you cannot match market rates, how to use non-cash compensation effectively, how to build compensation reviews into the performance management calendar, and how to adjust the structure as the business scales.',
    example: 'A 20-person technology company is losing engineers to competitors paying 20-30% more and must redesign its compensation structure without blowing the payroll budget.',
    category: 'manage',
    tierAccess: 'members',
    questionNumber: 13
  },
  {
    businessTitle: 'Employee Management',
    questionText: 'When an employee is consistently underperforming relative to the role requirements despite having the training and resources needed to succeed, how do you manage the performance improvement process in a way that is fair to the employee, legally defensible for the company, and minimally disruptive to the team? Describe the documentation requirements starting from when the issue first appears, how to structure a performance improvement plan with specific measurable expectations, how to conduct difficult conversations without triggering emotional or legal escalation, what support you provide the employee during the process, and how you make and communicate the final decision regardless of outcome. Include what you do wrong that turns a manageable performance issue into a lawsuit.',
    example: 'A sales representative with 18 months of tenure is consistently missing quota by 30% despite coaching, and their manager needs to address it formally before the next quarter.',
    category: 'manage',
    tierAccess: 'free',
    questionNumber: 14
  },
  {
    businessTitle: 'Employee Management',
    questionText: 'How do you build and maintain a high-performance team culture in a business that has grown from a small tight-knit group to a larger organization where not everyone knows each other personally? Describe how culture gets established and transmitted in early-stage companies, what breaks down as headcount increases, how to intentionally design cultural practices including meetings, communication norms, decision-making frameworks, and recognition systems that reinforce the values you want, and how to handle culture fit issues as you hire across different backgrounds and experience levels. Include how to measure whether your culture is actually what you think it is, how to address cultural drift without appearing authoritarian, and what culture problems predict business performance problems.',
    example: 'A company that grew from 8 to 45 employees in two years is now experiencing communication breakdowns, political behavior, and disengagement that did not exist when everyone sat in one room.',
    category: 'manage',
    tierAccess: 'pro',
    questionNumber: 15
  },
  {
    businessTitle: 'Employee Management',
    questionText: 'What is the complete process for hiring a key role in your business from job requirements definition through the first 90 days of employment? Describe how to define the actual requirements of the role versus the wish list, write a job description that attracts the right candidates while filtering out the wrong ones, design an interview process that tests the actual skills needed, conduct structured interviews and evaluate candidates consistently, make and communicate the hiring decision, negotiate the offer, onboard the new employee effectively, and measure whether the hire is working within the first quarter. Include the most common hiring mistakes, what reference checks actually reveal versus hide, and how to hire for potential versus proven experience.',
    example: 'A logistics company needs to hire its first operations director who will manage 12 employees, vendor relationships, and process improvement initiatives with minimal supervision.',
    category: 'manage',
    tierAccess: 'members',
    questionNumber: 16
  },
  {
    businessTitle: 'Business Growth',
    questionText: 'How do you evaluate whether a business is ready to scale its sales and marketing investment, and what is the correct sequence of activities to grow revenue without outpacing the operational capacity to deliver? Describe the key metrics that signal product-market fit is strong enough to justify aggressive growth investment, how to calculate the unit economics including customer acquisition cost and lifetime value that must hold for the growth math to work, and how to identify the operational constraints that will break first if volume doubles. Include how to build a growth plan that sequences marketing, sales, delivery capacity, and working capital investments in the right order, and how to set realistic growth targets that stretch the team without creating quality failures.',
    example: 'A B2B SaaS company with $800K ARR and 85% gross margins is considering raising $2M to hire a sales team but has never done outbound before and the product still has known gaps.',
    category: 'manage',
    tierAccess: 'pro',
    questionNumber: 17
  },
  {
    businessTitle: 'Business Growth',
    questionText: 'When a business has succeeded in its core market and is considering geographic expansion, adding new product lines, or entering adjacent customer segments, how do you evaluate which growth path offers the best return on investment and strategic positioning? Walk through the framework for assessing growth options including market size and accessibility, competitive intensity, operational complexity and capital requirements, the degree to which existing capabilities transfer, and how each option affects the core business. Include how to design and run a low-cost experiment to test the expansion hypothesis before full commitment, what metrics tell you the expansion is working versus failing, and when to double down versus pivot to a different growth vector.',
    example: 'A profitable regional restaurant chain with 6 locations is evaluating opening locations in two new cities, launching a catering service line, and introducing a meal kit delivery product simultaneously.',
    category: 'manage',
    tierAccess: 'free',
    questionNumber: 18
  },
  {
    businessTitle: 'Business Growth',
    questionText: 'How do you build and manage a sales pipeline for a B2B business when your sales cycle is long, involves multiple decision makers, and requires significant customization of the solution? Describe how to define and qualify leads at each pipeline stage, assign probability weightings that allow for accurate revenue forecasting, manage the activities needed to move deals forward including relationship building, objection handling, proposal writing, and negotiation, and how to analyze pipeline health to identify coaching and process opportunities. Include how to set and track quota against pipeline coverage ratios, how to handle stalled deals without being annoying, and what CRM practices actually improve close rates versus what is just data entry theater.',
    example: 'An enterprise software company with a 6-month average sales cycle needs to forecast revenue with enough confidence to make hiring decisions for the implementation team.',
    category: 'manage',
    tierAccess: 'members',
    questionNumber: 19
  },
  {
    businessTitle: 'Business Growth',
    questionText: 'What is the strategic and operational framework for entering a new market where established competitors have significant advantages in brand recognition, customer relationships, distribution, and pricing power? Describe how to identify a beachhead segment where your differentiation matters most and where the incumbents are weakest, how to design a go-to-market strategy that does not require you to win on budget, how to build enough reference customers and case studies to overcome the risk perception of buying from a new entrant, and how to use your initial wins to expand systematically into broader segments. Include how long it typically takes for market entry strategies to produce measurable traction, and how to adjust strategy when initial positioning is not resonating.',
    example: 'A new HR software company is trying to compete against established platforms with 10 years of market presence and much lower prices due to their scale, targeting mid-market companies with 100-500 employees.',
    category: 'manage',
    tierAccess: 'pro',
    questionNumber: 20
  },
  {
    businessTitle: 'Starting Your Business',
    questionText: 'How do you build and maintain the business relationships with vendors, suppliers, service providers, and strategic partners that are essential to operating effectively and getting favorable terms as a small or new business? Describe the process for identifying which external relationships are strategic versus transactional, how to approach and develop relationships with vendors who are much larger than you, how to negotiate terms including payment timing, volume commitments, and service levels when you lack leverage, and how to create mutual value so that partners prioritize your business when capacity is constrained. Include how to manage vendor concentration risk, what contract terms are non-negotiable versus negotiable, and how to handle a critical vendor relationship that is deteriorating.',
    example: 'A new food manufacturer depends on three primary ingredient suppliers and needs 60-day payment terms to manage cash flow but all three currently require payment upfront.',
    category: 'start',
    tierAccess: 'members',
    questionNumber: 21
  },
  {
    businessTitle: 'Business Finances',
    questionText: 'When a business receives a large contract or purchase order that it does not currently have the working capital to fulfill, how do you evaluate and execute the financing options available to bridge the gap between when costs are incurred and when revenue is collected? Walk through the mechanics of purchase order financing, invoice factoring, revolving lines of credit, and merchant cash advances, including the true cost of each in annual percentage terms, the operational requirements they impose, and the business conditions under which each is appropriate. Include how to present the opportunity and your financials to a lender in a way that demonstrates creditworthiness, how to structure the repayment to align with your cash flow, and what mistakes cause businesses to get trapped in expensive short-term debt cycles.',
    example: 'A staffing company wins a $400K government contract starting in 30 days but must fund three months of payroll before the first invoice is due, and has only $45K in its bank account.',
    category: 'money',
    tierAccess: 'pro',
    questionNumber: 22
  },
  {
    businessTitle: 'Managing Operations',
    questionText: 'How do you build a customer service operation that resolves issues efficiently, turns dissatisfied customers into loyal advocates, collects actionable feedback for product and process improvement, and does not create unsustainable costs as transaction volume grows? Describe the process for mapping the customer journey and identifying the highest-impact failure points, designing escalation paths and resolution authority for different issue types, building scripts and decision trees that produce consistent outcomes across different representatives, measuring both efficiency metrics and customer satisfaction, and using complaint patterns to drive upstream fixes in operations or product. Include how to handle customers who are unreasonable, how to decide when to issue refunds versus stand firm, and how to build a service culture in hourly employees.',
    example: 'A subscription e-commerce company with 5,000 active customers is receiving 200 support tickets per week and its 2-person service team is overwhelmed and response times have hit 4 days.',
    category: 'manage',
    tierAccess: 'pro',
    questionNumber: 23
  },
  {
    businessTitle: 'Business Finances',
    questionText: 'How do you build a financial model that accurately projects the revenue, costs, and cash flow of a new business venture when you are operating with highly uncertain inputs around customer acquisition rate, pricing, churn, and cost structure? Describe the architecture of a three-statement financial model including income statement, balance sheet, and cash flow statement, how to model different scenarios including base case, upside, and downside, what assumptions are most sensitive and require the most scrutiny, and how to stress-test the model against realistic worst-case situations. Include how to calibrate your model using industry benchmarks and comparable companies, what the model reveals about the minimum viable scale to reach profitability, and how investors evaluate the quality and credibility of financial projections.',
    example: 'A founder needs to present a 3-year financial model to potential investors for a subscription-based professional development platform targeting corporate clients, with no revenue history.',
    category: 'money',
    tierAccess: 'pro',
    questionNumber: 24
  },
  {
    businessTitle: 'Employee Management',
    questionText: 'How do you design an onboarding program for new employees that gets them to full productivity quickly, builds strong relationships with their team and the company culture, reduces early attrition, and sets clear expectations for performance? Walk through the specific activities, information, training, and check-ins that should happen in the first day, first week, first 30 days, and first 90 days for both individual contributors and managers. Include how to create onboarding materials that do not become immediately outdated, how to structure role-specific training versus company-wide orientation, how to use buddies or mentors effectively, and how to measure whether the onboarding is actually working. Describe the most common onboarding failures and what they cost the business in terms of ramp time, attrition, and team morale.',
    example: 'A professional services company that hires 2-3 new consultants per quarter currently has no formal onboarding program and new hires report feeling lost and unsupported for their first 60 days.',
    category: 'manage',
    tierAccess: 'members',
    questionNumber: 25
  }
];

async function seedContent() {
    for (const business of businesses) {
      await Business.updateOne({ title: business.title }, { $setOnInsert: business }, { upsert: true });
    }

    for (const question of questions) {
      await Question.updateOne({ questionNumber: question.questionNumber }, { $setOnInsert: question }, { upsert: true });
    }
    const freeGrowthQuestion = questions.find((question) => question.businessTitle === 'Business Growth' && question.tierAccess === 'free');
    if (freeGrowthQuestion) {
      await Question.updateOne(
        { businessTitle: freeGrowthQuestion.businessTitle, questionNumber: freeGrowthQuestion.questionNumber },
        { $set: { tierAccess: 'free' } }
      );
    }
    console.log(`Ensured ${businesses.length} businesses and ${questions.length} questions`);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/knoukno');
    await seedContent();

    await mongoose.disconnect();
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

if (require.main === module) seed();

module.exports = { seedContent };
