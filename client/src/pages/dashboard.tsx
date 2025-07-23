import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, Heart, Flame, Settings, Plus, Users, MessageCircleQuestion, RotateCcw, ChevronRight, BarChart, Trophy, Clock, Zap, History, Wifi, WifiOff } from "lucide-react";
import { Link } from "wouter";
import { useGame } from "@/contexts/GameContext";
import { NotificationSystem } from "@/components/NotificationSystem";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { PartnerInvitationDialog } from "@/components/PartnerInvitationDialog";
import { GameInvitationDialog } from "@/components/GameInvitationDialog";
import { User as UserType, Notification } from "@shared/schema";
import { useLocation } from "wouter";

const avatarIcons = [User, Star, Heart, Flame];
const avatarGradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500", 
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500"
];

export default function Dashboard() {
  const { currentUser, partner, pendingPartnerInvitation, setPendingPartnerInvitation, setCurrentUser, setPartner } = useGame();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentInvitation, setCurrentInvitation] = useState<{fromUser: UserType, invitationId: number} | null>(null);
  const [isRespondingToInvitation, setIsRespondingToInvitation] = useState(false);
  const [gameInvitation, setGameInvitation] = useState<{fromUser: UserType, gameType: 'truth_or_dare' | 'sync', invitationId: number} | null>(null);
  const [isRespondingToGameInvitation, setIsRespondingToGameInvitation] = useState(false);

  // WebSocket connection for real-time notifications
  const { isConnected } = useWebSocket({
    onPartnerInvitationReceived: (notification: Notification) => {
      if (notification.fromUser && notification.invitationId) {
        setCurrentInvitation({
          fromUser: notification.fromUser as UserType,
          invitationId: notification.invitationId
        });
      }
    },
    onPartnerUpdate: (partner: UserType) => {
      setPartner(partner);
      setCurrentUser((prev: UserType | null) => prev ? { ...prev, partnerId: partner.id } : null);
      setCurrentInvitation(null);
    },
    onGameInvitation: (notification: Notification) => {
      if (notification.fromUser && notification.gameType && notification.invitationId) {
        setGameInvitation({
          fromUser: notification.fromUser as UserType,
          gameType: notification.gameType as 'truth_or_dare' | 'sync',
          invitationId: notification.invitationId
        });
      }
    },
    onGameAccepted: (notification: Notification) => {
      toast({
        title: "Игра принята!",
        description: `${notification.fromUser?.username} принял ваше приглашение`,
      });
      // Navigate to game room
      if (notification.roomId) {
        navigate(`/game/${notification.roomId}`);
      }
    }
  });

  const sendGameInvitation = async (gameType: 'truth_or_dare' | 'sync') => {
    if (!currentUser || !partner) {
      toast({
        title: "Ошибка",
        description: "Нужен партнёр для игры",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/game-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: partner.id,
          gameType,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        })
      });

      if (response.ok) {
        toast({
          title: "Приглашение отправлено!",
          description: `${partner.username} получит приглашение в игру`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось отправить приглашение",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive"
      });
    }
  };

  const handlePartnerInvitationResponse = async (action: 'accept' | 'decline') => {
    if (!currentInvitation) return;
    
    setIsRespondingToInvitation(true);
    try {
      const response = await fetch(`/api/partner-invitations/${currentInvitation.invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        if (action === 'accept') {
          toast({
            title: "Приглашение принято!",
            description: "Теперь вы партнёры и можете играть вместе",
          });
        } else {
          toast({
            title: "Приглашение отклонено",
            description: "Приглашение было отклонено",
          });
        }
        
        setCurrentInvitation(null);
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось ответить на приглашение",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive"
      });
    } finally {
      setIsRespondingToInvitation(false);
    }
  };

  const handleGameInvitationResponse = async (action: 'accept' | 'decline') => {
    if (!gameInvitation) return;
    
    setIsRespondingToGameInvitation(true);
    try {
      const response = await fetch(`/api/game-invitations/${gameInvitation.invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (action === 'accept' && result.roomId) {
          toast({
            title: "Игра начинается!",
            description: "Переходим в игровую комнату...",
          });
          // Navigate to game room
          navigate(`/game/${result.roomId}`);
        } else {
          toast({
            title: action === 'accept' ? "Игра принята!" : "Игра отклонена",
            description: action === 'accept' ? "Игра скоро начнётся" : "Приглашение было отклонено",
          });
        }
        
        setGameInvitation(null);
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось ответить на приглашение",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением к серверу",
        variant: "destructive"
      });
    } finally {
      setIsRespondingToGameInvitation(false);
    }
  };

  // Refresh user data to get updated stats
  const { data: updatedUser } = useQuery({
    queryKey: ["/api/users", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const user = updatedUser || currentUser;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Пользователь не найден</p>
            <Link href="/">
              <Button className="mt-4">На главную</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const UserIcon = avatarIcons[parseInt((user as any)?.avatar || '0') || 0];
  const PartnerIcon = partner ? avatarIcons[parseInt(partner.avatar) || 0] : null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt((user as any)?.avatar || '0') || 0]}`}
            >
              <UserIcon className="h-6 w-6 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-gradient">
                {(user as any)?.username}
              </h1>
              <p className="text-muted-foreground">ID: #{(user as any)?.id}</p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <NotificationSystem />
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full text-[#f9c8e9]">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full text-[#f9c8e9] bg-[#2a2c3700]">
              <Settings className="h-5 w-5 text-[#f9c8e9]" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Partner Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gradient">
                  <Users className="h-5 w-5" />
                  Партнёр
                </CardTitle>
                <Link href="/find-partner">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {partner ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-primary/10 border border-primary/20"
                >
                  <div className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(partner.avatar) || 0]} floating-animation`}>
                    {PartnerIcon && <PartnerIcon className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{partner.username}</p>
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full pulse-animation"></div>
                      Онлайн
                    </p>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="hover:bg-primary/10">
                      <User className="h-4 w-4 mr-2" />
                      Профиль
                    </Button>
                  </Link>
                </motion.div>
              ) : pendingPartnerInvitation ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/30"
                >
                  {pendingPartnerInvitation.type === 'sent' ? (
                    // Sent invitation - show waiting status
                    <div className="flex items-center gap-4">
                      <motion.div 
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(pendingPartnerInvitation.user.avatar) || 0]} opacity-75`}
                      >
                        {React.createElement(avatarIcons[parseInt(pendingPartnerInvitation.user.avatar) || 0], { 
                          className: "h-5 w-5 text-white" 
                        })}
                      </motion.div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{pendingPartnerInvitation.user.username}</p>
                        <p className="text-sm text-yellow-400 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Ожидает подтверждения
                        </p>
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-yellow-400"
                      >
                        <Clock className="h-6 w-6" />
                      </motion.div>
                    </div>
                  ) : (
                    // Received invitation - show accept/decline buttons
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className={`p-3 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(pendingPartnerInvitation.user.avatar) || 0]}`}
                        >
                          {React.createElement(avatarIcons[parseInt(pendingPartnerInvitation.user.avatar) || 0], { 
                            className: "h-5 w-5 text-white" 
                          })}
                        </motion.div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{pendingPartnerInvitation.user.username}</p>
                          <p className="text-sm text-blue-400 flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Хочет стать вашим партнёром
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/partner-invitations/${pendingPartnerInvitation.invitationId}/respond`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'accept' })
                              });
                              if (response.ok) {
                                setPendingPartnerInvitation(null);
                                toast({
                                  title: "Приглашение принято!",
                                  description: "Теперь вы партнёры и можете играть вместе",
                                });
                              }
                            } catch (error) {
                              console.error('Error accepting invitation:', error);
                            }
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Принять
                        </Button>
                        <Button 
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/partner-invitations/${pendingPartnerInvitation.invitationId}/respond`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'decline' })
                              });
                              if (response.ok) {
                                setPendingPartnerInvitation(null);
                                toast({
                                  title: "Приглашение отклонено",
                                  description: "Приглашение было отклонено",
                                });
                              }
                            } catch (error) {
                              console.error('Error declining invitation:', error);
                            }
                          }}
                          variant="outline" 
                          className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                        >
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className="p-6 rounded-full bg-gradient-primary/10 w-fit mx-auto mb-6">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Найдите партнера</h3>
                  <span className="text-gray-300 mb-6 block">Добавьте партнёра для совместных игр</span>
                  <Link href="/find-partner">
                    <Button className="modern-button">
                      <Plus className="h-4 w-4 mr-2" />
                      Найти партнера
                    </Button>
                  </Link>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Games Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gradient">
                <MessageCircleQuestion className="h-5 w-5" />
                Игры
              </CardTitle>
              <CardDescription className="text-gray-300">Выберите игру для начала</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => partner ? sendGameInvitation('truth_or_dare') : toast({ title: "Нужен партнёр", description: "Найдите партнёра для игры", variant: "destructive" })}
                  className="glass-card p-6 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4">
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="p-4 rounded-2xl bg-gradient-primary glow-effect"
                    >
                      <Zap className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl mb-2 text-gradient">Правда или Действие</h4>
                      <p className="text-sm text-gray-300">
                        {partner ? "Пригласить партнёра в игру" : "Найдите партнёра для игры"}
                      </p>
                    </div>
                    {partner ? (
                      <div className="flex items-center text-primary">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Пригласить</span>
                      </div>
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400 opacity-50" />
                    )}
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => partner ? sendGameInvitation('sync') : toast({ title: "Нужен партнёр", description: "Найдите партнёра для игры", variant: "destructive" })}
                  className="glass-card p-6 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4">
                    <motion.div 
                      whileHover={{ rotate: -15, scale: 1.1 }}
                      className="p-4 rounded-2xl bg-gradient-secondary glow-effect"
                    >
                      <Heart className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl mb-2 text-gradient">Синхронизация</h4>
                      <p className="text-sm text-gray-300">
                        {partner ? "Пригласить партнёра в игру" : "Найдите партнёра для игры"}
                      </p>
                    </div>
                    {partner ? (
                      <div className="flex items-center text-primary">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Пригласить</span>
                      </div>
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400 opacity-50" />
                    )}
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Access */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-gradient">Быстрый доступ</CardTitle>
              <CardDescription className="text-gray-300">Управляйте своим профилем и просматривайте статистику</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/profile" className="block">
                  <div className="glass-card hover:glow-effect p-4 rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium text-[#ffffff]">Профиль</div>
                        <div className="text-xs text-gray-400">Статистика и история</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/game-history" className="block">
                  <div className="glass-card hover:glow-effect p-4 rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">История игр</div>
                        <div className="text-xs text-gray-400">Прошлые игры</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/statistics" className="block">
                  <div className="glass-card hover:glow-effect p-4 rounded-lg transition-all duration-300 hover:scale-102 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <BarChart className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium">Статистика</div>
                        <div className="text-xs text-gray-400">Подробные данные</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection Status */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-4 left-4 z-50"
        >
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4" />
                Онлайн
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                Оффлайн
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Partner Invitation Dialog */}
      {currentInvitation && (
        <PartnerInvitationDialog
          isOpen={true}
          fromUser={currentInvitation.fromUser}
          invitationId={currentInvitation.invitationId}
          onAccept={() => handlePartnerInvitationResponse('accept')}
          onDecline={() => handlePartnerInvitationResponse('decline')}
          isLoading={isRespondingToInvitation}
        />
      )}

      {/* Game Invitation Dialog */}
      {gameInvitation && (
        <GameInvitationDialog
          isOpen={true}
          fromUser={gameInvitation.fromUser}
          gameType={gameInvitation.gameType}
          invitationId={gameInvitation.invitationId}
          onAccept={() => handleGameInvitationResponse('accept')}
          onDecline={() => handleGameInvitationResponse('decline')}
          isLoading={isRespondingToGameInvitation}
        />
      )}
    </div>
  );
}