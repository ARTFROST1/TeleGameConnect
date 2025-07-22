import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, Heart, Flame, Settings, Plus, Users, MessageCircleQuestion, RotateCcw, ChevronRight, BarChart, Trophy, Clock, Zap, History } from "lucide-react";
import { Link } from "wouter";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

export default function Dashboard() {
  const { currentUser, partner } = useGame();

  // Refresh user data to get updated stats
  const { data: updatedUser } = useQuery({
    queryKey: ["/api/users", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const user = updatedUser || currentUser;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-950 dark:via-pink-950 dark:to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Пользователь не найден</p>
            <Link href="/">
              <Button className="mt-4">На главную</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const UserIcon = avatarIcons[parseInt((user as any)?.avatar || '0') || 0];
  const PartnerIcon = partner ? avatarIcons[parseInt(partner.avatar) || 0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-950 dark:via-pink-950 dark:to-purple-900">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt((user as any)?.avatar || '0') || 0]}`}
            >
              <UserIcon className="h-6 w-6 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {(user as any)?.username}
              </h1>
              <p className="text-muted-foreground">ID: #{(user as any)?.id}</p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Partner Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Партнёр
                  </CardTitle>
                  <Link href="/find-partner">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {partner ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 rounded-lg"
                  >
                    <div className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(partner.avatar) || 0]}`}>
                      {PartnerIcon && <PartnerIcon className="h-5 w-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{partner.username}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Онлайн
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center py-8"
                  >
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">Добавьте партнёра для игры</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Статистика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {(user as any).gamesPlayed}
                    </div>
                    <div className="text-xs text-muted-foreground">Игр</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-400/10 dark:to-cyan-400/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(user as any).syncScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Синхрон</div>
                  </div>
                </div>
                <Link href="/statistics">
                  <Button variant="outline" className="w-full" size="sm">
                    <BarChart className="h-4 w-4 mr-2" />
                    Подробная статистика
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Games Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircleQuestion className="h-5 w-5" />
                  Игры
                </CardTitle>
                <CardDescription>Выберите игру для начала</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/truth-or-dare">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ rotate: 10 }}
                          className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                          <Zap className="h-5 w-5 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Правда или Действие</h4>
                          <p className="text-sm text-muted-foreground">Классическая игра в онлайн формате</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </motion.div>
                  </Link>
                  
                  <Link href="/sync-game">
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ rotate: -10 }}
                          className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                        >
                          <Heart className="h-5 w-5 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Синхронизация</h4>
                          <p className="text-sm text-muted-foreground">Проверьте насколько вы совпадаете</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </motion.div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Features */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="md:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Дополнительно</CardTitle>
                <CardDescription>Исследуйте больше возможностей</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/game-history">
                    <Button variant="outline" className="w-full justify-start" size="lg">
                      <History className="h-4 w-4 mr-2" />
                      История игр
                    </Button>
                  </Link>
                  <Link href="/statistics">
                    <Button variant="outline" className="w-full justify-start" size="lg">
                      <BarChart className="h-4 w-4 mr-2" />
                      Подробная статистика
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}