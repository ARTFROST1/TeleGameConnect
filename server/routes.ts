import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertGameRoomSchema, insertGameAnswerSchema, type GameState, type TruthOrDareQuestion, type SyncQuestion } from "@shared/schema";
import { z } from "zod";

// Game data
const truthOrDareQuestions: TruthOrDareQuestion[] = [
  { id: "t1", type: "truth", text: "Расскажи самый неловкий момент из детства" },
  { id: "t2", type: "truth", text: "Кто был твоей первой любовью?" },
  { id: "t3", type: "truth", text: "Какую самую большую ложь ты говорил родителям?" },
  { id: "t4", type: "truth", text: "О чём ты мечтаешь, но никому не рассказываешь?" },
  { id: "d1", type: "dare", text: "Сними 5-секундное видео, где ты поёшь как кот" },
  { id: "d2", type: "dare", text: "Сделай смешную фотографию и отправь её" },
  { id: "d3", type: "dare", text: "Покажи свой лучший танцевальный движение" },
  { id: "d4", type: "dare", text: "Изобрази любимое животное партнёра" },
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
}

const clients = new Map<number, WebSocketClient>();

function broadcast(roomId: number, message: any, excludeUserId?: number) {
  Array.from(clients.values())
    .filter(client => client.roomId === roomId && client.userId !== excludeUserId)
    .forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
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

      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // Create new user
        const userData = {
          telegramId,
          username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          avatar: Math.floor(Math.random() * 4).toString()
        };
        user = await storage.createUser(userData);
      } else {
        // Update existing user data
        user = await storage.updateUser(user.id, {
          username: username || user.username,
          firstName,
          lastName
        }) || user;
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
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

  app.post("/api/users/:id/partner", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { partnerId } = z.object({ partnerId: z.number() }).parse(req.body);
      
      const user = await storage.updateUser(userId, { partnerId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Also update the partner's partnerId
      await storage.updateUser(partnerId, { partnerId: userId });
      
      res.json(user);
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

  // Game room routes
  app.post("/api/games/create", async (req, res) => {
    try {
      const gameRoomData = insertGameRoomSchema.parse(req.body);
      const gameRoom = await storage.createGameRoom(gameRoomData);
      res.json(gameRoom);
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

  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            const { userId, roomId } = message;
            clients.set(userId, { ws, userId, roomId });
            
            // Update room status to active if both players are connected
            const room = await storage.getGameRoom(roomId);
            if (room) {
              const connectedPlayers = Array.from(clients.values())
                .filter(client => client.roomId === roomId).length;
              
              if (connectedPlayers === 2) {
                await storage.updateGameRoom(roomId, { status: 'active' });
                broadcast(roomId, { type: 'game_start', room });
              }
            }
            break;
            
          case 'truth_or_dare_choice':
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
            break;
            
          case 'truth_or_dare_complete':
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
            break;
            
          case 'sync_answer':
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
            break;
            
          case 'start_sync_game':
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
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from clients map
      const clientEntries = Array.from(clients.entries());
      for (const [userId, client] of clientEntries) {
        if (client.ws === ws) {
          clients.delete(userId);
          break;
        }
      }
    });
  });

  return httpServer;
}
