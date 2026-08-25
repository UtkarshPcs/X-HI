import backfill from './_ai/ai-backfill-concepts.js';
import macro from './_ai/ai-macro-review.js';
import periodic from './_ai/ai-periodic-report.js';
import personalize from './_ai/ai-personalize.js';
import searchNotes from './_ai/ai-search-notes.js';
import suggest from './_ai/ai-suggest-question.js';
import testReview from './_ai/ai-test-review.js';

export default async function handler(req, res) {
  // Try to get action from Vercel rewrite query, fallback to parsing the pathname
  let action = req.query?.action;
  
  if (!action) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/');
    const lastPart = parts.pop() || parts.pop(); // handle trailing slash
    if (lastPart.startsWith('ai-')) {
      action = lastPart.replace('ai-', '');
    }
  }

  switch(action) {
    case 'backfill-concepts': return backfill(req, res);
    case 'macro-review':      return macro(req, res);
    case 'periodic-report':   return periodic(req, res);
    case 'personalize':       return personalize(req, res);
    case 'search-notes':      return searchNotes(req, res);
    case 'suggest-question':  return suggest(req, res);
    case 'test-review':       return testReview(req, res);
    default: return res.status(404).json({ error: 'AI route not found' });
  }
}
