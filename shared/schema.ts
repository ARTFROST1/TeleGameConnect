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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;
export type GameAnswer = typeof gameAnswers.$inferSelect;

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
