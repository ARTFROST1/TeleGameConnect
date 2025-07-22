import { Button } from "@/components/ui/button";
import { User, Star, Heart, Flame, Settings, Plus, Users, MessageCircleQuestion, RotateCcw, ChevronRight, BarChart } from "lucide-react";
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
      <div className="min-h-screen bg-dark-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Пользователь не найден</p>
          <Link href="/">
            <Button className="mt-4">На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  const UserIcon = avatarIcons[parseInt(user.avatar) || 0];
  const partnerIcon = partner ? avatarIcons[parseInt(partner.avatar) || 0] : null;
  const partnerGradient = partner ? avatarGradients[parseInt(partner.avatar) || 0] : "";

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center">
          <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradients[parseInt(user.avatar) || 0]} rounded-full flex items-center justify-center mr-3`}>
            <UserIcon className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-zinc-400 text-sm">ID: #{user.id}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
          <Settings className="text-xl" />
        </Button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="gradient-border">
          <div className="gradient-border-content p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center">
                <Users className="mr-2 text-accent-purple" size={20} />
                Партнёр
              </h3>
              <Link href="/find-partner">
                <Button variant="ghost" size="sm" className="text-accent-purple hover:text-accent-pink">
                  <Plus size={16} />
                </Button>
              </Link>
            </div>
            
            {partner ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${partnerGradient} rounded-full flex items-center justify-center mr-3`}>
                  {partnerIcon && <partnerIcon className="text-white text-sm" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{partner.username}</p>
                  <p className="text-zinc-400 text-sm">Онлайн</p>
                </div>
                <motion.div 
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="w-3 h-3 bg-green-500 rounded-full"
                />
              </motion.div>
            ) : (
              <p className="text-zinc-400 text-sm text-center py-4">Добавьте партнёра для игры</p>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-4">Игры</h3>
          
          <Link href="/truth-or-dare">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="gradient-border cursor-pointer"
            >
              <div className="gradient-border-content p-6 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-pink rounded-xl flex items-center justify-center mr-4">
                    <MessageCircleQuestion className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Правда или Действие</h4>
                    <p className="text-zinc-400 text-sm">Классическая игра в онлайн формате</p>
                  </div>
                  <ChevronRight className="text-zinc-400" />
                </div>
              </div>
            </motion.div>
          </Link>
          
          <Link href="/sync-game">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="gradient-border cursor-pointer"
            >
              <div className="gradient-border-content p-6 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-pink to-purple-500 rounded-xl flex items-center justify-center mr-4">
                    <RotateCcw className="text-white text-lg" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Синхрон</h4>
                    <p className="text-zinc-400 text-sm">Проверьте насколько вы совпадаете</p>
                  </div>
                  <ChevronRight className="text-zinc-400" />
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gradient-border"
        >
          <div className="gradient-border-content p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <BarChart className="mr-2 text-accent-purple" size={20} />
              Статистика
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-purple">{user.gamesPlayed}</p>
                <p className="text-zinc-400 text-sm">Игр сыграно</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-pink">{user.syncScore}%</p>
                <p className="text-zinc-400 text-sm">Синхронизация</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
