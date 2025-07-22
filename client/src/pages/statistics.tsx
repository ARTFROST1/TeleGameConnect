import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Target, Heart, Flame, Star, User } from "lucide-react";
import { Link } from "wouter";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

export default function Statistics() {
  const { currentUser, partner } = useGame();

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

  const AvatarIcon = avatarIcons[parseInt(currentUser.avatar)];
  const PartnerIcon = partner ? avatarIcons[parseInt(partner.avatar)] : User;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              Статистика
            </h1>
            <p className="text-muted-foreground">Ваши достижения в играх</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Личная статистика */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(currentUser.avatar)]}`}>
                    <AvatarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{currentUser.username}</CardTitle>
                    <CardDescription>Ваша статистика</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Игр сыграно
                    </span>
                    <Badge variant="secondary">{currentUser.gamesPlayed}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Синхронизация
                    </span>
                    <span className="text-sm font-medium">{currentUser.syncScore}%</span>
                  </div>
                  <Progress value={currentUser.syncScore} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-gradient-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(currentUser.gamesPlayed * 0.7)}
                    </div>
                    <div className="text-xs text-muted-foreground">Правда</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-secondary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(currentUser.gamesPlayed * 0.3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Действие</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Статистика партнера */}
          {partner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(partner.avatar)]}`}>
                      <PartnerIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{partner.username}</CardTitle>
                      <CardDescription>Статистика партнера</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Игр сыграно
                      </span>
                      <Badge variant="secondary">{partner.gamesPlayed}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Синхронизация
                      </span>
                      <span className="text-sm font-medium">{partner.syncScore}%</span>
                    </div>
                    <Progress value={partner.syncScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {Math.round(partner.gamesPlayed * 0.7)}
                      </div>
                      <div className="text-xs text-muted-foreground">Правда</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 dark:from-pink-400/10 dark:to-purple-400/10 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        {Math.round(partner.gamesPlayed * 0.3)}
                      </div>
                      <div className="text-xs text-muted-foreground">Действие</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Достижения */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Достижения
                </CardTitle>
                <CardDescription>Ваши награды и успехи</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg text-center ${currentUser.gamesPlayed >= 1 ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-400/20 dark:to-emerald-400/20' : 'bg-muted/50'}`}>
                    <div className={`text-2xl mb-2 ${currentUser.gamesPlayed >= 1 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      🎮
                    </div>
                    <div className="text-sm font-medium">Первая игра</div>
                    <div className="text-xs text-muted-foreground">Сыграйте в первую игру</div>
                  </div>

                  <div className={`p-4 rounded-lg text-center ${currentUser.gamesPlayed >= 5 ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-400/20 dark:to-cyan-400/20' : 'bg-muted/50'}`}>
                    <div className={`text-2xl mb-2 ${currentUser.gamesPlayed >= 5 ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                      🏆
                    </div>
                    <div className="text-sm font-medium">Игрок</div>
                    <div className="text-xs text-muted-foreground">Сыграйте 5 игр</div>
                  </div>

                  <div className={`p-4 rounded-lg text-center ${currentUser.syncScore >= 70 ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-400/20 dark:to-pink-400/20' : 'bg-muted/50'}`}>
                    <div className={`text-2xl mb-2 ${currentUser.syncScore >= 70 ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`}>
                      💕
                    </div>
                    <div className="text-sm font-medium">Синхрон</div>
                    <div className="text-xs text-muted-foreground">70% синхронизации</div>
                  </div>

                  <div className={`p-4 rounded-lg text-center ${partner ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 dark:from-red-400/20 dark:to-pink-400/20' : 'bg-muted/50'}`}>
                    <div className={`text-2xl mb-2 ${partner ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      ❤️
                    </div>
                    <div className="text-sm font-medium">Связь</div>
                    <div className="text-xs text-muted-foreground">Найдите партнера</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}