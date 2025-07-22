# Couple Games Application

## Overview

This is a real-time multiplayer gaming application designed for couples, featuring two main games: Truth or Dare and Sync Game. The application is built with a modern full-stack architecture using React, Express, TypeScript, and PostgreSQL with real-time communication via WebSockets.

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred design style: Modern, minimalistic with smooth purple-pink gradients.
Focus on: Fresh, smooth, fast performance with clean aesthetics.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React SPA with TypeScript, using Vite for build tooling and development
- **Backend**: Express.js REST API with TypeScript and WebSocket support
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket implementation for live game interactions
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom dark theme

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - contains all database table definitions
- **Tables**:
  - `users`: User profiles with avatars and game statistics
  - `gameRooms`: Game sessions between two players
  - `gameAnswers`: Player responses and game progress tracking
- **Migrations**: Stored in `./migrations` directory

### API Layer
- **REST Endpoints**: User management, game room creation, partner search
- **WebSocket Server**: Real-time game state synchronization
- **Route Handler**: `server/routes.ts` - contains all API endpoints and WebSocket logic
- **Storage Interface**: `server/storage.ts` - defines data access patterns with in-memory implementation

### Frontend Architecture
- **State Management**: React Context for global game state and user session
- **Routing**: Wouter for client-side navigation
- **Data Fetching**: TanStack Query for server state management
- **UI Components**: Comprehensive component library using Radix UI primitives
- **Game Logic**: Separate pages for each game type with real-time WebSocket integration

### Authentication & Session Management  
- **One-Click Entry**: Single "Начать" button automatically creates user and enters app
- **Auto Username Generation**: Generates random username (UserXXXX format) for immediate access
- **Simplified Demo Auth**: Uses `/api/auth/demo` endpoint for quick username-based login
- **Telegram Ready**: Prepared `/api/auth/telegram` endpoint for future Telegram integration
- **Test Partner**: Automatic test partner (ID: 999) available for game testing
- **Partner System**: Simple partner linking with mutual connection updates
- **Profile Management**: Avatar selection with modern animated interface

## Recent Changes (January 22, 2025)
- **Simplified Welcome Screen**: Removed choice between "новый игрок" and "уже есть аккаунт"
- **One-Click Entry**: Added automatic entry with single "Начать" button
- **Auto Username Generation**: Generates random username (UserXXXX format) for immediate access
- **Improved Contrast**: Fixed visibility issues across all screens - enhanced button contrast and text readability
- **Better UX**: Eliminated registration friction for faster app entry

## Data Flow

### Game Session Flow
1. User creates or joins a game room
2. WebSocket connection established for real-time communication
3. Game state synchronized between players through WebSocket messages
4. Game progress stored in database via REST API
5. Real-time updates broadcast to all connected players

### User Management Flow
1. User registration/login through REST API
2. Profile data cached in localStorage
3. Partner linking through user search functionality
4. Game statistics updated after each completed game

## External Dependencies

### Core Technologies
- **Neon Database**: PostgreSQL database hosting (via @neondatabase/serverless)
- **Vite**: Frontend build tool and development server
- **React Query**: Server state management and caching
- **Framer Motion**: Animation library for enhanced UX

### UI and Styling
- **Radix UI**: Comprehensive component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component system

### Development Tools
- **TypeScript**: Type safety across the full stack
- **ESBuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development
- **Client**: Vite dev server with HMR
- **Server**: tsx for TypeScript execution with nodemon-like functionality
- **Database**: Connection via DATABASE_URL environment variable

### Production Build
- **Client**: Static assets built to `dist/public`
- **Server**: Bundled with ESBuild to `dist/index.js`
- **Deployment**: Single Node.js process serving both API and static files

### Environment Configuration
- **Database**: Requires DATABASE_URL environment variable
- **Development**: NODE_ENV=development for dev-specific features
- **Production**: NODE_ENV=production for optimized builds

### Key Architectural Decisions

1. **Monorepo Structure**: Chose shared code approach to ensure type safety between client and server
2. **WebSocket Integration**: Real-time communication essential for multiplayer gaming experience
3. **In-Memory Storage with Database Interface**: Flexible storage layer that can be easily swapped for production database
4. **Type-Safe Schema**: Drizzle ORM provides compile-time safety for database operations
5. **Component-Based UI**: Radix UI ensures accessibility and consistent behavior across components