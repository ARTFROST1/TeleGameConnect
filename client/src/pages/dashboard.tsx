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
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen">
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
              <h1 className="text-3xl font-bold text-gradient">
                {(user as any)?.username}
              </h1>
              <p className="text-muted-foreground">ID: #{(user as any)?.id}</p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full text-[#f9c8e9] bg-[#23252f00]">
              <Settings className="h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Partner Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gradient">
                  <Users className="h-5 w-5" />
                  Партнёр
                </CardTitle>
                <Link href="/find-partner">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
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
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-primary/10 border border-primary/20"
                >
                  <div className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(partner.avatar) || 0]} floating-animation`}>
                    {PartnerIcon && <PartnerIcon className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{partner.username}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full pulse-animation"></div>
                      Онлайн
                    </p>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="hover:bg-primary/10">
                      <User className="h-4 w-4 mr-2" />
                      Профиль
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className="p-6 rounded-full bg-gradient-primary/10 w-fit mx-auto mb-6">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Найдите партнера</h3>
                  <span className="text-muted-foreground mb-6 block">Добавьте партнёра для совместных игр</span>
                  <Link href="/find-partner">
                    <Button className="modern-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Найти партнера
                    </Button>
                  </Link>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Games Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <MessageCircleQuestion className="h-5 w-5" />
                Игры
              </CardTitle>
              <CardDescription>Выберите игру для начала</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/truth-or-dare">
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-card p-6 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-4">
                      <motion.div 
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className="p-4 rounded-2xl bg-gradient-primary glow-effect"
                      >
                        <Zap className="h-6 w-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2 text-gradient">Правда или Действие</h4>
                        <p className="text-sm text-muted-foreground">Классическая игра в современном формате</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                </Link>
                
                <Link href="/sync-game">
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-card p-6 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-4">
                      <motion.div 
                        whileHover={{ rotate: -15, scale: 1.1 }}
                        className="p-4 rounded-2xl bg-gradient-secondary glow-effect"
                      >
                        <Heart className="h-6 w-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl mb-2 text-gradient">Синхронизация</h4>
                        <p className="text-sm text-muted-foreground">Проверьте насколько вы совпадаете</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Access */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-gradient">Быстрый доступ</CardTitle>
              <CardDescription>Управляйте своим профилем и просматривайте статистику</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/profile" className="block">
                  <div className="glass-card hover:glow-effect p-4 rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Профиль</div>
                        <div className="text-xs text-muted-foreground">Статистика и история</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/game-history" className="block">
                  <div className="glass-card hover:glow-effect p-4 rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">История игр</div>
                        <div className="text-xs text-muted-foreground">Прошлые игры</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/statistics" className="block">
                  <div className="glass-card hover:glow-effect p-4 rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <BarChart className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Статистика</div>
                        <div className="text-xs text-muted-foreground">Подробные данные</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}