import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGame } from '@/contexts/GameContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { User as UserType, GameRoom } from '@shared/schema';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface TruthOrDareQuestion {
  id: string;
  type: 'truth' | 'dare';
  text: string;
}

export default function TruthOrDare() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { currentUser } = useGame();
  
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
  const [showExitDialog, setShowExitDialog] = useState(false);

  // WebSocket for real-time game updates
  const { sendMessage } = useWebSocket({
    roomId: parseInt(roomId || '0'),
  });

  // Listen for WebSocket messages specific to Truth or Dare game
  useEffect(() => {
    const handleMessage = (event: CustomEvent) => {
      const message = event.detail;
      console.log('Truth or Dare message received:', message);
      
      switch (message.type) {
        case 'question_assigned':
          // Both players see the same question and choice
          console.log('Question assigned received:', message, 'Current user ID:', currentUser?.id);
          setCurrentQuestion(message.question);
          setSelectedChoice(message.choice);
          if (message.currentPlayer === currentUser?.id) {
            setTimeLeft(120); // 2 minutes for the current player
          }
          break;
          
        case 'turn_changed':
          // Update game state and switch turns
          console.log('Turn changed received:', message, 'Current user ID:', currentUser?.id);
          setGameState(message.gameState);
          const newIsMyTurn = message.currentPlayer === currentUser?.id;
          console.log('Setting isMyTurn to:', newIsMyTurn);
          setIsMyTurn(newIsMyTurn);
          setSelectedChoice(null);
          setCurrentQuestion(null);
          setTimeLeft(0);
          break;
          
        case 'player_left_game':
          // Show notification that partner left the game
          alert(`${message.playerName} покинул игру`);
          navigate('/dashboard');
          break;
      }
    };

    // Listen for custom WebSocket events from the hook
    window.addEventListener('truth-or-dare-message', handleMessage as EventListener);
    return () => {
      window.removeEventListener('truth-or-dare-message', handleMessage as EventListener);
    };
  }, [currentUser?.id, navigate]);

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
          console.log('Current player in room:', room.currentPlayer, 'Current user ID:', currentUser?.id, 'Is my turn:', room.currentPlayer === currentUser?.id);
          
        } else {
          console.error("Game room not found");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Failed to load game room:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadGameRoom();
  }, [roomId, currentUser?.id, navigate]);

  // Timer for turns
  useEffect(() => {
    if (isMyTurn && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, timeLeft]);

  const selectChoice = (choice: 'truth' | 'dare') => {
    if (!currentUser || !isMyTurn) {
      console.log('Cannot select choice:', { 
        currentUser: !!currentUser, 
        isMyTurn, 
        currentUserId: currentUser?.id, 
        gameRoomCurrentPlayer: gameRoom?.currentPlayer 
      });
      return;
    }
    
    console.log('Selecting choice:', choice, 'for player', currentUser.id);
    
    // Send choice to server - server will generate the question and broadcast to all players
    sendMessage({
      type: 'truth_or_dare_choice',
      roomId: parseInt(roomId || '0'),
      playerId: currentUser.id,
      choice
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
      // Don't set isMyTurn here - it will be updated via WebSocket message
      setGameState(newGameState);

    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleExitGame = () => {
    if (!currentUser || !gameRoom) return;
    
    // Notify other player that this player is leaving
    sendMessage({
      type: 'player_left_game',
      roomId: parseInt(roomId || '0'),
      playerId: currentUser.id,
      playerName: currentUser.username
    });
    
    // Navigate back to dashboard
    navigate('/dashboard');
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
            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
              <AlertDialogTrigger asChild>
                <button 
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Выйти из игры?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите покинуть игру? Ваш партнёр получит уведомление о том, что вы завершили игру.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleExitGame}>
                    Выйти из игры
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              <p className="text-white font-semibold">🎯 Ваш ход!</p>
            ) : (
              <p className="text-white/70">Ход соперника...</p>
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

          {!selectedChoice && !isMyTurn && (
            <div className="text-center">
              <h2 className="text-white text-xl mb-6">Соперник выбирает категорию...</h2>
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-white/20 rounded-full mx-auto"></div>
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

              {!isMyTurn && (
                <div className="text-center">
                  <p className="text-white/70 mb-4">Соперник выполняет задание...</p>
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-white/20 rounded-full mx-auto"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game History */}
        {gameState.turnHistory && gameState.turnHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mt-6">
            <h3 className="text-white font-semibold mb-4">История игры:</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {gameState.turnHistory.map((turn, index) => (
                <div key={index} className="text-white/70 text-sm bg-white/5 rounded-lg p-2">
                  {turn}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}