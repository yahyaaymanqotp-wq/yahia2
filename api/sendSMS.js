export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).end();
  const { phone, message } = req.body;
  let formattedPhone = phone.startsWith('0')? '2'+phone : phone;
  try {
    const r = await fetch('https://smsmisr.com/api/SMS/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.SMS_MISR_USERNAME,
        password: process.env.SMS_MISR_PASSWORD,
        language: '2',
        sender: process.env.SMS_MISR_SENDER,
        mobile: formattedPhone,
        message,
        environment: '1'
      })
    });
    const data = await r.json();
    res.status(200).json(data);
  } catch(e){ res.status(500).json({error:e.message}) }
}