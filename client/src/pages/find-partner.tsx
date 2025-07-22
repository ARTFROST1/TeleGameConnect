import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, User, Star, Heart, Flame, Loader } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { User as UserType } from "@shared/schema";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

export default function FindPartner() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<number | null>(null);
  const { currentUser, setCurrentUser, setPartner } = useGame();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const users = await response.json();
        // Filter out current user from results
        const filteredUsers = users.filter((user: UserType) => user.id !== currentUser?.id);
        setSearchResults(filteredUsers);
      } else {
        toast({
          title: "Ошибка поиска",
          description: "Не удалось найти пользователей",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addPartner = async (partnerId: number) => {
    if (!currentUser) return;

    setIsAdding(partnerId);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/partner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        const partner = searchResults.find(user => user.id === partnerId);
        
        setCurrentUser(updatedUser);
        if (partner) {
          setPartner(partner);
        }
        
        navigate("/dashboard");
        toast({
          title: "Партнёр добавлен!",
          description: "Теперь вы можете играть вместе",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось добавить партнёра",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive",
      });
    } finally {
      setIsAdding(null);
    }
  };

  // Загружаем тестового партнёра при первом рендере
  useEffect(() => {
    const loadTestPartner = async () => {
      try {
        const response = await fetch('/api/users/search?q=Тестовый');
        if (response.ok) {
          const users = await response.json();
          const filteredUsers = users.filter((user: UserType) => user.id !== currentUser?.id);
          setSearchResults(filteredUsers);
        }
      } catch (error) {
        console.error('Failed to load test partner:', error);
      }
    };
    loadTestPartner();
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen bg-dark-950 text-white p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 via-transparent to-accent-pink/5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center mb-8 relative z-10"
      >
        <Link href="/dashboard">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="sm" className="glass-button text-accent-purple mr-4 rounded-xl p-3">
              <ArrowLeft className="text-xl" />
            </Button>
          </motion.div>
        </Link>
        <h2 className="text-2xl font-bold text-white">Найти партнёра</h2>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        className="space-y-8 relative z-10"
      >
        {/* Информация о тестовом режиме */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="modern-card p-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mr-3">
              <Heart className="text-white" size={18} />
            </div>
            <h3 className="font-semibold text-lg text-white">Тестовый режим</h3>
          </div>
          <p className="text-gray-400 text-sm">
            Пока приложение работает в демо режиме. Вы можете добавить тестового партнёра для проверки игр.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="modern-card p-6"
        >
          <h3 className="font-semibold text-lg text-white mb-6">Поиск партнёра</h3>
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white/5 border-white/20 text-white focus:border-accent-purple rounded-xl h-12 px-4 backdrop-blur-sm"
                placeholder="Введите имя пользователя"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  type="submit"
                  disabled={isSearching}
                  className="bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-xl h-12 px-6 hover:shadow-lg hover:shadow-accent-purple/20"
                >
                  {isSearching ? <Loader className="animate-spin" size={16} /> : <Search size={16} />}
                </Button>
              </motion.div>
            </div>
          </form>
        </motion.div>
        
        {searchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="modern-card p-6"
          >
            <h3 className="font-semibold text-lg text-white mb-6">Найденные игроки</h3>
            <div className="space-y-4">
              {searchResults.map((user, index) => {
                const UserIcon = avatarIcons[parseInt(user.avatar) || 0];
                const gradient = avatarGradients[parseInt(user.avatar) || 0];
                const isTestPartner = user.id === 999;
                
                return (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer"
                  >
                    <div className="flex items-center">
                      <motion.div 
                        whileHover={{ rotate: 10 }}
                        className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}
                      >
                        <UserIcon className="text-white" />
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{user.username}</p>
                          {isTestPartner && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg border border-green-500/30">
                              DEMO
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {isTestPartner ? `${user.gamesPlayed} игр • ${user.syncScore}% синхрон` : `ID: #${user.id}`}
                        </p>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => addPartner(user.id)}
                        disabled={isAdding === user.id}
                        className="bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-xl px-6 py-2 font-medium hover:shadow-lg hover:shadow-accent-purple/20 transition-all duration-300 disabled:transform-none"
                        size="sm"
                      >
                        {isAdding === user.id ? 
                          <Loader className="animate-spin" size={16} /> : 
                          "Добавить"
                        }
                      </Button>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {!isSearching && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-8">
            <p className="text-zinc-400">Пользователи не найдены</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
