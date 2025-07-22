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
      const response = await fetch("/api/users/login", {
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
    <div className="min-h-screen bg-dark-900 text-white p-6">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center mb-6"
      >
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-accent-purple mr-4">
            <ArrowLeft className="text-xl" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Вход</h2>
      </motion.div>
      
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit} 
        className="space-y-6"
      >
        <div>
          <Label className="block text-sm font-medium mb-2">Имя пользователя</Label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-dark-800 border-zinc-700 text-white focus:border-accent-purple"
            placeholder="Введите ваше имя"
            required
          />
        </div>
        
        <Button 
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:transform-none"
        >
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </motion.form>
    </div>
  );
}
