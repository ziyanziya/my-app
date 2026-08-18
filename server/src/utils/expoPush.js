const db = require('../config/db');

async function broadcastNewSection(title, body, screen) {
  try {
    const query = `
      SELECT u.push_token
      FROM users u
      LEFT JOIN settings s ON u.id = s.user_id AND s.setting_key = 'push_notify_new_sections'
      WHERE u.push_token IS NOT NULL
        AND (s.value IS NULL OR s.value NOT LIKE '%false%')
    `;
    const [rows] = await db.query(query);
    const tokens = rows.map((r) => r.push_token).filter(t => t);
    
    if (tokens.length === 0) return;

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { screen: screen || 'index' },
    }));

    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    }

    console.log(`Broadcasted push notification to ${tokens.length} users in ${chunks.length} batches`);
  } catch (error) {
    console.error('Error broadcasting push notification:', error);
  }
}

module.exports = { broadcastNewSection };
