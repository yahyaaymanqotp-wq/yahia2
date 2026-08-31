// pages/api/sendNotification.js

export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { targetId, targetRole, playerId, title, message } = req.body;

  if (!title ||!message) {
    return res.status(400).json({ error: 'title and message required' });
  }

  let body = {
    app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "bfab6c71-028a-40bb-bcb3-8457499dafb2",
    headings: { en: title, ar: title },
    contents: { en: message, ar: message },
  };

  // 1. ابعت لشخص واحد مباشر - ده اللي هنستخدمه في لوحة التوصيل
  if (playerId) {
    // OneSignal الجديد بيستخدم subscription_ids
    body.include_subscription_ids = [playerId];
    // و القديم بيستخدم player_ids - بنحط الاتنين عشان يشتغل في كل الحالات
    body.include_player_ids = [playerId];
  }
  // 2. ابعت لشخص بـ user_id tag
  else if (targetId) {
    body.filters = [{ field: "tag", key: "user_id", relation: "=", value: targetId }];
  }
  // 3. ابعت لكل اللي ليهم role معين (مثلا كل العملاء)
  else if (targetRole) {
    body.filters = [{ field: "tag", key: "role", relation: "=", value: targetRole }];
  } else {
    return res.status(400).json({ error: 'No target specified' });
  }

  try {
    const resp = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY || "NzZkY2E3OWMtZWEyMS00MmEwLTkyYTQtNTdmYzQyYThmN2Q1"}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (data.errors) {
      console.error("OneSignal Error:", data.errors);
      return res.status(400).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}