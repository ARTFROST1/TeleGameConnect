import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, User, Star, Heart, Flame, Loader } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center mb-6"
      >
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-accent-purple mr-4">
            <ArrowLeft className="text-xl" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Найти партнёра</h2>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <form onSubmit={handleSearch}>
          <Label className="block text-sm font-medium mb-2">Поиск партнёра</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-dark-800 border-zinc-700 text-white focus:border-accent-purple"
              placeholder="Введите имя пользователя"
            />
            <Button 
              type="submit"
              disabled={isSearching}
              className="bg-accent-purple text-white hover:bg-accent-pink"
            >
              {isSearching ? <Loader className="animate-spin" size={16} /> : <Search size={16} />}
            </Button>
          </div>
        </form>
        
        {searchResults.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="gradient-border"
          >
            <div className="gradient-border-content p-6">
              <h3 className="font-semibold mb-3">Найденные игроки</h3>
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const UserIcon = avatarIcons[parseInt(user.avatar) || 0];
                  const gradient = avatarGradients[parseInt(user.avatar) || 0];
                  
                  return (
                    <motion.div 
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-dark-800 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center mr-3`}>
                          <UserIcon className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-zinc-400 text-sm">ID: #{user.id}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => addPartner(user.id)}
                        disabled={isAdding === user.id}
                        className="bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-medium hover:scale-105 transition-transform disabled:transform-none"
                        size="sm"
                      >
                        {isAdding === user.id ? <Loader className="animate-spin" size={14} /> : "Добавить"}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
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
