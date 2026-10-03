const express = require('express');

const router = express.Router();

const sections = [
  { slug: 'start-here', heading: 'Start a business from the very first step', body: 'Kno U Kno shows you how to start a business from the basics all the way to the finish. You get the questions in the order a real business needs them answered, and you write the answers yourself.', imageUrl: '/img/section-start.svg', imageAlt: 'A founder writing the first plan for a new business' },
  { slug: 'law', heading: 'Law first, so the business is real', body: 'Choose the entity, register the name, get the tax ID, and find out which licences and permits your trade and your city require.', imageUrl: '/img/section-law.svg', imageAlt: 'Business formation paperwork on a desk' },
  { slug: 'location', heading: 'The best place to put a business', body: 'Location decides who finds you. Work through rent, zoning, traffic, and your second choice before you commit.', imageUrl: '/img/section-location.svg', imageAlt: 'A storefront on a busy street' },
  { slug: 'hiring', heading: 'What type of person to hire', body: 'The first hire sets the standard for everyone who comes after. Define the role, the person, what you can pay, and what success looks like.', imageUrl: '/img/section-hiring.svg', imageAlt: 'A small team working together' },
  { slug: 'people', heading: 'The people who come to your business', body: 'Who are your customers, what brings them to you, how do they find you, and what makes them come back?', imageUrl: '/img/section-people.svg', imageAlt: 'Customers being served at a counter' },
  { slug: 'the-answer-is-yours', heading: 'The question is ours. The answer is yours.', body: 'Your answers are kept under your business title so you can grade, rank, print, and return to them as your business grows.', imageUrl: '/img/section-answers.svg', imageAlt: 'Handwritten answers in a workbook' }
];

router.get('/landing', (req, res) => res.json({ sections }));

module.exports = router;