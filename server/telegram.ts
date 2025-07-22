import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';

let bot: TelegramBot | null = null;

export function initializeTelegramBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN not found, skipping Telegram bot initialization');
    return null;
  }

  try {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const username = msg.from?.username || msg.from?.first_name || `User${userId}`;

      if (!userId) return;

      try {
        // Check if user exists
        let user = await storage.getUserByTelegramId(userId.toString());
        
        if (!user) {
          // Create new user
          user = await storage.createUser({
            telegramId: userId.toString(),
            username: username,
            firstName: msg.from?.first_name || null,
            lastName: msg.from?.last_name || null,
            avatar: Math.floor(Math.random() * 4).toString()
          });
        }

        if (msg.text === '/start') {
          const welcomeText = `
🎮 Добро пожаловать в Couple Games!

Это интерактивное приложение для пар с двумя увлекательными играми:

💕 **Правда или Действие** - Классическая игра в современном формате
🎯 **Синхронизация** - Проверьте насколько вы совпадаете

Нажмите кнопку ниже, чтобы открыть приложение:
          `;

          await bot!.sendMessage(chatId, welcomeText, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Запустить приложение',
                    web_app: {
                      url: `${process.env.REPLIT_DEV_DOMAIN || 'https://your-app-domain.replit.app'}`
                    }
                  }
                ]
              ]
            }
          });
        } else if (msg.text === '/help') {
          const helpText = `
❓ **Помощь по Couple Games**

**Доступные команды:**
/start - Запустить приложение
/help - Показать эту справку
/profile - Ваш профиль
/stats - Статистика игр

**Как играть:**
1. Найдите партнера через поиск
2. Выберите игру (Правда или Действие / Синхронизация)
3. Играйте и получайте удовольствие!

**Игры:**
🎮 **Правда или Действие** - Отвечайте на вопросы или выполняйте задания
🎯 **Синхронизация** - Отвечайте на вопросы одновременно с партнером
          `;

          await bot!.sendMessage(chatId, helpText);
        } else if (msg.text === '/profile') {
          const profileText = `
👤 **Ваш профиль**

🆔 ID: #${user.id}
📝 Имя: ${user.username}
🎮 Игр сыграно: ${user.gamesPlayed}
🎯 Синхронизация: ${user.syncScore}%
${user.partnerId ? `💕 Партнер: Связан` : '💔 Партнер: Не найден'}

Откройте приложение для подробной статистики!
          `;

          await bot!.sendMessage(chatId, profileText, {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📊 Открыть профиль',
                    web_app: {
                      url: `${process.env.REPLIT_DEV_DOMAIN || 'https://your-app-domain.replit.app'}/profile`
                    }
                  }
                ]
              ]
            }
          });
        } else {
          // Default response with app button
          await bot!.sendMessage(chatId, 'Нажмите кнопку ниже, чтобы открыть Couple Games:', {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🎮 Открыть игру',
                    web_app: {
                      url: `${process.env.REPLIT_DEV_DOMAIN || 'https://your-app-domain.replit.app'}`
                    }
                  }
                ]
              ]
            }
          });
        }
      } catch (error) {
        console.error('Error handling Telegram message:', error);
        await bot!.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
      }
    });

    bot.on('web_app_data', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const data = JSON.parse(msg.web_app_data!.data);

      console.log('Web App data received:', data);

      // Handle different types of web app data
      if (data.type === 'game_completed') {
        await bot!.sendMessage(chatId, `🎉 Игра завершена! Ваш результат: ${data.score} очков`);
      }
    });

    console.log('✅ Telegram bot initialized successfully');
    return bot;
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error);
    return null;
  }
}

export function getTelegramBot() {
  return bot;
}