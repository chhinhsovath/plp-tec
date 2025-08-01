const https = require('https');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const domain = 'tec.openplp.com'; // Your domain

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

// Note: This needs to be done manually through BotFather
console.log(`
📱 To enable Telegram Login for your bot:

1. Open Telegram and go to @BotFather
2. Send: /mybots
3. Select: @plp_tec_bot
4. Click: Bot Settings
5. Click: Domain
6. Send: ${domain}

This will enable the Telegram Login Widget for your domain.

✅ Once done, users will be able to:
   - Sign in with Telegram on the login page
   - Automatically link their accounts
   - Access the LMS without creating a password

🔒 Security features implemented:
   - Hash verification for authenticity
   - 5-minute auth expiration
   - Automatic account creation/linking
   - JWT token generation for session

📝 Next steps:
   1. Deploy your app to ${domain}
   2. Set the domain in BotFather
   3. Test the login flow
`);