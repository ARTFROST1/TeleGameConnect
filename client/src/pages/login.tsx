import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
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
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        navigate("/dashboard");
        toast({
          title: "Добро пожаловать!",
          description: `Рады видеть вас снова, ${user.username}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка входа",
          description: error.message || "Пользователь не найден",
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
    <div className="min-h-screen bg-dark-950 text-white p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 via-transparent to-accent-pink/5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center mb-8 relative z-10"
      >
        <Link href="/">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" size="sm" className="glass-button text-accent-purple mr-4 rounded-xl p-3">
              <ArrowLeft className="text-xl" />
            </Button>
          </motion.div>
        </Link>
        <h2 className="text-2xl font-bold text-white">Вход</h2>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        className="modern-card p-8 relative z-10"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label className="block text-sm font-medium mb-4 text-white">Имя пользователя</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border-white/20 text-white focus:border-accent-purple rounded-xl h-12 px-4 backdrop-blur-sm"
              placeholder="Введите ваше имя"
              required
            />
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-xl h-14 font-medium text-lg hover:shadow-xl hover:shadow-accent-purple/20 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Войти"
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
