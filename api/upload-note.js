import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // @vercel/blob multipart helper — reads the raw stream directly
    const { Readable } = await import('stream');

    // Collect raw body
    const chunks = [];
    let totalSize = 0;
    for await (const chunk of req) {
      totalSize += chunk.length;
      if (totalSize > MAX_BYTES) return res.status(400).json({ error: 'File exceeds 10 MB limit.' });
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || '';

    // Expect multipart/form-data; parse manually using busboy
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    const busboy = (await import('@fastify/busboy')).default;
    const bb = busboy({ headers: req.headers });

    const fileData = await new Promise((resolve, reject) => {
      let fileBuffer = null;
      let fileName = 'note.pdf';
      let fileMime = '';

      bb.on('file', (_field, stream, info) => {
        fileMime = info.mimeType;
        fileName = info.filename || 'note.pdf';
        const parts = [];
        stream.on('data', d => parts.push(d));
        stream.on('end', () => { fileBuffer = Buffer.concat(parts); });
      });
      bb.on('finish', () => {
        if (!fileBuffer) return reject(new Error('No file received.'));
        if (fileMime !== 'application/pdf') return reject(new Error('Only PDF files are allowed.'));
        resolve({ fileBuffer, fileName });
      });
      bb.on('error', reject);

      // Feed the already-buffered body into busboy
      const readable = new Readable();
      readable.push(body);
      readable.push(null);
      readable.pipe(bb);
    });

    const blob = await put(`notes/${Date.now()}-${fileData.fileName}`, fileData.fileBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('[upload-note]', err);
    return res.status(500).json({ error: err.message || 'Upload failed.' });
  }
}
