import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Star, 
  Heart, 
  Flame, 
  Trophy, 
  Target, 
  Clock, 
  Zap, 
  History, 
  BarChart3,
  Users,
  Award,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

export default function Profile() {
  const { currentUser, partner } = useGame();

  const { data: updatedUser } = useQuery({
    queryKey: ["/api/users", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const { data: gameHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/games/history", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const user = updatedUser || currentUser;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-card w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Пожалуйста, войдите в систему</p>
            <Link href="/login">
              <Button className="mt-4 modern-button">Войти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const UserIcon = avatarIcons[parseInt((user as any)?.avatar || '0') || 0];
  const PartnerIcon = partner ? avatarIcons[parseInt(partner.avatar) || 0] : null;

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
        return <Badge className="bg-green-500">Завершена</Badge>;
      case 'active':
        return <Badge className="bg-blue-500">Активна</Badge>;
      case 'waiting':
        return <Badge variant="outline">Ожидание</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full glass-card text-[#f9c8e9]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-gradient">
              Профиль
            </h1>
            <p className="text-muted-foreground">Управляйте вашим аккаунтом и статистикой</p>
          </div>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-8"
        >
          <Card className="glass-card overflow-hidden">
            <div className="bg-gradient-primary h-32 relative">
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <CardContent className="relative">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 pb-6">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className={`w-32 h-32 rounded-full bg-gradient-to-r ${avatarGradients[parseInt((user as any)?.avatar || '0') || 0]} p-1 floating-animation`}
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <UserIcon className="h-16 w-16 text-primary" />
                  </div>
                </motion.div>
                <div className="flex-1 md:mb-4">
                  <h2 className="text-3xl font-bold text-gradient mb-2">
                    {(user as any)?.username}
                  </h2>
                  <p className="text-muted-foreground mb-4">ID: #{(user as any)?.id}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {(user as any).gamesPlayed} игр
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {(user as any).syncScore}% синхрон
                    </Badge>
                    {partner && (
                      <Badge className="bg-gradient-primary text-white flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        В паре с {partner.username}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 glass-card p-1">
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Статистика
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                История
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Достижения
              </TabsTrigger>
            </TabsList>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Card className="stat-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Всего игр</p>
                          <p className="text-3xl font-bold text-gradient">{(user as any).gamesPlayed}</p>
                        </div>
                        <Trophy className="h-8 w-8 text-primary pulse-animation" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Card className="stat-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Синхронизация</p>
                          <p className="text-3xl font-bold text-gradient">{(user as any).syncScore}%</p>
                        </div>
                        <Target className="h-8 w-8 text-primary pulse-animation" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Card className="stat-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Правда</p>
                          <p className="text-3xl font-bold text-gradient">{Math.round((user as any).gamesPlayed * 0.7)}</p>
                        </div>
                        <Zap className="h-8 w-8 text-primary pulse-animation" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Card className="stat-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Действие</p>
                          <p className="text-3xl font-bold text-gradient">{Math.round((user as any).gamesPlayed * 0.3)}</p>
                        </div>
                        <Heart className="h-8 w-8 text-primary pulse-animation" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Прогресс синхронизации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Текущий уровень</span>
                        <span className="font-medium">{(user as any).syncScore}%</span>
                      </div>
                      <Progress value={(user as any).syncScore} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {Math.round((user as any).syncScore * 0.8)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Лучший результат</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {Math.round((user as any).syncScore * 0.6)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Средний результат</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Partner Stats */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Партнер
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {partner ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-primary/10">
                          <div className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(partner.avatar) || 0]}`}>
                            {PartnerIcon && <PartnerIcon className="h-6 w-6 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{partner.username}</p>
                            <p className="text-sm text-muted-foreground">ID: #{partner.id}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg bg-purple-500/10">
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {partner.gamesPlayed}
                            </div>
                            <div className="text-xs text-muted-foreground">Игр сыграно</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-pink-500/10">
                            <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                              {partner.syncScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Синхронизация</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">У вас пока нет партнера</p>
                        <Link href="/find-partner">
                          <Button className="modern-button">
                            Найти партнера
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              {historyLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="glass-card animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !gameHistory || (Array.isArray(gameHistory) && gameHistory.length === 0) ? (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Пока нет игр</h3>
                    <p className="text-muted-foreground mb-4">
                      Начните играть, чтобы увидеть историю здесь
                    </p>
                    <Link href="/dashboard">
                      <Button className="modern-button">
                        Начать игру
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(gameHistory) && gameHistory.map((game: any, index: number) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="glass-card hover:glow-effect">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-primary rounded-lg">
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
                                {game.player1?.username} vs {game.player2?.username}
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
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {Math.round(Math.random() * 15 + 5)} мин
                              </span>
                            </div>
                          </div>
                          
                          {game.gameType === 'sync' && game.gameData && (
                            <div className="mt-4 p-3 rounded-lg bg-gradient-primary/10">
                              <div className="text-sm font-medium mb-1">Результат синхронизации</div>
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
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: 'first-game',
                    emoji: '🎮',
                    title: 'Первая игра',
                    description: 'Сыграйте в первую игру',
                    achieved: (user as any).gamesPlayed >= 1,
                    progress: Math.min((user as any).gamesPlayed, 1),
                    max: 1
                  },
                  {
                    id: 'player',
                    emoji: '🏆',
                    title: 'Игрок',
                    description: 'Сыграйте 5 игр',
                    achieved: (user as any).gamesPlayed >= 5,
                    progress: Math.min((user as any).gamesPlayed, 5),
                    max: 5
                  },
                  {
                    id: 'sync-master',
                    emoji: '💕',
                    title: 'Мастер синхрона',
                    description: '70% синхронизации',
                    achieved: (user as any).syncScore >= 70,
                    progress: Math.min((user as any).syncScore, 70),
                    max: 70
                  },
                  {
                    id: 'connected',
                    emoji: '❤️',
                    title: 'Связанные',
                    description: 'Найдите партнера',
                    achieved: !!partner,
                    progress: partner ? 1 : 0,
                    max: 1
                  },
                  {
                    id: 'veteran',
                    emoji: '⭐',
                    title: 'Ветеран',
                    description: 'Сыграйте 20 игр',
                    achieved: (user as any).gamesPlayed >= 20,
                    progress: Math.min((user as any).gamesPlayed, 20),
                    max: 20
                  },
                  {
                    id: 'perfect-sync',
                    emoji: '🎯',
                    title: 'Идеальная синхронизация',
                    description: '95% синхронизации',
                    achieved: (user as any).syncScore >= 95,
                    progress: Math.min((user as any).syncScore, 95),
                    max: 95
                  }
                ].map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Card className={`glass-card transition-all duration-300 ${achievement.achieved ? 'glow-effect border-primary' : 'opacity-60'}`}>
                      <CardContent className="p-6 text-center">
                        <div className={`text-4xl mb-3 ${achievement.achieved ? 'animate-bounce' : ''}`}>
                          {achievement.emoji}
                        </div>
                        <h3 className="font-semibold mb-2">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{achievement.description}</p>
                        {!achievement.achieved && (
                          <div className="space-y-2">
                            <Progress value={(achievement.progress / achievement.max) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {achievement.progress} / {achievement.max}
                            </p>
                          </div>
                        )}
                        {achievement.achieved && (
                          <Badge className="bg-gradient-primary text-white">
                            Получено!
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}