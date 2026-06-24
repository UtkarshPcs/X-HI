import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || !url.startsWith('https://') || !url.includes('.public.blob.vercel-storage.com')) {
    return res.status(400).json({ error: 'Invalid blob URL.' });
  }

  try {
    await del(url);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[delete-note-blob]', err);
    return res.status(500).json({ error: err.message || 'Delete failed.' });
  }
}
