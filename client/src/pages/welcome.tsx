import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div 
          animate={{ 
            boxShadow: [
              "0 0 5px hsl(271, 81%, 56%), 0 0 10px hsl(271, 81%, 56%)",
              "0 0 10px hsl(271, 81%, 56%), 0 0 20px hsl(271, 81%, 56%), 0 0 30px hsl(271, 81%, 56%)",
              "0 0 5px hsl(271, 81%, 56%), 0 0 10px hsl(271, 81%, 56%)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-accent-purple to-accent-pink rounded-full flex items-center justify-center"
        >
          <Heart className="text-3xl text-white" fill="white" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
          Couple Games
        </h1>
        <p className="text-zinc-400 text-lg">Играйте и общайтесь вместе</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="gradient-border">
          <div className="gradient-border-content p-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <i className="fas fa-user-plus mr-2 text-accent-purple"></i>
              Новый игрок
            </h3>
            <p className="text-zinc-400 text-sm mb-4">Создайте профиль и начните играть</p>
            <Link href="/create-profile">
              <Button className="w-full bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:scale-105 transition-transform">
                Создать профиль
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="gradient-border">
          <div className="gradient-border-content p-6">
            <h3 className="font-semibold mb-2 flex items-center">
              <i className="fas fa-sign-in-alt mr-2 text-accent-pink"></i>
              Уже есть аккаунт
            </h3>
            <p className="text-zinc-400 text-sm mb-4">Войдите в свой профиль</p>
            <Link href="/login">
              <Button variant="outline" className="w-full border-accent-purple text-accent-purple hover:bg-accent-purple hover:text-white">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
