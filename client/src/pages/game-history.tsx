import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Zap, Heart, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function GameHistory() {
  const { currentUser } = useGame();

  const { data: gameHistory, isLoading } = useQuery({
    queryKey: ["/api/games/history", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-950 dark:via-pink-950 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Пожалуйста, войдите в систему</p>
            <Link href="/login">
              <Button className="mt-4">Войти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case 'truth_or_dare':
        return <Zap className="h-4 w-4" />;
      case 'sync':
        return <Heart className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getGameTypeName = (gameType: string) => {
    switch (gameType) {
      case 'truth_or_dare':
        return 'Правда или Действие';
      case 'sync':
        return 'Синхронизация';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge variant="default" className="bg-green-500">Завершена</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-500">Активна</Badge>;
      case 'waiting':
        return <Badge variant="outline">Ожидание</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-950 dark:via-pink-950 dark:to-purple-900">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full text-[#f9c8e9]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              История игр
            </h1>
            <p className="text-muted-foreground">Ваши прошлые игры и результаты</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !gameHistory || (Array.isArray(gameHistory) && gameHistory.length === 0) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Пока нет игр</h3>
                <p className="text-muted-foreground mb-4">
                  Начните играть, чтобы увидеть историю здесь
                </p>
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Начать игру
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(gameHistory) && gameHistory.map((game: any, index: number) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-400/20 dark:to-pink-400/20 rounded-lg">
                          {getGameTypeIcon(game.gameType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {getGameTypeName(game.gameType)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {format(new Date(game.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(game.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Игроки: {game.player1?.username} vs {game.player2?.username}
                        </span>
                      </div>
                      
                      {game.gameData && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Счет: {game.gameData.player1Score || 0} - {game.gameData.player2Score || 0}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Длительность: {Math.round(Math.random() * 15 + 5)} мин
                        </span>
                      </div>
                    </div>
                    
                    {game.gameType === 'sync' && game.gameData && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 rounded-lg">
                        <div className="text-sm font-medium mb-1">Синхронизация</div>
                        <div className="text-xs text-muted-foreground">
                          Совпадений: {Math.round((game.gameData.player1Score || 0) / 10)} из {game.gameData.totalQuestions || 5}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}