// pages/api/sendNotification.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const {
    targetId,
    targetRole,
    playerId,
    title,
    message
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      error: "title and message required"
    });
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return res.status(500).json({
      error: "OneSignal environment variables missing"
    });
  }

  let body = {
    app_id: appId,

    headings: {
      en: title
    },

    contents: {
      en: message
    }
  };


  // 🔔 إرسال لشخص واحد
  if (playerId) {

    body.include_subscription_ids = [
      playerId
    ];

  }


  // 🏪 إرسال لمستخدم معين
  else if (targetId) {

    body.filters = [
      {
        field: "tag",
        key: "user_id",
        relation: "=",
        value: String(targetId)
      }
    ];

  }


  // 👨‍💼🚚 إرسال حسب الدور
  else if (targetRole) {

    body.filters = [
      {
        field: "tag",
        key: "role",
        relation: "=",
        value: String(targetRole)
      }
    ];

  }


  else {

    return res.status(400).json({
      error: "No target specified"
    });

  }


  try {

    const response = await fetch(
      "https://api.onesignal.com/notifications",
      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Authorization":
            `Key ${apiKey}`

        },

        body: JSON.stringify(body)

      }
    );


    const data = await response.json();


    console.log(
      "OneSignal Response:",
      data
    );


    if (!response.ok) {

      console.error(
        "OneSignal Error:",
        data
      );

      return res.status(response.status).json(data);

    }


    return res.status(200).json({
      success: true,
      data
    });


  } catch (error) {

    console.error(
      "Notification Error:",
      error
    );

    return res.status(500).json({

      error: error.message

    });

  }

}