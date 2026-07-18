export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });

  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_API_KEY missing' });

  const r = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${apiKey}` }
  });
  const data = await r.text();
  return res.status(r.status).send(data);
}
