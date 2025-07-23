import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertGameRoomSchema, insertGameAnswerSchema, insertPartnerInvitationSchema, insertGameInvitationSchema, type GameState, type TruthOrDareQuestion, type SyncQuestion, type Notification, type NotificationType } from "@shared/schema";
import { z } from "zod";

// Game data - Extended Truth or Dare Questions
const truthOrDareQuestions: TruthOrDareQuestion[] = [
  // Правда - личные вопросы
  { id: "t1", type: "truth", text: "Расскажи самый неловкий момент из детства" },
  { id: "t2", type: "truth", text: "Кто был твоей первой любовью?" },
  { id: "t3", type: "truth", text: "Какую самую большую ложь ты говорил родителям?" },
  { id: "t4", type: "truth", text: "О чём ты мечтаешь, но никому не рассказываешь?" },
  { id: "t5", type: "truth", text: "Какой твой самый странный страх или фобия?" },
  { id: "t6", type: "truth", text: "За что тебе больше всего стыдно?" },
  { id: "t7", type: "truth", text: "Какая твоя самая плохая привычка?" },
  { id: "t8", type: "truth", text: "Что ты делаешь, когда никто не видит?" },
  { id: "t9", type: "truth", text: "Какую тайну ты храните дольше всего?" },
  { id: "t10", type: "truth", text: "Кому ты больше всего завидуешь и почему?" },
  
  // Правда - отношения
  { id: "t11", type: "truth", text: "Что привлекает тебя в людях больше всего?" },
  { id: "t12", type: "truth", text: "Какой был твой самый неловкий момент на свидании?" },
  { id: "t13", type: "truth", text: "За что ты готов простить партнера, а за что - никогда?" },
  { id: "t14", type: "truth", text: "Какой самый романтический поступок совершали для тебя?" },
  { id: "t15", type: "truth", text: "Как ты понимаешь, что влюбился?" },
  
  // Правда - мечты и планы
  { id: "t16", type: "truth", text: "Где ты видишь себя через 10 лет?" },
  { id: "t17", type: "truth", text: "Какую суперспособность ты бы хотел иметь?" },
  { id: "t18", type: "truth", text: "В какую эпоху ты бы хотел жить и почему?" },
  { id: "t19", type: "truth", text: "Какое путешествие твоей мечты?" },
  { id: "t20", type: "truth", text: "Какую песню ты поешь в душе?" },
  
  // Действие - творческие
  { id: "d1", type: "dare", text: "Спой песню твоего детства с полной отдачей" },
  { id: "d2", type: "dare", text: "Изобрази любимое животное партнера в течение минуты" },
  { id: "d3", type: "dare", text: "Станцуй танец из популярного видео в TikTok" },
  { id: "d4", type: "dare", text: "Изобрази известную сцену из фильма без слов" },
  { id: "d5", type: "dare", text: "Нарисуй портрет партнера за 30 секунд" },
  { id: "d6", type: "dare", text: "Расскажи анекдот с серьезным лицом" },
  { id: "d7", type: "dare", text: "Изобрази эмоции только мимикой: радость, грусть, удивление" },
  { id: "d8", type: "dare", text: "Придумай и исполни рэп о ваших отношениях" },
  
  // Действие - смешные
  { id: "d9", type: "dare", text: "Говори в течение минуты только рифмами" },
  { id: "d10", type: "dare", text: "Изобрази робота, который пытается танцевать" },
  { id: "d11", type: "dare", text: "Расскажи историю из детства голосом мультяшного персонажа" },
  { id: "d12", type: "dare", text: "Ходи как манекен в течение 2 минут" },
  { id: "d13", type: "dare", text: "Изобрази, как ты просыпаешься утром в замедленной съемке" },
  { id: "d14", type: "dare", text: "Попытайся съесть что-то без использования рук" },
  { id: "d15", type: "dare", text: "Сделай селфи в смешной позе и покажи" },
  
  // Действие - физические вызовы
  { id: "d16", type: "dare", text: "Сделай 20 приседаний, считая вслух" },
  { id: "d17", type: "dare", text: "Попробуй коснуться носа языком" },
  { id: "d18", type: "dare", text: "Стой на одной ноге в течение минуты" },
  { id: "d19", type: "dare", text: "Сделай планку на 30 секунд" },
  { id: "d20", type: "dare", text: "Попытайся медитировать в течение 2 минут, издавая звуки 'Ом'" },
];

const syncQuestions: SyncQuestion[] = [
  { id: "s1", text: "Ваша любимая еда?", options: ["Бургер", "Суши", "Паста", "Стейк"] },
  { id: "s2", text: "Идеальный отдых?", options: ["Пляж", "Горы", "Город", "Дома"] },
  { id: "s3", text: "Любимый жанр фильмов?", options: ["Комедия", "Драма", "Боевик", "Ужасы"] },
  { id: "s4", text: "Предпочитаемое время дня?", options: ["Утро", "День", "Вечер", "Ночь"] },
  { id: "s5", text: "Любимое время года?", options: ["Весна", "Лето", "Осень", "Зима"] },
];

interface WebSocketClient {
  ws: WebSocket;
  userId: number;
  roomId?: number;
  connectionId: string;
}

const clients = new Map<string, WebSocketClient>();
const userConnections = new Map<number, Set<string>>();
const roomConnections = new Map<number, Set<string>>();

function broadcast(roomId: number, message: any, excludeUserId?: number) {
  Array.from(clients.values())
    .filter(client => client.roomId === roomId && client.userId !== excludeUserId)
    .forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
}

function sendNotification(userId: number, notification: Notification) {
  const userConnections = Array.from(clients.values()).filter(client => client.userId === userId);
  userConnections.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'notification',
        notification
      }));
    }
  });
}

function generateConnectionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function addUserConnection(userId: number, connectionId: string) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(connectionId);
}

function removeUserConnection(userId: number, connectionId: string) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(connectionId);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }
}

// Auto-play function for test partner
async function handleTestPartnerTurn(roomId: number) {
  try {
    const room = await storage.getGameRoom(roomId);
    if (!room || room.currentPlayer !== 999) return;

    if (room.gameType === 'truth_or_dare') {
      // Auto-choose truth or dare randomly
      const choice = Math.random() > 0.5 ? 'truth' : 'dare';
      const questions = choice === 'truth' ? 
        truthOrDareQuestions.filter(q => q.type === 'truth') :
        truthOrDareQuestions.filter(q => q.type === 'dare');
      
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      const gameState: GameState = room.gameData as GameState || {
        currentQuestionIndex: 0,
        player1Score: 0,
        player2Score: 0
      };
      
      gameState.currentQuestion = randomQuestion;
      
      await storage.updateGameRoom(roomId, { gameData: gameState });
      
      broadcast(roomId, {
        type: 'question_assigned',
        question: randomQuestion,
        currentPlayer: 999
      });

      // Auto-complete the question after 3 seconds
      setTimeout(async () => {
        const completed = Math.random() > 0.3; // 70% chance of completing
        
        const updatedRoom = await storage.getGameRoom(roomId);
        if (updatedRoom) {
          const updatedGameState: GameState = updatedRoom.gameData as GameState || {
            currentQuestionIndex: 0,
            player1Score: 0,
            player2Score: 0
          };
          
          if (completed) {
            updatedGameState.player2Score += 1;
          }
          
          // Switch turn back to human player
          const nextPlayer = updatedRoom.player1Id;
          
          await storage.updateGameRoom(roomId, { 
            currentPlayer: nextPlayer,
            gameData: updatedGameState 
          });
          
          broadcast(roomId, {
            type: 'turn_changed',
            currentPlayer: nextPlayer,
            scores: {
              player1Score: updatedGameState.player1Score,
              player2Score: updatedGameState.player2Score
            }
          });
        }
      }, 3000);
      
    } else if (room.gameType === 'sync') {
      // Auto-answer sync questions
      const answers = await storage.getGameAnswers(roomId);
      const currentGameState = room.gameData as GameState;
      
      if (currentGameState && typeof currentGameState.currentQuestionIndex === 'number') {
        const currentQuestion = syncQuestions[currentGameState.currentQuestionIndex];
        if (currentQuestion) {
          const hasAnswered = answers.some(a => 
            a.questionId === currentQuestion.id && a.playerId === 999
          );
          
          if (!hasAnswered) {
            // Randomly choose an answer
            const randomAnswer = currentQuestion.options[Math.floor(Math.random() * currentQuestion.options.length)];
            
            await storage.createGameAnswer({
              roomId,
              playerId: 999,
              questionId: currentQuestion.id,
              answer: randomAnswer,
              completed: true
            });
            
            // Check if both players have now answered
            const allAnswers = await storage.getGameAnswers(roomId);
            const currentQuestionAnswers = allAnswers.filter(a => a.questionId === currentQuestion.id);
            
            if (currentQuestionAnswers.length === 2) {
              const player1Answer = currentQuestionAnswers.find(a => a.playerId === room.player1Id);
              const player2Answer = currentQuestionAnswers.find(a => a.playerId === room.player2Id);
              
              const isMatch = player1Answer?.answer === player2Answer?.answer;
              
              const gameState: GameState = room.gameData as GameState || {
                currentQuestionIndex: 0,
                player1Score: 0,
                player2Score: 0,
                totalQuestions: 5
              };
              
              if (isMatch) {
                gameState.player1Score += 10;
                gameState.player2Score += 10;
              }
              
              gameState.currentQuestionIndex += 1;
              
              await storage.updateGameRoom(roomId, { gameData: gameState });
              
              broadcast(roomId, {
                type: 'sync_result',
                isMatch,
                answers: {
                  player1: player1Answer?.answer,
                  player2: player2Answer?.answer
                },
                scores: {
                  player1Score: gameState.player1Score,
                  player2Score: gameState.player2Score
                },
                nextQuestion: gameState.currentQuestionIndex < syncQuestions.length ? 
                  syncQuestions[gameState.currentQuestionIndex] : null,
                gameFinished: gameState.currentQuestionIndex >= syncQuestions.length
              });
            } else {
              // Notify that test partner answered
              broadcast(roomId, {
                type: 'partner_answered',
                playerId: 999
              }, 999);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Test partner auto-play error:', error);
  }
}

// Auto-answer function for test partner in sync games
async function handleTestPartnerSyncAnswer(roomId: number, questionId: string) {
  try {
    const room = await storage.getGameRoom(roomId);
    if (!room || room.gameType !== 'sync') return;

    const answers = await storage.getGameAnswers(roomId);
    const hasAnswered = answers.some(a => 
      a.questionId === questionId && a.playerId === 999
    );
    
    if (hasAnswered) return; // Already answered

    const currentQuestion = syncQuestions.find(q => q.id === questionId);
    if (!currentQuestion) return;

    // Randomly choose an answer (sometimes match human player's choice)
    const humanAnswer = answers.find(a => 
      a.questionId === questionId && a.playerId !== 999
    );
    
    let randomAnswer;
    if (humanAnswer && Math.random() > 0.6) {
      // 40% chance to match human's answer for more fun
      randomAnswer = humanAnswer.answer;
    } else {
      // Random choice
      randomAnswer = currentQuestion.options[Math.floor(Math.random() * currentQuestion.options.length)];
    }
    
    await storage.createGameAnswer({
      roomId,
      playerId: 999,
      questionId,
      answer: randomAnswer,
      completed: true
    });
    
    // Check if both players have now answered
    const allAnswers = await storage.getGameAnswers(roomId);
    const currentQuestionAnswers = allAnswers.filter(a => a.questionId === questionId);
    
    if (currentQuestionAnswers.length === 2) {
      const player1Answer = currentQuestionAnswers.find(a => a.playerId === room.player1Id);
      const player2Answer = currentQuestionAnswers.find(a => a.playerId === room.player2Id);
      
      const isMatch = player1Answer?.answer === player2Answer?.answer;
      
      const gameState: GameState = room.gameData as GameState || {
        currentQuestionIndex: 0,
        player1Score: 0,
        player2Score: 0,
        totalQuestions: 5
      };
      
      if (isMatch) {
        gameState.player1Score += 10;
        gameState.player2Score += 10;
      }
      
      gameState.currentQuestionIndex += 1;
      
      await storage.updateGameRoom(roomId, { gameData: gameState });
      
      broadcast(roomId, {
        type: 'sync_result',
        isMatch,
        answers: {
          player1: player1Answer?.answer,
          player2: player2Answer?.answer
        },
        scores: {
          player1Score: gameState.player1Score,
          player2Score: gameState.player2Score
        },
        nextQuestion: gameState.currentQuestionIndex < syncQuestions.length ? 
          syncQuestions[gameState.currentQuestionIndex] : null,
        gameFinished: gameState.currentQuestionIndex >= syncQuestions.length
      });
      
      // Update user stats if game finished
      if (gameState.currentQuestionIndex >= syncQuestions.length) {
        const user1 = await storage.getUser(room.player1Id);
        const user2 = await storage.getUser(room.player2Id);
        
        if (user1 && user1.id !== 999) {
          await storage.updateUser(user1.id, {
            gamesPlayed: user1.gamesPlayed + 1,
            syncScore: Math.round((gameState.player1Score / (syncQuestions.length * 10)) * 100)
          });
        }
        
        if (user2 && user2.id !== 999) {
          await storage.updateUser(user2.id, {
            gamesPlayed: user2.gamesPlayed + 1,
            syncScore: Math.round((gameState.player2Score / (syncQuestions.length * 10)) * 100)
          });
        }
        
        await storage.updateGameRoom(roomId, { status: 'finished' });
      }
    } else {
      // Notify that test partner answered
      broadcast(roomId, {
        type: 'partner_answered',
        playerId: 999
      }, 999);
    }
  } catch (error) {
    console.error('Test partner sync answer error:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  // Упрощённый вход для демо (без Telegram)
  app.post("/api/auth/demo", async (req, res) => {
    try {
      const { username, avatar = '0' } = req.body;
      
      // Проверяем, существует ли пользователь
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Создаём демо пользователя
        const userData = {
          telegramId: `demo_${Date.now()}`,
          username,
          firstName: username,
          lastName: null,
          avatar
        };
        user = await storage.createUser(userData);
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Enhanced Telegram Web App authentication
  app.post("/api/auth/telegram", async (req, res) => {
    try {
      const { initData } = req.body;
      
      if (!initData) {
        return res.status(400).json({ error: 'Missing initData' });
      }

      // Parse Telegram Web App init data
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get('user');
      
      if (!userStr) {
        return res.status(400).json({ error: 'Invalid initData' });
      }

      const telegramUser = JSON.parse(userStr);
      const telegramId = telegramUser.id.toString();
      const username = telegramUser.username || telegramUser.first_name || `User${telegramUser.id}`;
      const firstName = telegramUser.first_name || null;
      const lastName = telegramUser.last_name || null;

      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // Create new user
        const userData = {
          telegramId,
          username,
          firstName,
          lastName,
          avatar: Math.floor(Math.random() * 4).toString()
        };
        user = await storage.createUser(userData);
      } else {
        // Update existing user data
        user = await storage.updateUser(user.id, {
          username: username || user.username,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName
        }) || user;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Authentication failed" });
    }
  });

  app.get("/api/users/search", async (req, res) => {
    try {
      const { q } = z.object({ q: z.string() }).parse(req.query);
      const users = await storage.findUsersByPartialUsername(q);
      
      // Всегда включаем тестового партнёра в результаты поиска
      const testPartner = await storage.getUser(999);
      if (testPartner && !users.find(u => u.id === 999)) {
        users.unshift(testPartner);
      }
      
      res.json(users.slice(0, 10)); // Limit results
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid query" });
    }
  });

  // New invitation-based partner system
  app.post("/api/partner-invitations", async (req, res) => {
    try {
      const invitationData = insertPartnerInvitationSchema.parse(req.body);
      
      // Check if there's already a pending invitation
      const existingInvitations = await storage.getUserPartnerInvitations(invitationData.toUserId);
      const existingInvitation = existingInvitations.find(inv => inv.fromUserId === invitationData.fromUserId);
      
      if (existingInvitation) {
        return res.status(400).json({ message: "Invitation already sent" });
      }
      
      const invitation = await storage.createPartnerInvitation(invitationData);
      const fromUser = await storage.getUser(invitationData.fromUserId);
      
      if (fromUser) {
        // Send real-time notification for pending invitation
        sendNotification(invitationData.toUserId, {
          id: `partner_pending_${invitation.id}`,
          type: 'partner_invitation_received',
          fromUser: { id: fromUser.id, username: fromUser.username, avatar: fromUser.avatar },
          invitationId: invitation.id,
          createdAt: invitation.createdAt
        });
      }
      
      res.json(invitation);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/partner-invitations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const invitations = await storage.getUserPartnerInvitations(userId);
      
      // Include sender information
      const invitationsWithSenders = await Promise.all(invitations.map(async (inv) => {
        const sender = await storage.getUser(inv.fromUserId);
        return { ...inv, fromUser: sender };
      }));
      
      res.json(invitationsWithSenders);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  // Get sent partner invitations for user
  app.get("/api/partner-invitations/sent/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const invitations = await storage.getSentPartnerInvitations(userId);
      
      // Include recipient information
      const invitationsWithRecipients = await Promise.all(invitations.map(async (inv) => {
        const recipient = await storage.getUser(inv.toUserId);
        return { ...inv, toUser: recipient };
      }));
      
      res.json(invitationsWithRecipients);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  app.post("/api/partner-invitations/:id/respond", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const { action } = z.object({ action: z.enum(['accept', 'decline']) }).parse(req.body);
      
      const invitation = await storage.getPartnerInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      const status = action === 'accept' ? 'accepted' : 'declined';
      await storage.updatePartnerInvitation(invitationId, { status });
      
      if (action === 'accept') {
        // Set partners for both users
        await storage.updateUser(invitation.fromUserId, { partnerId: invitation.toUserId });
        await storage.updateUser(invitation.toUserId, { partnerId: invitation.fromUserId });
        
        // Get both users for real-time updates
        const [fromUser, toUser] = await Promise.all([
          storage.getUser(invitation.fromUserId),
          storage.getUser(invitation.toUserId)
        ]);
        
        if (fromUser && toUser) {
          // Send real-time partner updates to both users
          sendNotification(invitation.fromUserId, {
            id: `partner_update_${invitationId}`,
            type: 'partner_update',
            partner: toUser,
            createdAt: new Date()
          });
          
          sendNotification(invitation.toUserId, {
            id: `partner_update_accepted_${invitationId}`,
            type: 'partner_update',
            partner: fromUser,
            createdAt: new Date()
          });
        }
      } else {
        // Notify the inviter about decline
        const toUser = await storage.getUser(invitation.toUserId);
        if (toUser) {
          sendNotification(invitation.fromUserId, {
            id: `partner_decline_${invitationId}`,
            type: 'partner_declined',
            fromUser: { id: toUser.id, username: toUser.username, avatar: toUser.avatar },
            invitationId,
            createdAt: new Date()
          });
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Keep old endpoint for backward compatibility (now creates invitation)
  app.post("/api/users/:id/partner", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { partnerId } = z.object({ partnerId: z.number() }).parse(req.body);
      
      // For test partner (ID: 999), instantly accept
      if (partnerId === 999) {
        const user = await storage.updateUser(userId, { partnerId });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        await storage.updateUser(partnerId, { partnerId: userId });
        return res.json(user);
      }
      
      // For real users, create invitation instead
      const invitationData = { fromUserId: userId, toUserId: partnerId };
      const invitation = await storage.createPartnerInvitation(invitationData);
      const fromUser = await storage.getUser(userId);
      
      if (fromUser) {
        sendNotification(partnerId, {
          id: `partner_inv_${invitation.id}`,
          type: 'partner_invitation',
          fromUser: { id: fromUser.id, username: fromUser.username, avatar: fromUser.avatar },
          invitationId: invitation.id,
          createdAt: invitation.createdAt
        });
      }
      
      res.json({ success: true, message: "Partner invitation sent" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  // Game invitation endpoints
  app.post("/api/game-invitations", async (req, res) => {
    try {
      const body = req.body;
      // Convert expiresAt from ISO string to Date if present
      if (body.expiresAt && typeof body.expiresAt === 'string') {
        body.expiresAt = new Date(body.expiresAt);
      }
      const invitationData = insertGameInvitationSchema.parse(body);
      
      // Check if users are partners
      const fromUser = await storage.getUser(invitationData.fromUserId);
      const toUser = await storage.getUser(invitationData.toUserId);
      
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (fromUser.partnerId !== toUser.id) {
        return res.status(400).json({ message: "Can only invite partners to games" });
      }
      
      // Check for existing pending invitation
      const existingInvitations = await storage.getUserGameInvitations(invitationData.toUserId);
      const existingInvitation = existingInvitations.find(inv => 
        inv.fromUserId === invitationData.fromUserId && inv.gameType === invitationData.gameType
      );
      
      if (existingInvitation) {
        return res.status(400).json({ message: "Game invitation already sent" });
      }
      
      const invitation = await storage.createGameInvitation(invitationData);
      
      // Send real-time notification
      sendNotification(invitationData.toUserId, {
        id: `game_inv_${invitation.id}`,
        type: 'game_invitation',
        fromUser: { id: fromUser.id, username: fromUser.username, avatar: fromUser.avatar },
        gameType: invitationData.gameType,
        invitationId: invitation.id,
        createdAt: invitation.createdAt
      });
      
      res.json(invitation);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/game-invitations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Clean up expired invitations first
      await storage.expireOldGameInvitations();
      
      const invitations = await storage.getUserGameInvitations(userId);
      
      // Include sender information
      const invitationsWithSenders = await Promise.all(invitations.map(async (inv) => {
        const sender = await storage.getUser(inv.fromUserId);
        return { ...inv, fromUser: sender };
      }));
      
      res.json(invitationsWithSenders);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  app.post("/api/game-invitations/:id/respond", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const { action } = z.object({ action: z.enum(['accept', 'decline']) }).parse(req.body);
      
      const invitation = await storage.getGameInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation already responded to" });
      }
      
      if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      const status = action === 'accept' ? 'accepted' : 'declined';
      
      if (action === 'accept') {
        // Create game room
        const gameRoom = await storage.createGameRoom({
          player1Id: invitation.fromUserId,
          player2Id: invitation.toUserId,
          gameType: invitation.gameType,
          currentPlayer: invitation.fromUserId,
          gameData: {
            currentQuestionIndex: 0,
            player1Score: 0,
            player2Score: 0,
            totalQuestions: invitation.gameType === 'sync' ? 5 : undefined
          }
        });
        
        await storage.updateGameInvitation(invitationId, { status, roomId: gameRoom.id });
        
        // Notify both players about the accepted game with room ID
        const toUser = await storage.getUser(invitation.toUserId);
        if (toUser) {
          sendNotification(invitation.fromUserId, {
            id: `game_accept_${invitationId}`,
            type: 'game_accepted',
            fromUser: { id: toUser.id, username: toUser.username, avatar: toUser.avatar },
            gameType: invitation.gameType,
            invitationId,
            roomId: gameRoom.id,
            createdAt: new Date()
          });
        }

        // Send game start signal to both players in the room
        const gameStartMessage = {
          type: 'game_start',
          roomId: gameRoom.id,
          gameType: invitation.gameType,
          players: {
            player1: await storage.getUser(gameRoom.player1Id),
            player2: await storage.getUser(gameRoom.player2Id)
          }
        };

        // Send to both players via WebSocket - use user connections since players may not be in room yet
        [gameRoom.player1Id, gameRoom.player2Id].forEach(playerId => {
          // Find all user connections for this player
          for (const client of clients.values()) {
            if (client.userId === playerId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify(gameStartMessage));
            }
          }
        });
        
        res.json({ success: true, roomId: gameRoom.id });
      } else {
        await storage.updateGameInvitation(invitationId, { status });
        
        // Notify the inviter about decline
        const toUser = await storage.getUser(invitation.toUserId);
        if (toUser) {
          sendNotification(invitation.fromUserId, {
            id: `game_decline_${invitationId}`,
            type: 'game_declined',
            fromUser: { id: toUser.id, username: toUser.username, avatar: toUser.avatar },
            gameType: invitation.gameType,
            invitationId,
            createdAt: new Date()
          });
        }
        
        res.json({ success: true });
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Game room routes - Updated to use invitation system
  app.post("/api/games/create", async (req, res) => {
    try {
      const gameRoomData = insertGameRoomSchema.parse(req.body);
      
      // Check if this is for test partner, allow direct creation
      if (gameRoomData.player2Id === 999) {
        const gameRoom = await storage.createGameRoom(gameRoomData);
        res.json(gameRoom);
        return;
      }
      
      // For real partners, require invitation system
      // First check if there's an accepted game invitation
      const gameInvitations = await storage.getUserGameInvitations(gameRoomData.player2Id);
      const acceptedInvitation = Array.from((await Promise.all(
        gameInvitations.map(async inv => {
          const fullInv = await storage.getGameInvitation(inv.id);
          return fullInv;
        })
      )).filter(inv => 
        inv && inv.status === 'accepted' && inv.fromUserId === gameRoomData.player1Id && 
        inv.gameType === gameRoomData.gameType && !inv.roomId
      ))[0];
      
      if (acceptedInvitation) {
        // Create room for accepted invitation
        const gameRoom = await storage.createGameRoom(gameRoomData);
        await storage.updateGameInvitation(acceptedInvitation.id, { roomId: gameRoom.id });
        res.json(gameRoom);
      } else {
        res.status(400).json({ message: "Game invitation required" });
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const gameRoom = await storage.getGameRoom(roomId);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }
      res.json(gameRoom);
    } catch (error) {
      res.status(400).json({ message: "Invalid room ID" });
    }
  });

  app.get("/api/games/user/:userId/active", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const gameRoom = await storage.getActiveGameRoomForUser(userId);
      res.json(gameRoom || null);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  app.get("/api/games/history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // This would normally fetch from database, but for demo we'll return empty array
      // In real implementation, you'd fetch game history from database
      res.json([]);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  // Game answers endpoint
  app.post("/api/game-answers", async (req, res) => {
    try {
      const answerData = req.body;
      const answer = await storage.createGameAnswer(answerData);
      res.json(answer);
    } catch (error) {
      console.error("Error creating game answer:", error);
      res.status(500).json({ message: "Failed to save answer" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    const connectionId = generateConnectionId();
    let userId: number | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { userId: msgUserId, roomId } = message;
          userId = msgUserId;
          
          // Store this specific connection
          const client = { ws, userId: msgUserId, roomId, connectionId };
          clients.set(connectionId, client);
          addUserConnection(msgUserId, connectionId);
          
          // Add to room connections
          if (!roomConnections.has(roomId)) {
            roomConnections.set(roomId, new Set());
          }
          roomConnections.get(roomId)!.add(connectionId);
          
          console.log(`User ${msgUserId} connected with connection ${connectionId} to room ${roomId}`);
          
          // Get current players in room
          const playersInRoom = Array.from(clients.values())
            .filter(c => c.roomId === roomId)
            .map(c => c.userId);
          
          console.log(`Room ${roomId}: Connected players:`, playersInRoom);
          
        } else if (message.type === 'join_user_session') {
          const { userId: sessionUserId } = message;
          userId = sessionUserId;
          
          // Store this connection for notifications
          const client = { ws, userId: sessionUserId, connectionId };
          clients.set(connectionId, client);
          addUserConnection(sessionUserId, connectionId);
          
          console.log(`User ${sessionUserId} connected to user session with connection ${connectionId}`);
          
        } else if (message.type === 'truth_or_dare_choice') {
          const { choice, roomId: todRoomId, playerId } = message;
          const todRoom = await storage.getGameRoom(todRoomId);
          
          if (todRoom && todRoom.currentPlayer === playerId) {
            const questions = choice === 'truth' ? 
              truthOrDareQuestions.filter(q => q.type === 'truth') :
              truthOrDareQuestions.filter(q => q.type === 'dare');
            
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            
            const gameState: GameState = todRoom.gameData as GameState || {
              currentQuestionIndex: 0,
              player1Score: 0,
              player2Score: 0
            };
            
            gameState.currentQuestion = randomQuestion;
            
            await storage.updateGameRoom(todRoomId, { gameData: gameState });
            
            broadcast(todRoomId, {
              type: 'question_assigned',
              question: randomQuestion,
              currentPlayer: playerId
            });
          }
        } else if (message.type === 'truth_or_dare_complete') {
            const { roomId: completeRoomId, playerId: completePlayerId, completed } = message;
            const completeRoom = await storage.getGameRoom(completeRoomId);
            
            if (completeRoom) {
              const gameState: GameState = completeRoom.gameData as GameState || {
                currentQuestionIndex: 0,
                player1Score: 0,
                player2Score: 0
              };
              
              if (completed) {
                if (completePlayerId === completeRoom.player1Id) {
                  gameState.player1Score += 1;
                } else {
                  gameState.player2Score += 1;
                }
              }
              
              // Switch turn
              const nextPlayer = completeRoom.currentPlayer === completeRoom.player1Id ? 
                completeRoom.player2Id : completeRoom.player1Id;
              
              await storage.updateGameRoom(completeRoomId, { 
                currentPlayer: nextPlayer,
                gameData: gameState 
              });
              
              broadcast(completeRoomId, {
                type: 'turn_changed',
                currentPlayer: nextPlayer,
                scores: {
                  player1Score: gameState.player1Score,
                  player2Score: gameState.player2Score
                }
              });
              
              // Auto-play for test partner (ID: 999)
              if (nextPlayer === 999) {
                setTimeout(async () => {
                  await handleTestPartnerTurn(completeRoomId);
                }, 2000); // 2 second delay for realistic feel
              }
            }
        } else if (message.type === 'sync_answer') {
            const { roomId: syncRoomId, playerId: syncPlayerId, questionId, answer } = message;
            
            // Save the answer
            await storage.createGameAnswer({
              roomId: syncRoomId,
              playerId: syncPlayerId,
              questionId,
              answer,
              completed: true
            });
            
            // Check if both players have answered
            const syncRoom = await storage.getGameRoom(syncRoomId);
            if (syncRoom) {
              const answers = await storage.getGameAnswers(syncRoomId);
              const currentQuestionAnswers = answers.filter(a => a.questionId === questionId);
              
              if (currentQuestionAnswers.length === 2) {
                const player1Answer = currentQuestionAnswers.find(a => a.playerId === syncRoom.player1Id);
                const player2Answer = currentQuestionAnswers.find(a => a.playerId === syncRoom.player2Id);
                
                const isMatch = player1Answer?.answer === player2Answer?.answer;
                
                const gameState: GameState = syncRoom.gameData as GameState || {
                  currentQuestionIndex: 0,
                  player1Score: 0,
                  player2Score: 0,
                  totalQuestions: 5
                };
                
                if (isMatch) {
                  gameState.player1Score += 10;
                  gameState.player2Score += 10;
                }
                
                gameState.currentQuestionIndex += 1;
                
                await storage.updateGameRoom(syncRoomId, { gameData: gameState });
                
                broadcast(syncRoomId, {
                  type: 'sync_result',
                  isMatch,
                  answers: {
                    player1: player1Answer?.answer,
                    player2: player2Answer?.answer
                  },
                  scores: {
                    player1Score: gameState.player1Score,
                    player2Score: gameState.player2Score
                  },
                  nextQuestion: gameState.currentQuestionIndex < syncQuestions.length ? 
                    syncQuestions[gameState.currentQuestionIndex] : null,
                  gameFinished: gameState.currentQuestionIndex >= syncQuestions.length
                });
                
                // Update user stats if game finished
                if (gameState.currentQuestionIndex >= syncQuestions.length) {
                  const user1 = await storage.getUser(syncRoom.player1Id);
                  const user2 = await storage.getUser(syncRoom.player2Id);
                  
                  if (user1) {
                    await storage.updateUser(user1.id, {
                      gamesPlayed: user1.gamesPlayed + 1,
                      syncScore: Math.round((gameState.player1Score / (syncQuestions.length * 10)) * 100)
                    });
                  }
                  
                  if (user2) {
                    await storage.updateUser(user2.id, {
                      gamesPlayed: user2.gamesPlayed + 1,
                      syncScore: Math.round((gameState.player2Score / (syncQuestions.length * 10)) * 100)
                    });
                  }
                  
                  await storage.updateGameRoom(syncRoomId, { status: 'finished' });
                }
              } else {
                // Notify partner that player has answered
                broadcast(syncRoomId, {
                  type: 'partner_answered',
                  playerId: syncPlayerId
                }, syncPlayerId);
                
                // Auto-answer for test partner if they haven't answered yet
                if ((syncRoom.player1Id === 999 || syncRoom.player2Id === 999) && syncPlayerId !== 999) {
                  setTimeout(async () => {
                    await handleTestPartnerSyncAnswer(syncRoomId, questionId);
                  }, 1500); // 1.5 second delay
                }
              }
            }
        } else if (message.type === 'start_sync_game') {
            const { roomId: startSyncRoomId } = message;
            const startSyncRoom = await storage.getGameRoom(startSyncRoomId);
            
            if (startSyncRoom) {
              const gameState: GameState = {
                currentQuestionIndex: 0,
                player1Score: 0,
                player2Score: 0,
                totalQuestions: syncQuestions.length,
                currentQuestion: syncQuestions[0]
              };
              
              await storage.updateGameRoom(startSyncRoomId, { 
                gameData: gameState,
                status: 'active'
              });
              
              broadcast(startSyncRoomId, {
                type: 'sync_question',
                question: syncQuestions[0],
                questionIndex: 0,
                totalQuestions: syncQuestions.length
              });
              
              // Auto-start for test partner
              if (startSyncRoom.player1Id === 999 || startSyncRoom.player2Id === 999) {
                setTimeout(async () => {
                  await handleTestPartnerSyncAnswer(startSyncRoomId, syncQuestions[0].id);
                }, 2000); // 2 second delay
              }
            }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        console.log(`User ${userId} disconnected connection ${connectionId}`);
        const client = clients.get(connectionId);
        if (client?.roomId) {
          roomConnections.get(client.roomId)?.delete(connectionId);
          if (roomConnections.get(client.roomId)?.size === 0) {
            roomConnections.delete(client.roomId);
          }
        }
        clients.delete(connectionId);
        removeUserConnection(userId, connectionId);
      }
    });
  });

  return httpServer;
}
