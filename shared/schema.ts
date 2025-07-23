import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  username: text("username").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar").notNull(),
  partnerId: integer("partner_id"),
  gamesPlayed: integer("games_played").notNull().default(0),
  syncScore: integer("sync_score").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gameRooms = pgTable("game_rooms", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull(),
  player2Id: integer("player2_id").notNull(),
  gameType: text("game_type").notNull(), // 'truth_or_dare' or 'sync'
  status: text("status").notNull().default("waiting"), // 'waiting', 'active', 'finished'
  currentPlayer: integer("current_player").notNull(),
  gameData: json("game_data"), // Store game-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  playerId: integer("player_id").notNull(),
  questionId: text("question_id").notNull(),
  answer: text("answer"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partnerInvitations = pgTable("partner_invitations", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const gameInvitations = pgTable("game_invitations", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  gameType: text("game_type").notNull(), // 'truth_or_dare' or 'sync'
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'declined', 'expired'
  roomId: integer("room_id"), // Set when invitation is accepted
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"), // Auto-expire invitations after some time
});

export const insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,
});

export const insertGameRoomSchema = createInsertSchema(gameRooms).pick({
  player1Id: true,
  player2Id: true,
  gameType: true,
  currentPlayer: true,
  gameData: true,
});

export const insertGameAnswerSchema = createInsertSchema(gameAnswers).pick({
  roomId: true,
  playerId: true,
  questionId: true,
  answer: true,
  completed: true,
});

export const insertPartnerInvitationSchema = createInsertSchema(partnerInvitations).pick({
  fromUserId: true,
  toUserId: true,
});

export const insertGameInvitationSchema = createInsertSchema(gameInvitations).pick({
  fromUserId: true,
  toUserId: true,
  gameType: true,
}).extend({
  expiresAt: z.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;
export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertPartnerInvitation = z.infer<typeof insertPartnerInvitationSchema>;
export type PartnerInvitation = typeof partnerInvitations.$inferSelect;
export type InsertGameInvitation = z.infer<typeof insertGameInvitationSchema>;
export type GameInvitation = typeof gameInvitations.$inferSelect;

// Game-specific types
export type TruthOrDareQuestion = {
  id: string;
  type: 'truth' | 'dare';
  text: string;
};

export type SyncQuestion = {
  id: string;
  text: string;
  options: string[];
};

export type GameState = {
  currentQuestion?: TruthOrDareQuestion | SyncQuestion;
  currentQuestionIndex: number;
  player1Score: number;
  player2Score: number;
  totalQuestions?: number;
  answers?: { [playerId: number]: string };
};

// Notification types for real-time updates
export type NotificationType = 
  | 'partner_invitation'
  | 'partner_invitation_received'
  | 'partner_update'
  | 'game_invitation'
  | 'partner_accepted'
  | 'game_accepted'
  | 'game_declined'
  | 'partner_declined';

export type Notification = {
  id: string;
  type: NotificationType;
  fromUser?: Pick<User, 'id' | 'username' | 'avatar'>;
  partner?: User;
  gameType?: string;
  invitationId?: number;
  roomId?: number;
  createdAt: Date;
};
