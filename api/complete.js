export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { paymentId, txid } = req.body;
  if (!paymentId || !txid) return res.status(400).json({ error: 'paymentId and txid required' });

  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_API_KEY missing' });

  const r = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ txid })
  });
  const data = await r.text();
  return res.status(r.status).send(data);
}
