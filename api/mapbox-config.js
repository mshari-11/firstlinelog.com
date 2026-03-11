/**
 * Vercel Serverless Function — Mapbox Config
 * Returns the Mapbox public token from environment variables.
 * Set MAPBOX_TOKEN in Vercel Dashboard → Settings → Environment Variables
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://fll.sa');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const token = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';

  if (!token) {
    return res.status(503).json({ error: 'Mapbox token not configured' });
  }

  res.status(200).json({ token });
}
