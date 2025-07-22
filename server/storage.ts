import { users, gameRooms, gameAnswers, partnerInvitations, gameInvitations, type User, type InsertUser, type GameRoom, type InsertGameRoom, type GameAnswer, type InsertGameAnswer, type PartnerInvitation, type InsertPartnerInvitation, type GameInvitation, type InsertGameInvitation } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
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

  // Partner invitation operations
  createPartnerInvitation(invitation: InsertPartnerInvitation): Promise<PartnerInvitation>;
  getPartnerInvitation(id: number): Promise<PartnerInvitation | undefined>;
  getUserPartnerInvitations(userId: number): Promise<PartnerInvitation[]>;
  getSentPartnerInvitations(userId: number): Promise<PartnerInvitation[]>;
  updatePartnerInvitation(id: number, updates: Partial<PartnerInvitation>): Promise<PartnerInvitation | undefined>;
  deletePartnerInvitation(id: number): Promise<boolean>;

  // Game invitation operations
  createGameInvitation(invitation: InsertGameInvitation): Promise<GameInvitation>;
  getGameInvitation(id: number): Promise<GameInvitation | undefined>;
  getUserGameInvitations(userId: number): Promise<GameInvitation[]>;
  updateGameInvitation(id: number, updates: Partial<GameInvitation>): Promise<GameInvitation | undefined>;
  deleteGameInvitation(id: number): Promise<boolean>;
  expireOldGameInvitations(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameRooms: Map<number, GameRoom>;
  private gameAnswers: Map<number, GameAnswer>;
  private partnerInvitations: Map<number, PartnerInvitation>;
  private gameInvitations: Map<number, GameInvitation>;
  private currentUserId: number;
  private currentGameRoomId: number;
  private currentGameAnswerId: number;
  private currentPartnerInvitationId: number;
  private currentGameInvitationId: number;

  constructor() {
    this.users = new Map();
    this.gameRooms = new Map();
    this.gameAnswers = new Map();
    this.partnerInvitations = new Map();
    this.gameInvitations = new Map();
    this.currentUserId = 1;
    this.currentGameRoomId = 1;
    this.currentGameAnswerId = 1;
    this.currentPartnerInvitationId = 1;
    this.currentGameInvitationId = 1;
    
    // Создаём тестового партнёра
    this.initTestPartner();
  }

  private initTestPartner() {
    const testPartner: User = {
      id: 999,
      telegramId: "test_partner_999",
      username: "Тестовый Партнёр",
      firstName: "Тест",
      lastName: "Партнёр",
      avatar: "0",
      partnerId: null,
      gamesPlayed: 25,
      syncScore: 85,
      createdAt: new Date()
    };
    this.users.set(999, testPartner);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === telegramId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id, 
      telegramId: insertUser.telegramId || null,
      username: insertUser.username,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      avatar: insertUser.avatar,
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
      createdAt: new Date(),
      gameData: insertGameRoom.gameData || null
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
      createdAt: new Date(),
      completed: insertGameAnswer.completed || false,
      answer: insertGameAnswer.answer || null
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

  // Partner invitation methods
  async createPartnerInvitation(insertInvitation: InsertPartnerInvitation): Promise<PartnerInvitation> {
    const id = this.currentPartnerInvitationId++;
    const invitation: PartnerInvitation = {
      ...insertInvitation,
      id,
      status: "pending",
      createdAt: new Date(),
      respondedAt: null
    };
    this.partnerInvitations.set(id, invitation);
    return invitation;
  }

  async getPartnerInvitation(id: number): Promise<PartnerInvitation | undefined> {
    return this.partnerInvitations.get(id);
  }

  async getUserPartnerInvitations(userId: number): Promise<PartnerInvitation[]> {
    return Array.from(this.partnerInvitations.values()).filter(
      (invitation) => invitation.toUserId === userId && invitation.status === "pending"
    );
  }

  async getSentPartnerInvitations(userId: number): Promise<PartnerInvitation[]> {
    return Array.from(this.partnerInvitations.values()).filter(
      (invitation) => invitation.fromUserId === userId && invitation.status === "pending"
    );
  }

  async updatePartnerInvitation(id: number, updates: Partial<PartnerInvitation>): Promise<PartnerInvitation | undefined> {
    const invitation = this.partnerInvitations.get(id);
    if (!invitation) return undefined;
    
    const updatedInvitation = { 
      ...invitation, 
      ...updates,
      respondedAt: updates.status && updates.status !== "pending" ? new Date() : invitation.respondedAt
    };
    this.partnerInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async deletePartnerInvitation(id: number): Promise<boolean> {
    return this.partnerInvitations.delete(id);
  }

  // Game invitation methods
  async createGameInvitation(insertInvitation: InsertGameInvitation): Promise<GameInvitation> {
    const id = this.currentGameInvitationId++;
    const invitation: GameInvitation = {
      ...insertInvitation,
      id,
      status: "pending",
      roomId: null,
      createdAt: new Date(),
      respondedAt: null,
      expiresAt: insertInvitation.expiresAt || new Date(Date.now() + 5 * 60 * 1000) // 5 minutes default
    };
    this.gameInvitations.set(id, invitation);
    return invitation;
  }

  async getGameInvitation(id: number): Promise<GameInvitation | undefined> {
    return this.gameInvitations.get(id);
  }

  async getUserGameInvitations(userId: number): Promise<GameInvitation[]> {
    return Array.from(this.gameInvitations.values()).filter(
      (invitation) => invitation.toUserId === userId && invitation.status === "pending" && 
      invitation.expiresAt && invitation.expiresAt > new Date()
    );
  }

  async updateGameInvitation(id: number, updates: Partial<GameInvitation>): Promise<GameInvitation | undefined> {
    const invitation = this.gameInvitations.get(id);
    if (!invitation) return undefined;
    
    const updatedInvitation = { 
      ...invitation, 
      ...updates,
      respondedAt: updates.status && updates.status !== "pending" ? new Date() : invitation.respondedAt
    };
    this.gameInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async deleteGameInvitation(id: number): Promise<boolean> {
    return this.gameInvitations.delete(id);
  }

  async expireOldGameInvitations(): Promise<void> {
    const now = new Date();
    const expiredIds: number[] = [];
    
    for (const [id, invitation] of this.gameInvitations.entries()) {
      if (invitation.expiresAt && invitation.expiresAt <= now && invitation.status === "pending") {
        expiredIds.push(id);
      }
    }
    
    for (const id of expiredIds) {
      this.updateGameInvitation(id, { status: "expired" });
    }
  }
}

export const storage = new MemStorage();
