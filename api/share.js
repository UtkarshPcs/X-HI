import hwShare from './_shares/hw-share.js';
import mathsShare from './_shares/maths-share.js';
import customTestShare from './_shares/custom-test-share.js';
import noteShare from './_shares/note-share.js';
import noticeShare from './_shares/notice-share.js';
import pageShare from './_shares/page-share.js';

export default async function handler(req, res) {
  let action = req.query?.action;
  
  if (!action) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/');
    const last = parts.pop() || parts.pop();
    if (last === 'maths-share') action = 'maths';
    else if (last === 'custom-test-share') action = 'custom-test';
    else if (last === 'note-share') action = 'note';
    else if (last === 'notice-share') action = 'notice';
    else if (last === 'page-share') action = 'page';
    else action = 'hw'; // fallback for /share/...
  }

  switch (action) {
    case 'maths': return mathsShare(req, res);
    case 'custom-test': return customTestShare(req, res);
    case 'note': return noteShare(req, res);
    case 'notice': return noticeShare(req, res);
    case 'page': return pageShare(req, res);
    case 'hw': 
    default: 
      return hwShare(req, res);
  }
}
