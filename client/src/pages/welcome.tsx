import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Declare Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        ready(): void;
        MainButton: {
          text: string;
          show(): void;
          hide(): void;
        };
      };
    };
  }
}

export default function Welcome() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  const { setCurrentUser } = useGame();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're running inside Telegram Web App
    if (window.Telegram?.WebApp) {
      setIsTelegramApp(true);
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (isTelegramApp && window.Telegram?.WebApp.initData) {
        // Use Telegram authentication
        response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            initData: window.Telegram.WebApp.initData
          }),
        });
      } else {
        // Fallback to demo authentication
        const randomUsername = `User${Math.floor(Math.random() * 10000)}`;
        response = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: randomUsername }),
        });
      }

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        navigate("/dashboard");
        toast({
          title: "Добро пожаловать!",
          description: `Начинаем играть, ${user.username}`,
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось войти в приложение",
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
    <div className="min-h-screen p-6 flex flex-col justify-center relative overflow-hidden">
      {/* Background will be applied via body CSS */}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-12 relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.2
          }}
          className="w-24 h-24 mx-auto mb-8 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-2xl relative"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
          >
            <Heart className="text-3xl text-white" fill="white" />
          </motion.div>
          
          {/* Floating particles */}
          <motion.div
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-primary/50 rounded-full blur-sm"
          />
          <motion.div
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 1.5
            }}
            className="absolute -bottom-2 -left-2 w-3 h-3 bg-primary/50 rounded-full blur-sm"
          />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl font-bold mb-3 text-gradient"
        >
          Couple Games
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-gray-300 text-lg font-light"
        >
          Играйте и общайтесь вместе
        </motion.p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="space-y-6 relative z-10"
      >
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card p-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mr-4">
              <Heart className="text-xl text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Начать играть</h3>
              <p className="text-gray-300 text-sm">Автоматический вход в приложение</p>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={handleStart}
              disabled={isLoading}
              className="w-full modern-button rounded-xl h-14 font-medium text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Начать"
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}