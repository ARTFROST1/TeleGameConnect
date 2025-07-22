import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, Lightbulb, Zap, User, Star, Heart, Flame } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GameState, TruthOrDareQuestion } from "@shared/schema";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

export default function TruthOrDare() {
  const [, navigate] = useLocation();
  const { currentUser, partner, currentGameRoom, setCurrentGameRoom } = useGame();
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    player1Score: 0,
    player2Score: 0
  });
  const [currentQuestion, setCurrentQuestion] = useState<TruthOrDareQuestion | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameRoomId, setGameRoomId] = useState<number | null>(null);
  const { toast } = useToast();

  const { sendMessage, isConnected } = useWebSocket({
    userId: currentUser?.id,
    roomId: gameRoomId || undefined,
    onMessage: (message) => {
      switch (message.type) {
        case 'game_start':
          toast({
            title: "Игра начинается!",
            description: "Оба игрока подключились",
          });
          break;
        case 'question_assigned':
          setCurrentQuestion(message.question);
          setCurrentPlayer(message.currentPlayer);
          setIsMyTurn(message.currentPlayer === currentUser?.id);
          break;
        case 'turn_changed':
          setCurrentPlayer(message.currentPlayer);
          setIsMyTurn(message.currentPlayer === currentUser?.id);
          setGameState(prev => ({
            ...prev,
            player1Score: message.scores.player1Score,
            player2Score: message.scores.player2Score
          }));
          setCurrentQuestion(null);
          break;
      }
    }
  });

  // Create game room when component mounts
  useEffect(() => {
    const createGameRoom = async () => {
      if (!currentUser || !partner || currentGameRoom) return;

      try {
        const response = await fetch("/api/games/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player1Id: currentUser.id,
            player2Id: partner.id,
            gameType: "truth_or_dare",
            currentPlayer: currentUser.id,
            gameData: gameState
          }),
        });

        if (response.ok) {
          const room = await response.json();
          setCurrentGameRoom(room.id);
          setGameRoomId(room.id);
          setCurrentPlayer(room.currentPlayer);
          setIsMyTurn(room.currentPlayer === currentUser.id);
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось создать игровую комнату",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };

    createGameRoom();
  }, [currentUser, partner, currentGameRoom, setCurrentGameRoom]);

  if (!currentUser || !partner) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Для игры нужен партнёр</p>
          <Link href="/dashboard">
            <Button className="mt-4">На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectChoice = (choice: 'truth' | 'dare') => {
    if (!isMyTurn || !gameRoomId) return;
    
    sendMessage({
      type: 'truth_or_dare_choice',
      choice,
      roomId: gameRoomId,
      playerId: currentUser.id
    });
  };

  const completeChallenge = (completed: boolean) => {
    if (!gameRoomId) return;
    
    sendMessage({
      type: 'truth_or_dare_complete',
      roomId: gameRoomId,
      playerId: currentUser.id,
      completed
    });
  };

  const CurrentPlayerIcon = avatarIcons[parseInt(currentPlayer === currentUser.id ? currentUser.avatar : partner.avatar) || 0];
  const currentPlayerGradient = avatarGradients[parseInt(currentPlayer === currentUser.id ? currentUser.avatar : partner.avatar) || 0];
  const currentPlayerName = currentPlayer === currentUser.id ? currentUser.username : partner.username;

  const Player1Icon = avatarIcons[parseInt(currentUser.avatar) || 0];
  const Player2Icon = avatarIcons[parseInt(partner.avatar) || 0];

  return (
    <div className="min-h-screen p-6">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-accent-purple">
            <ArrowLeft className="text-xl" />
          </Button>
        </Link>
        <h2 className="text-xl font-bold">Правда или Действие</h2>
        <Button variant="ghost" size="sm" className="text-zinc-400">
          <MoreVertical />
        </Button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* Current Player Display */}
        <div className="gradient-border">
          <div className="gradient-border-content p-6 text-center">
            <div className={`w-16 h-16 bg-gradient-to-br ${currentPlayerGradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <CurrentPlayerIcon className="text-white text-lg" />
            </div>
            <h3 className="font-semibold mb-2">
              {isMyTurn ? `Ваш ход, ${currentPlayerName}!` : `Ход игрока ${currentPlayerName}`}
            </h3>
            <p className="text-zinc-400 text-sm">
              {isMyTurn ? "Выберите правду или действие" : "Ожидайте выбора партнёра"}
            </p>
            {!isConnected && (
              <p className="text-red-400 text-sm mt-2">Подключение...</p>
            )}
          </div>
        </div>
        
        {/* Choice Buttons */}
        {isMyTurn && !currentQuestion && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectChoice('truth')}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 p-8 rounded-xl text-center transition-all duration-300"
            >
              <Lightbulb className="text-3xl text-white mb-3 mx-auto" />
              <p className="font-bold text-lg text-white">Правда</p>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectChoice('dare')}
              className="bg-gradient-to-br from-orange-500 to-red-500 p-8 rounded-xl text-center transition-all duration-300"
            >
              <Zap className="text-3xl text-white mb-3 mx-auto" />
              <p className="font-bold text-lg text-white">Действие</p>
            </motion.button>
          </motion.div>
        )}
        
        {/* Question Display */}
        <AnimatePresence>
          {currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="gradient-border"
            >
              <div className="gradient-border-content p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 ${currentQuestion.type === 'truth' ? 'bg-blue-500' : 'bg-orange-500'} rounded-full flex items-center justify-center mr-3`}>
                    {currentQuestion.type === 'truth' ? (
                      <Lightbulb className="text-white text-sm" />
                    ) : (
                      <Zap className="text-white text-sm" />
                    )}
                  </div>
                  <h4 className="font-semibold">{currentQuestion.type === 'truth' ? 'Правда' : 'Действие'}</h4>
                </div>
                <p className="text-lg mb-6">{currentQuestion.text}</p>
                
                {isMyTurn && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => completeChallenge(true)}
                      className="flex-1 bg-green-500 text-white hover:bg-green-600"
                    >
                      Выполнено
                    </Button>
                    <Button
                      onClick={() => completeChallenge(false)}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Пропустить
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Score Display */}
        <div className="gradient-border">
          <div className="gradient-border-content p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradients[parseInt(currentUser.avatar) || 0]} rounded-full flex items-center justify-center mr-3`}>
                  <Player1Icon className="text-white text-sm" />
                </div>
                <span className="text-sm">{currentUser.username}</span>
              </div>
              <div className="text-2xl font-bold text-accent-purple">{gameState.player1Score}</div>
            </div>
            
            <div className="w-full bg-dark-800 rounded-full h-2 my-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.max(gameState.player1Score, gameState.player2Score) === 0 ? 50 : 
                    (gameState.player1Score / Math.max(gameState.player1Score, gameState.player2Score)) * 100}%` 
                }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-accent-purple to-accent-pink h-2 rounded-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradients[parseInt(partner.avatar) || 0]} rounded-full flex items-center justify-center mr-3`}>
                  <Player2Icon className="text-white text-sm" />
                </div>
                <span className="text-sm">{partner.username}</span>
              </div>
              <div className="text-2xl font-bold text-accent-pink">{gameState.player2Score}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
