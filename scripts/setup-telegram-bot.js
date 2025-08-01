const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

const bot = new TelegramBot(token);

async function setupBot() {
  try {
    // Set bot commands
    await bot.setMyCommands([
      { command: 'start', description: 'Start the bot and link your account' },
      { command: 'help', description: 'Show help information' },
      { command: 'link', description: 'Link your LMS account' },
      { command: 'unlink', description: 'Unlink your LMS account' },
      { command: 'courses', description: 'View your enrolled courses' },
      { command: 'assignments', description: 'Check pending assignments' },
      { command: 'notifications', description: 'Toggle notifications on/off' },
      { command: 'chat', description: 'Start AI chat session' },
    ]);
    
    console.log('✅ Bot commands set successfully!');
    
    // Get bot info
    const botInfo = await bot.getMe();
    console.log('\n📱 Bot Information:');
    console.log(`- Name: ${botInfo.first_name}`);
    console.log(`- Username: @${botInfo.username}`);
    console.log(`- ID: ${botInfo.id}`);
    console.log(`- Link: https://t.me/${botInfo.username}`);
    
    // Set webhook for production (optional)
    if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
      const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`;
      await bot.setWebHook(webhookUrl);
      console.log(`\n🔗 Webhook set to: ${webhookUrl}`);
    } else {
      console.log('\n💡 Running in development mode - using polling');
    }
    
    console.log('\n✨ Bot setup complete! You can now use your bot.');
    
  } catch (error) {
    console.error('Error setting up bot:', error);
  }
  
  process.exit(0);
}

setupBot();