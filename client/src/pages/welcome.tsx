import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Welcome() {
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
          className="text-muted-foreground text-lg font-light"
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
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mr-4">
              <Heart className="text-xl text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Новый игрок</h3>
              <p className="text-muted-foreground text-sm">Создайте профиль и начните играть</p>
            </div>
          </div>
          <Link href="/create-profile">
            <Button className="w-full modern-button rounded-xl h-12 font-medium">
              Создать профиль
            </Button>
          </Link>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass-card p-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-secondary rounded-2xl flex items-center justify-center mr-4">
              <Heart className="text-xl text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Уже есть аккаунт</h3>
              <p className="text-muted-foreground text-sm">Войдите в свой профиль</p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full rounded-xl h-12 font-medium border-primary/20 hover:bg-primary/10">
              Войти
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
