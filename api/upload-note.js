import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';

export const config = { api: { bodyParser: false } };

const MAX_BYTES = 10 * 1024 * 1024;

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: MAX_BYTES, filter: p => p.mimetype === 'application/pdf' });
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return reject(new Error('No PDF file received.'));
      resolve(file);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const file = await parseForm(req);
    const buffer = readFileSync(file.filepath);
    const blob = await put(`notes/${Date.now()}-${file.originalFilename || 'note.pdf'}`, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('[upload-note]', err);
    return res.status(500).json({ error: err.message || 'Upload failed.' });
  }
}
