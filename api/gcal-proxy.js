// Vercel serverless proxy — fetches Google Calendar public ICS to avoid CORS
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // Security: only allow Google Calendar ICS URLs
  const ALLOWED_PREFIXES = [
    'https://calendar.google.com/calendar/ical/',
    'https://www.google.com/calendar/ical/',
  ];
  if (!ALLOWED_PREFIXES.some(p => url.startsWith(p))) {
    return res.status(403).json({ error: 'Only Google Calendar ICS URLs are allowed' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'iLEAD-Dashboard/1.0' },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Calendar returned ${response.status}` });
    }
    const text = await response.text();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
