import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, Heart, Flame, ArrowLeft, Clock, Trophy, CheckCircle, SkipForward, XCircle } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { GameRoom, User as UserType } from "@shared/schema";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

const truthOrDareQuestions = [
  // Truth questions
  { id: "t1", type: "truth", text: "Какой самый смущающий момент в твоей жизни?" },
  { id: "t2", type: "truth", text: "О чём ты врал родителям в детстве?" },
  { id: "t3", type: "truth", text: "Какая твоя самая большая мечта?" },
  { id: "t4", type: "truth", text: "Что ты никому не рассказывал?" },
  { id: "t5", type: "truth", text: "За кого ты тайно переживал в школе?" },
  { id: "t6", type: "truth", text: "Какой самый странный сон тебе снился?" },
  { id: "t7", type: "truth", text: "Что бы ты хотел изменить в себе?" },
  { id: "t8", type: "truth", text: "Кому ты завидуешь и почему?" },
  
  // Dare questions
  { id: "d1", type: "dare", text: "Изобрази животное так, чтобы партнёр угадал" },
  { id: "d2", type: "dare", text: "Спой песню голосом мультяшного персонажа" },
  { id: "d3", type: "dare", text: "Сделай 10 приседаний" },
  { id: "d4", type: "dare", text: "Расскажи комплимент партнёру на 30 секунд" },
  { id: "d5", type: "dare", text: "Изобрази робота в течение минуты" },
  { id: "d6", type: "dare", text: "Станцуй танец победы" },
  { id: "d7", type: "dare", text: "Сделай смешную рожицу и держи 10 секунд" },
  { id: "d8", type: "dare", text: "Говори только рифмами следующие 3 реплики" },
];

export default function TruthOrDare() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { currentUser } = useGame();
  const { toast } = useToast();
  
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameState, setGameState] = useState({
    currentQuestionIndex: 0,
    player1Score: 0,
    player2Score: 0,
    turnHistory: [] as string[]
  });
  const [players, setPlayers] = useState<{player1: UserType | null, player2: UserType | null}>({
    player1: null,
    player2: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<'truth' | 'dare' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // WebSocket for real-time game updates
  const { sendMessage } = useWebSocket({
    roomId: parseInt(roomId || '0'),
  });

  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Truth or Dare WebSocket message:', message);

        switch (message.type) {
          case 'question_assigned':
            // Partner selected a question
            if (message.currentPlayer !== currentUser?.id) {
              setCurrentQuestion(message.question);
              setSelectedChoice(message.choice);
            }
            break;
            
          case 'turn_changed':
            // Update game state and switch turns
            setGameState(message.gameState);
            setIsMyTurn(message.currentPlayer === currentUser?.id);
            setSelectedChoice(null);
            setCurrentQuestion(null);
            setTimeLeft(0);
            
            if (message.currentPlayer === currentUser?.id) {
              toast({
                title: "Ваш ход!",
                description: "Выберите правду или действие",
              });
            } else {
              const playerName = message.currentPlayer === 999 ? "TestPartner" : "Партнёр";
              toast({
                title: `Ход ${playerName}`,
                description: "Ожидаем выбор...",
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Add event listener for WebSocket messages
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        userId: currentUser?.id,
        roomId: parseInt(roomId || '0')
      }));
    };
    
    ws.onmessage = handleWebSocketMessage;
    
    return () => {
      ws.close();
    };
  }, [currentUser?.id, roomId, toast]);

  // Load game room data
  useEffect(() => {
    const loadGameRoom = async () => {
      if (!roomId) return;
      
      try {
        const response = await fetch(`/api/games/${roomId}`);
        if (response.ok) {
          const room = await response.json();
          setGameRoom(room);
          
          // Load players
          const [player1Response, player2Response] = await Promise.all([
            fetch(`/api/users/${room.player1Id}`),
            fetch(`/api/users/${room.player2Id}`)
          ]);
          
          if (player1Response.ok && player2Response.ok) {
            const player1 = await player1Response.json();
            const player2 = await player2Response.json();
            setPlayers({ player1, player2 });
          }
          
          // Set initial game state
          if (room.gameData) {
            setGameState(room.gameData);
          }
          
          // Check if it's current user's turn
          setIsMyTurn(room.currentPlayer === currentUser?.id);
          
        } else {
          toast({
            title: "Ошибка",
            description: "Комната не найдена",
            variant: "destructive"
          });
          navigate("/dashboard");
        }
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить игру",
          variant: "destructive"
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadGameRoom();
  }, [roomId, currentUser?.id, navigate, toast]);

  // Timer for turns
  useEffect(() => {
    if (isMyTurn && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, timeLeft]);

  const selectChoice = (choice: 'truth' | 'dare') => {
    setSelectedChoice(choice);
    const questions = truthOrDareQuestions.filter(q => q.type === choice);
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setTimeLeft(120); // 2 minutes to complete
    
    // Send choice to partner via WebSocket
    sendMessage({
      type: 'truth_or_dare_choice',
      roomId: parseInt(roomId || '0'),
      playerId: currentUser?.id,
      choice,
      question: randomQuestion
    });
  };

  const completeTask = async (completed: boolean) => {
    if (!gameRoom || !currentUser) return;
    
    try {
      // Save answer
      await fetch('/api/game-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: parseInt(roomId || '0'),
          playerId: currentUser.id,
          questionId: currentQuestion?.id || '',
          answer: completed ? 'completed' : 'skipped',
          completed
        })
      });
      
      // Update scores
      const newScore = completed ? (currentUser.id === gameRoom.player1Id ? gameState.player1Score + 1 : gameState.player2Score + 1) : 0;
      const updatedGameState = {
        ...gameState,
        currentQuestionIndex: gameState.currentQuestionIndex + 1,
        player1Score: currentUser.id === gameRoom.player1Id ? newScore : gameState.player1Score,
        player2Score: currentUser.id === gameRoom.player2Id ? newScore : gameState.player2Score,
        turnHistory: [...gameState.turnHistory, `${currentUser.username}: ${currentQuestion?.text} - ${completed ? 'Выполнено' : 'Пропущено'}`]
      };
      
      // Switch turns
      const nextPlayer = gameRoom.currentPlayer === gameRoom.player1Id ? gameRoom.player2Id : gameRoom.player1Id;
      
      // Update game room
      await fetch(`/api/games/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlayer: nextPlayer,
          gameData: updatedGameState
        })
      });
      
      // Send turn update via WebSocket
      sendMessage({
        type: 'turn_completed',
        roomId: parseInt(roomId || '0'),
        playerId: currentUser.id,
        completed,
        nextPlayer,
        gameState: updatedGameState
      });
      
      // Update local state
      setGameState(updatedGameState);
      setIsMyTurn(false);
      setSelectedChoice(null);
      setCurrentQuestion(null);
      setTimeLeft(0);
      
      toast({
        title: completed ? "Задание выполнено!" : "Задание пропущено",
        description: "Ход переходит к партнёру",
      });
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить ход",
        variant: "destructive"
      });
    }
  };

  const endGame = async () => {
    if (!gameRoom) return;
    
    try {
      await fetch(`/api/games/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'finished'
        })
      });
      
      sendMessage({
        type: 'game_ended',
        roomId: parseInt(roomId || '0'),
        finalScore: gameState
      });
      
      toast({
        title: "Игра завершена!",
        description: "Спасибо за игру!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить игру",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (!gameRoom || !players.player1 || !players.player2) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Игра не найдена</p>
            <Link href="/dashboard">
              <Button>На главную</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPlayer = gameRoom.currentPlayer === players.player1.id ? players.player1 : players.player2;
  const CurrentPlayerIcon = avatarIcons[parseInt(currentPlayer.avatar) % avatarIcons.length];

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gradient">Правда или Действие</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Ход {gameState.currentQuestionIndex + 1}</Badge>
            {timeLeft > 0 && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Players Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {[players.player1, players.player2].map((player, index) => {
            const PlayerIcon = avatarIcons[parseInt(player.avatar) % avatarIcons.length];
            const score = index === 0 ? gameState.player1Score : gameState.player2Score;
            const isCurrentPlayer = gameRoom.currentPlayer === player.id;
            
            return (
              <Card key={player.id} className={`${isCurrentPlayer ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(player.avatar) % avatarGradients.length]} ${isCurrentPlayer ? 'scale-110 shadow-lg' : ''} transition-all`}>
                      <PlayerIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{player.username}</p>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-lg font-bold">{score}</span>
                      </div>
                    </div>
                    {isCurrentPlayer && (
                      <Badge className="bg-green-500">Ходит</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Game Area */}
        <AnimatePresence mode="wait">
          {isMyTurn ? (
            <motion.div
              key="my-turn"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-center text-gradient">Ваш ход!</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedChoice ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => selectChoice('truth')}
                        size="lg"
                        className="h-24 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        <div className="text-center">
                          <div className="text-xl font-bold mb-1">Правда</div>
                          <div className="text-sm opacity-90">Ответь честно</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => selectChoice('dare')}
                        size="lg"
                        className="h-24 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      >
                        <div className="text-center">
                          <div className="text-xl font-bold mb-1">Действие</div>
                          <div className="text-sm opacity-90">Выполни задание</div>
                        </div>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className={`p-6 rounded-xl ${selectedChoice === 'truth' ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                        <Badge className={`mb-4 ${selectedChoice === 'truth' ? 'bg-blue-500' : 'bg-red-500'}`}>
                          {selectedChoice === 'truth' ? 'Правда' : 'Действие'}
                        </Badge>
                        <p className="text-lg font-medium">{currentQuestion?.text}</p>
                      </div>
                      
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => completeTask(true)}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Выполнено
                        </Button>
                        <Button
                          onClick={() => completeTask(false)}
                          size="lg"
                          variant="outline"
                          className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                        >
                          <SkipForward className="h-5 w-5 mr-2" />
                          Пропустить
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(currentPlayer.avatar) % avatarGradients.length]} flex items-center justify-center mx-auto mb-4`}
                  >
                    <CurrentPlayerIcon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">Ходит {currentPlayer.username}</h3>
                  <p className="text-muted-foreground">Ожидаем выбор партнёра...</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game History */}
        {gameState.turnHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">История ходов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {gameState.turnHistory.slice(-5).map((turn, index) => (
                    <p key={index} className="text-sm text-muted-foreground">{turn}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* End Game Button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center"
        >
          <Button
            onClick={endGame}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Завершить игру
          </Button>
        </motion.div>
      </div>
    </div>
  );
}