import { users, gameRooms, gameAnswers, type User, type InsertUser, type GameRoom, type InsertGameRoom, type GameAnswer, type InsertGameAnswer } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  findUsersByPartialUsername(username: string): Promise<User[]>;

  // Game room operations
  createGameRoom(room: InsertGameRoom): Promise<GameRoom>;
  getGameRoom(id: number): Promise<GameRoom | undefined>;
  updateGameRoom(id: number, updates: Partial<GameRoom>): Promise<GameRoom | undefined>;
  getActiveGameRoomForUser(userId: number): Promise<GameRoom | undefined>;

  // Game answer operations
  createGameAnswer(answer: InsertGameAnswer): Promise<GameAnswer>;
  getGameAnswers(roomId: number): Promise<GameAnswer[]>;
  getGameAnswer(roomId: number, playerId: number, questionId: string): Promise<GameAnswer | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameRooms: Map<number, GameRoom>;
  private gameAnswers: Map<number, GameAnswer>;
  private currentUserId: number;
  private currentGameRoomId: number;
  private currentGameAnswerId: number;

  constructor() {
    this.users = new Map();
    this.gameRooms = new Map();
    this.gameAnswers = new Map();
    this.currentUserId = 1;
    this.currentGameRoomId = 1;
    this.currentGameAnswerId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      partnerId: null,
      gamesPlayed: 0,
      syncScore: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async findUsersByPartialUsername(username: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.username.toLowerCase().includes(username.toLowerCase())
    );
  }

  async createGameRoom(insertGameRoom: InsertGameRoom): Promise<GameRoom> {
    const id = this.currentGameRoomId++;
    const gameRoom: GameRoom = {
      ...insertGameRoom,
      id,
      status: "waiting",
      createdAt: new Date()
    };
    this.gameRooms.set(id, gameRoom);
    return gameRoom;
  }

  async getGameRoom(id: number): Promise<GameRoom | undefined> {
    return this.gameRooms.get(id);
  }

  async updateGameRoom(id: number, updates: Partial<GameRoom>): Promise<GameRoom | undefined> {
    const gameRoom = this.gameRooms.get(id);
    if (!gameRoom) return undefined;
    
    const updatedGameRoom = { ...gameRoom, ...updates };
    this.gameRooms.set(id, updatedGameRoom);
    return updatedGameRoom;
  }

  async getActiveGameRoomForUser(userId: number): Promise<GameRoom | undefined> {
    return Array.from(this.gameRooms.values()).find(
      (room) => 
        (room.player1Id === userId || room.player2Id === userId) &&
        room.status === "active"
    );
  }

  async createGameAnswer(insertGameAnswer: InsertGameAnswer): Promise<GameAnswer> {
    const id = this.currentGameAnswerId++;
    const gameAnswer: GameAnswer = {
      ...insertGameAnswer,
      id,
      createdAt: new Date()
    };
    this.gameAnswers.set(id, gameAnswer);
    return gameAnswer;
  }

  async getGameAnswers(roomId: number): Promise<GameAnswer[]> {
    return Array.from(this.gameAnswers.values()).filter(
      (answer) => answer.roomId === roomId
    );
  }

  async getGameAnswer(roomId: number, playerId: number, questionId: string): Promise<GameAnswer | undefined> {
    return Array.from(this.gameAnswers.values()).find(
      (answer) => 
        answer.roomId === roomId && 
        answer.playerId === playerId && 
        answer.questionId === questionId
    );
  }
}

export const storage = new MemStorage();
