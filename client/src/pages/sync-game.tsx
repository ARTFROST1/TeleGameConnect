import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, RotateCcw, User, Star, Heart, Flame, Check, Utensils, Sandwich, Fish, UtensilsCrossed } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GameState, SyncQuestion } from "@shared/schema";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

const optionIcons = [Sandwich, Fish, Utensils, UtensilsCrossed];
const optionGradients = [
  "from-orange-400 to-red-500",
  "from-pink-400 to-red-400",
  "from-yellow-400 to-orange-400",
  "from-red-500 to-pink-500"
];

export default function SyncGame() {
  const [, navigate] = useLocation();
  const { currentUser, partner, currentGameRoom, setCurrentGameRoom } = useGame();
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    player1Score: 0,
    player2Score: 0,
    totalQuestions: 5
  });
  const [currentQuestion, setCurrentQuestion] = useState<SyncQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isMatch: boolean, answers: { player1: string, player2: string } } | null>(null);
  const [gameRoomId, setGameRoomId] = useState<number | null>(null);
  const [gameFinished, setGameFinished] = useState(false);
  const { toast } = useToast();

  const { sendMessage, isConnected } = useWebSocket({
    userId: currentUser?.id,
    roomId: gameRoomId || undefined,
    onMessage: (message) => {
      switch (message.type) {
        case 'sync_question':
          setCurrentQuestion(message.question);
          setSelectedAnswer(null);
          setPartnerAnswered(false);
          setShowResult(false);
          setGameState(prev => ({
            ...prev,
            currentQuestionIndex: message.questionIndex,
            totalQuestions: message.totalQuestions
          }));
          break;
        case 'partner_answered':
          setPartnerAnswered(true);
          break;
        case 'sync_result':
          setLastResult({
            isMatch: message.isMatch,
            answers: message.answers
          });
          setGameState(prev => ({
            ...prev,
            player1Score: message.scores.player1Score,
            player2Score: message.scores.player2Score
          }));
          setShowResult(true);
          setGameFinished(message.gameFinished);
          
          if (message.nextQuestion) {
            setTimeout(() => {
              setCurrentQuestion(message.nextQuestion);
              setSelectedAnswer(null);
              setPartnerAnswered(false);
              setShowResult(false);
              setGameState(prev => ({
                ...prev,
                currentQuestionIndex: prev.currentQuestionIndex + 1
              }));
            }, 3000);
          }
          break;
      }
    }
  });

  // Create game room and start game
  useEffect(() => {
    const createAndStartGame = async () => {
      if (!currentUser || !partner || currentGameRoom) return;

      try {
        const response = await fetch("/api/games/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player1Id: currentUser.id,
            player2Id: partner.id,
            gameType: "sync",
            currentPlayer: currentUser.id,
            gameData: gameState
          }),
        });

        if (response.ok) {
          const room = await response.json();
          setCurrentGameRoom(room.id);
          setGameRoomId(room.id);
          
          // Start the sync game
          setTimeout(() => {
            sendMessage({
              type: 'start_sync_game',
              roomId: room.id
            });
          }, 1000);
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

    createAndStartGame();
  }, [currentUser, partner, currentGameRoom, setCurrentGameRoom]);

  if (!currentUser || !partner) {
    return (
      <div className="min-h-screen bg-dark-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Для игры нужен партнёр</p>
          <Link href="/dashboard">
            <Button className="mt-4">На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectAnswer = (answer: string, index: number) => {
    if (selectedAnswer || !currentQuestion || !gameRoomId) return;
    
    setSelectedAnswer(answer);
    sendMessage({
      type: 'sync_answer',
      roomId: gameRoomId,
      playerId: currentUser.id,
      questionId: currentQuestion.id,
      answer
    });
  };

  const Player1Icon = avatarIcons[parseInt(currentUser.avatar) || 0];
  const Player2Icon = avatarIcons[parseInt(partner.avatar) || 0];

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
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
        <h2 className="text-xl font-bold">Синхрон</h2>
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
        {/* Game Status */}
        <div className="gradient-border">
          <div className="gradient-border-content p-6 text-center">
            <div className="flex justify-center items-center mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradients[parseInt(currentUser.avatar) || 0]} rounded-full flex items-center justify-center mr-2`}>
                <Player1Icon className="text-white font-bold" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw className="text-accent-purple mx-3" />
              </motion.div>
              <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradients[parseInt(partner.avatar) || 0]} rounded-full flex items-center justify-center ml-2`}>
                <Player2Icon className="text-white font-bold" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">
              Вопрос {gameState.currentQuestionIndex + 1} из {gameState.totalQuestions}
            </h3>
            <p className="text-zinc-400 text-sm">
              {!isConnected ? "Подключение..." : "Ответьте одновременно"}
            </p>
          </div>
        </div>
        
        {/* Current Question */}
        {currentQuestion && !showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gradient-border"
          >
            <div className="gradient-border-content p-6">
              <h3 className="text-xl font-semibold text-center mb-6">{currentQuestion.text}</h3>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const OptionIcon = optionIcons[index % optionIcons.length];
                  const gradient = optionGradients[index % optionGradients.length];
                  const isSelected = selectedAnswer === option;
                  
                  return (
                    <motion.button
                      key={index}
                      whileHover={!selectedAnswer ? { scale: 1.02 } : {}}
                      whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                      onClick={() => selectAnswer(option, index)}
                      disabled={!!selectedAnswer}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        isSelected 
                          ? 'bg-accent-purple/20 border-accent-purple border-2' 
                          : 'bg-dark-800 border-transparent border-2 hover:border-accent-purple/50'
                      } ${selectedAnswer && !isSelected ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center mr-3`}>
                          <OptionIcon className="text-white text-sm" />
                        </div>
                        <span className="font-medium">{option}</span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto w-6 h-6 bg-accent-purple rounded-full flex items-center justify-center"
                          >
                            <Check className="text-white text-xs" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              {selectedAnswer && (
                <div className="mt-6 pt-4 border-t border-zinc-700">
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>Ваш партнёр</span>
                    <span className="flex items-center">
                      <motion.div 
                        animate={partnerAnswered ? {} : { y: [-2, 2, -2] }}
                        transition={{ duration: 1, repeat: partnerAnswered ? 0 : Infinity, ease: "easeInOut" }}
                        className={`w-4 h-4 rounded-full mr-2 ${partnerAnswered ? 'bg-green-500' : 'bg-yellow-500'}`}
                      />
                      {partnerAnswered ? 'Готов' : 'Выбирает...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Result Display */}
        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="gradient-border"
            >
              <div className="gradient-border-content p-6">
                <h3 className="font-semibold text-center mb-4">Результат раунда</h3>
                
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${avatarGradients[parseInt(currentUser.avatar) || 0]} rounded-full flex items-center justify-center mb-2`}>
                      <Player1Icon className="text-white text-lg" />
                    </div>
                    <p className="text-sm">{currentUser.username}</p>
                    <p className="text-xs text-zinc-400">{lastResult.answers.player1}</p>
                  </div>
                  
                  <div className="mx-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        lastResult.isMatch ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {lastResult.isMatch ? (
                        <Check className="text-white text-2xl" />
                      ) : (
                        <span className="text-white text-2xl">×</span>
                      )}
                    </motion.div>
                    <p className={`text-center text-sm mt-2 font-semibold ${
                      lastResult.isMatch ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {lastResult.isMatch ? 'Совпадение!' : 'Не совпало'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${avatarGradients[parseInt(partner.avatar) || 0]} rounded-full flex items-center justify-center mb-2`}>
                      <Player2Icon className="text-white text-lg" />
                    </div>
                    <p className="text-sm">{partner.username}</p>
                    <p className="text-xs text-zinc-400">{lastResult.answers.player2}</p>
                  </div>
                </div>
                
                {lastResult.isMatch && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400 mb-2">+10 очков!</p>
                    <p className="text-zinc-400 text-sm">Отличная синхронизация</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress and Score */}
        <div className="gradient-border">
          <div className="gradient-border-content p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогресс игры</span>
              <span className="text-sm text-zinc-400">
                {gameState.currentQuestionIndex + (showResult ? 1 : 0)}/{gameState.totalQuestions}
              </span>
            </div>
            <div className="w-full bg-dark-800 rounded-full h-2 mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((gameState.currentQuestionIndex + (showResult ? 1 : 0)) / (gameState.totalQuestions || 5)) * 100}%` 
                }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-accent-purple to-accent-pink h-2 rounded-full"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-purple">{gameState.player1Score}</p>
                <p className="text-xs text-zinc-400">Очки</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-pink">
                  {gameState.currentQuestionIndex > 0 ? 
                    Math.floor((gameState.player1Score / (gameState.currentQuestionIndex * 10)) * 100) : 0}%
                </p>
                <p className="text-xs text-zinc-400">Синхрон</p>
              </div>
              {gameFinished && (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-accent-purple to-accent-pink">
                    Завершить
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
