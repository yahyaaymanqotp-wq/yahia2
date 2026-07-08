export default async function handler(req, res) {
  const { targetId, targetRole, playerId, title, message } = req.body;
  let body = {
    app_id: "bfab6c71-028a-40bb-bcb3-8457499dafb2",
    headings: { en: title },
    contents: { en: message },
  };
  if (playerId) {
    body.include_subscription_ids = [playerId];
  } else if (targetId) {
    body.filters = [{ field: "tag", key: "user_id", relation: "=", value: targetId }];
  } else {
    body.filters = [{ field: "tag", key: "role", relation: "=", value: targetRole }];
  }
  const resp = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Basic NzZkY2E3OWMtZWEyMS00MmEwLTkyYTQtNTdmYzQyYThmN2Q1" },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  res.status(200).json(data);
}