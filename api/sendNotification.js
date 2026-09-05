export default async function handler(req, res) {
  const { targetId, targetRole, title, message } = req.body;

  let json = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
  };

  if (targetId) {
    json.include_external_user_ids = [targetId];
    json.channel_for_external_user_ids = "push";
  } else if (targetRole) {
    json.filters = [{ field: "tag", key: "role", relation: "=", value: targetRole }];
  }

  const r = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify(json)
  });

  const data = await r.json();
  console.log("OneSignal Send:", JSON.stringify(data));
  console.log("Target:", targetId || targetRole);

  return res.status(200).json(data);
}