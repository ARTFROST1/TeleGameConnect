import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGame } from '@/contexts/GameContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { User as UserType, GameRoom } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TruthOrDareQuestion {
  id: string;
  type: 'truth' | 'dare';
  text: string;
}

const truthOrDareQuestions: TruthOrDareQuestion[] = [
  // Truth questions
  { id: 'truth1', type: 'truth', text: 'Расскажи самый неловкий момент с детства' },
  { id: 'truth2', type: 'truth', text: 'О чём ты мечтаешь, но боишься рассказать?' },
  { id: 'truth3', type: 'truth', text: 'Какая твоя самая большая слабость?' },
  { id: 'truth4', type: 'truth', text: 'Что бы ты изменил в себе, если бы мог?' },
  { id: 'truth5', type: 'truth', text: 'Какой самый странный сон тебе снился?' },
  
  // Dare questions
  { id: 'dare1', type: 'dare', text: 'Сними 5-секундное видео, где ты поёшь как кот' },
  { id: 'dare2', type: 'dare', text: 'Сделай селфи с самым смешным лицом' },
  { id: 'dare3', type: 'dare', text: 'Расскажи стихотворение голосом робота' },
  { id: 'dare4', type: 'dare', text: 'Покажи свой лучший танцевальный движ' },
  { id: 'dare5', type: 'dare', text: 'Изобрази любимое животное без слов' },
];

export default function TruthOrDare() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { currentUser } = useGame();
  const { toast } = useToast();
  
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TruthOrDareQuestion | null>(null);
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
    if (!gameRoom || !currentUser || !currentQuestion) return;
    
    try {
      // Save answer
      await fetch('/api/game-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: parseInt(roomId || '0'),
          playerId: currentUser.id,
          questionId: currentQuestion.id,
          answer: completed ? 'completed' : 'skipped',
          completed
        })
      });

      // Update game state
      const newGameState = {
        ...gameState,
        currentQuestionIndex: gameState.currentQuestionIndex + 1
      };
      
      if (completed) {
        if (currentUser.id === gameRoom.player1Id) {
          newGameState.player1Score += 1;
        } else {
          newGameState.player2Score += 1;
        }
      }

      // Add to turn history
      const turnHistory = (newGameState as any).turnHistory || [];
      turnHistory.push(`${currentUser.username}: ${currentQuestion.text} - ${completed ? 'Выполнено' : 'Пропущено'}`);
      (newGameState as any).turnHistory = turnHistory;

      // Switch turn to other player
      const nextPlayer = currentUser.id === gameRoom.player1Id ? gameRoom.player2Id : gameRoom.player1Id;

      await fetch(`/api/games/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlayer: nextPlayer,
          gameData: newGameState
        })
      });

      // Send turn change via WebSocket
      sendMessage({
        type: 'turn_changed',
        roomId: parseInt(roomId || '0'),
        currentPlayer: nextPlayer,
        gameState: newGameState,
        completed,
        playerId: currentUser.id
      });

      // Reset local state
      setSelectedChoice(null);
      setCurrentQuestion(null);
      setTimeLeft(0);
      setIsMyTurn(false);
      setGameState(newGameState);

    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить ответ",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (!gameRoom || !players.player1 || !players.player2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4">Комната не найдена</h2>
          <button 
            onClick={() => navigate("/dashboard")}
            className="bg-white text-purple-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white">Правда или Действие</h1>
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-white/70 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Players */}
          <div className="flex justify-between items-center mb-4">
            <div className={`flex items-center space-x-3 ${isMyTurn && currentUser?.id === players.player1?.id ? 'opacity-100' : 'opacity-50'}`}>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {players.player1?.avatar || '👤'}
              </div>
              <div>
                <p className="text-white font-semibold">{players.player1?.username}</p>
                <p className="text-white/70 text-sm">Очки: {gameState.player1Score}</p>
              </div>
            </div>
            
            <div className="text-white/50 text-2xl">VS</div>
            
            <div className={`flex items-center space-x-3 ${isMyTurn && currentUser?.id === players.player2?.id ? 'opacity-100' : 'opacity-50'}`}>
              <div>
                <p className="text-white font-semibold text-right">{players.player2?.username}</p>
                <p className="text-white/70 text-sm text-right">Очки: {gameState.player2Score}</p>
              </div>
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {players.player2?.avatar || '👤'}
              </div>
            </div>
          </div>
          
          {/* Current Turn Indicator */}
          <div className="text-center">
            {isMyTurn ? (
              <p className="text-green-400 font-semibold">🎯 Ваш ход!</p>
            ) : (
              <p className="text-orange-400">⏰ Ход партнёра...</p>
            )}
          </div>
        </div>

        {/* Game Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          {!selectedChoice && isMyTurn && (
            <div className="text-center">
              <h2 className="text-white text-xl mb-6">Выберите категорию:</h2>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => selectChoice('truth')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
                >
                  🤔 Правда
                </button>
                <button
                  onClick={() => selectChoice('dare')}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
                >
                  🔥 Действие
                </button>
              </div>
            </div>
          )}

          {currentQuestion && (
            <div className="text-center">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
                selectedChoice === 'truth' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {selectedChoice === 'truth' ? '🤔 Правда' : '🔥 Действие'}
              </div>
              
              <div className="bg-white/20 rounded-xl p-6 mb-6">
                <p className="text-white text-lg leading-relaxed">
                  {currentQuestion.text}
                </p>
              </div>

              {isMyTurn && (
                <div>
                  {timeLeft > 0 && (
                    <div className="mb-4">
                      <div className="text-white/70 text-sm mb-2">
                        Осталось времени: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-yellow-400 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(timeLeft / 120) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => completeTask(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      ✅ Выполнено
                    </button>
                    <button
                      onClick={() => completeTask(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                    >
                      ⏭️ Пропустить
                    </button>
                  </div>
                </div>
              )}

              {!isMyTurn && currentQuestion && (
                <div className="text-center">
                  <p className="text-white/70 mb-4">
                    {currentUser?.id === gameRoom.currentPlayer ? 'Ваш партнёр' : 'Партнёр'} выполняет задание...
                  </p>
                  <div className="animate-pulse">
                    <div className="inline-block w-2 h-2 bg-white rounded-full mx-1 animate-bounce"></div>
                    <div className="inline-block w-2 h-2 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="inline-block w-2 h-2 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!currentQuestion && !isMyTurn && (
            <div className="text-center">
              <p className="text-white text-lg mb-4">Ожидаем выбор партнёра...</p>
              <div className="animate-pulse">
                <div className="inline-block w-3 h-3 bg-white rounded-full mx-1 animate-bounce"></div>
                <div className="inline-block w-3 h-3 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="inline-block w-3 h-3 bg-white rounded-full mx-1 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mt-4">
          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>Ход: {gameState.currentQuestionIndex + 1}</span>
            <button
              onClick={() => {
                if (confirm('Вы уверены, что хотите завершить игру?')) {
                  navigate('/dashboard');
                }
              }}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Завершить игру
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}