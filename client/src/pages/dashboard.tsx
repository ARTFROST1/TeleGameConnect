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

  const UserIcon = avatarIcons[parseInt(user?.avatar || '0') || 0];
  const PartnerIcon = partner ? avatarIcons[parseInt(partner.avatar) || 0] : null;
  const partnerGradient = partner ? avatarGradients[parseInt(partner.avatar) || 0] : "";

  return (
    <div className="min-h-screen bg-dark-950 text-white p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 via-transparent to-accent-pink/5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-between mb-8 relative z-10"
      >
        <div className="flex items-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className={`w-14 h-14 bg-gradient-to-br ${avatarGradients[parseInt(user?.avatar || '0') || 0]} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}
          >
            <UserIcon className="text-white text-lg" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
            <p className="text-gray-400 text-sm">ID: #{user?.id}</p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Button variant="ghost" size="sm" className="glass-button text-gray-400 hover:text-white rounded-xl p-3">
            <Settings className="text-xl" />
          </Button>
        </motion.div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        className="space-y-6 relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="modern-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-purple-600 rounded-2xl flex items-center justify-center mr-3">
                <Users className="text-white" size={18} />
              </div>
              <h3 className="font-semibold text-lg text-white">Партнёр</h3>
            </div>
            <Link href="/find-partner">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="sm" className="glass-button text-accent-purple hover:text-accent-pink rounded-xl p-2">
                  <Plus size={18} />
                </Button>
              </motion.div>
            </Link>
          </div>
          
          {partner ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${partnerGradient} rounded-2xl flex items-center justify-center mr-4`}>
                {PartnerIcon && <PartnerIcon className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{partner.username}</p>
                <p className="text-gray-400 text-sm">Онлайн</p>
              </div>
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-500" size={24} />
              </div>
              <p className="text-gray-400 text-sm">Добавьте партнёра для игры</p>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-pink to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <MessageCircleQuestion className="text-white" size={16} />
            </div>
            <h3 className="font-semibold text-xl text-white">Игры</h3>
          </div>
          
          <Link href="/truth-or-dare">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="modern-card p-6 cursor-pointer group"
            >
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ rotate: 10 }}
                  className="w-14 h-14 bg-gradient-to-br from-accent-purple to-accent-pink rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-accent-purple/20"
                >
                  <MessageCircleQuestion className="text-white text-xl" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-white mb-1">Правда или Действие</h4>
                  <p className="text-gray-400 text-sm">Классическая игра в онлайн формате</p>
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="text-gray-400 group-hover:text-accent-purple transition-colors"
                >
                  <ChevronRight size={20} />
                </motion.div>
              </div>
            </motion.div>
          </Link>
          
          <Link href="/sync-game">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="modern-card p-6 cursor-pointer group"
            >
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ rotate: -10 }}
                  className="w-14 h-14 bg-gradient-to-br from-accent-pink to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:shadow-accent-pink/20"
                >
                  <RotateCcw className="text-white text-xl" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-white mb-1">Синхрон</h4>
                  <p className="text-gray-400 text-sm">Проверьте насколько вы совпадаете</p>
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="text-gray-400 group-hover:text-accent-pink transition-colors"
                >
                  <ChevronRight size={20} />
                </motion.div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="modern-card p-6"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3">
              <BarChart className="text-white" size={18} />
            </div>
            <h3 className="font-semibold text-lg text-white">Статистика</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 bg-white/5 rounded-2xl border border-white/10"
            >
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-accent-purple mb-2"
              >
                {user?.gamesPlayed || 0}
              </motion.p>
              <p className="text-gray-400 text-sm font-medium">Игр сыграно</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 bg-white/5 rounded-2xl border border-white/10"
            >
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-accent-pink mb-2"
              >
                {user?.syncScore || 0}%
              </motion.p>
              <p className="text-gray-400 text-sm font-medium">Синхронизация</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
