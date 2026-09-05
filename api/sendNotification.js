export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).end();
  const { title, message, playerId, targetId, targetRole } = req.body;

  let body = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: { ar: title, en: title },
    contents: { ar: message, en: message },
  };

  if(playerId) body.include_subscription_ids = [playerId];
  else if(targetId) {
    body.include_external_user_ids = [targetId];
    body.channel_for_external_user_ids = "push";
  }
  else if(targetRole) {
    body.filters = [{ field: "tag", key: "role", relation: "=", value: targetRole }];
  }
  else body.included_segments = ["All"];

  const r = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  res.status(200).json(data);
}