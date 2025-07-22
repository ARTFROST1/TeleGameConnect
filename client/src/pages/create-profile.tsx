import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Star, Heart, Flame } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const avatarOptions = [
  { icon: User, gradient: "from-purple-500 to-pink-500" },
  { icon: Star, gradient: "from-blue-500 to-cyan-500" },
  { icon: Heart, gradient: "from-green-500 to-emerald-500" },
  { icon: Flame, gradient: "from-orange-500 to-red-500" },
];

export default function CreateProfile() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentUser } = useGame();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          avatar: selectedAvatar.toString(),
        }),
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        navigate("/dashboard");
        toast({
          title: "Профиль создан!",
          description: "Добро пожаловать в Couple Games",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось создать профиль",
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center mb-8"
      >
        <Link href="/">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="sm" className="rounded-xl p-3 mr-4">
              <ArrowLeft className="text-xl" />
            </Button>
          </motion.div>
        </Link>
        <h2 className="text-2xl font-bold text-gradient">Создание профиля</h2>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        className="glass-card p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label className="block text-sm font-medium mb-4">Ваше имя</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl h-12"
              placeholder="Введите ваше имя"
              required
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium mb-4">Выберите аватар</Label>
            <div className="grid grid-cols-4 gap-4">
              {avatarOptions.map((avatar, index) => {
                const IconComponent = avatar.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`aspect-square bg-gradient-to-br ${avatar.gradient} rounded-3xl flex items-center justify-center cursor-pointer border-2 transition-all duration-300 ${
                      selectedAvatar === index 
                        ? 'border-primary shadow-xl shadow-primary/30 scale-105' 
                        : 'border-border hover:border-primary/50 hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedAvatar(index)}
                  >
                    <motion.div
                      animate={selectedAvatar === index ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <IconComponent className="text-2xl text-white" />
                    </motion.div>
                    
                    {selectedAvatar === index && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                      >
                        <Heart className="text-white text-xs" fill="white" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full modern-button rounded-xl h-14 font-medium text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Создать профиль"
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
