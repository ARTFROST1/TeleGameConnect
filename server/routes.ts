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

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.post("/api/users/login", async (req, res) => {
    try {
      const { username } = z.object({ username: z.string() }).parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from clients map
      for (const [userId, client] of clients.entries()) {
        if (client.ws === ws) {
          clients.delete(userId);
          break;
        }
      }
    });
  });

  return httpServer;
}
