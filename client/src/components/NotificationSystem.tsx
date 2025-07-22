import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Users, Gamepad2 } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

const avatarGradients = [
  "from-purple-400 via-pink-400 to-red-400",
  "from-blue-400 via-purple-400 to-indigo-400", 
  "from-green-400 via-blue-400 to-purple-400",
  "from-yellow-400 via-pink-400 to-red-400",
  "from-indigo-400 via-purple-400 to-pink-400",
  "from-red-400 via-pink-400 to-orange-400"
];

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser, setPartner, setCurrentGameRoom } = useGame();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // WebSocket connection for real-time notifications
  const { sendMessage } = useWebSocket({
    userId: currentUser?.id,
    onMessage: (message) => {
      if (message.type === 'notification') {
        const notification = message.notification as Notification;
        setNotifications(prev => {
          // Prevent duplicate notifications
          if (prev.some(n => n.id === notification.id)) return prev;
          return [notification, ...prev].slice(0, 10); // Keep only last 10
        });
        
        // Show toast for new notifications
        toast({
          title: getNotificationTitle(notification),
          description: getNotificationDescription(notification),
        });
      }
    }
  });

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentUser) return;
      
      try {
        // Load partner invitations
        const partnerInvResponse = await fetch(`/api/partner-invitations/${currentUser.id}`);
        if (partnerInvResponse.ok) {
          const partnerInvitations = await partnerInvResponse.json();
          const partnerNotifications: Notification[] = partnerInvitations.map((inv: any) => ({
            id: `partner_inv_${inv.id}`,
            type: 'partner_invitation' as const,
            fromUser: inv.fromUser,
            invitationId: inv.id,
            createdAt: new Date(inv.createdAt)
          }));
          
          setNotifications(prev => [...partnerNotifications, ...prev]);
        }
        
        // Load game invitations
        const gameInvResponse = await fetch(`/api/game-invitations/${currentUser.id}`);
        if (gameInvResponse.ok) {
          const gameInvitations = await gameInvResponse.json();
          const gameNotifications: Notification[] = gameInvitations.map((inv: any) => ({
            id: `game_inv_${inv.id}`,
            type: 'game_invitation' as const,
            fromUser: inv.fromUser,
            gameType: inv.gameType,
            invitationId: inv.id,
            createdAt: new Date(inv.createdAt)
          }));
          
          setNotifications(prev => [...prev, ...gameNotifications]);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, [currentUser]);

  const getNotificationTitle = (notification: Notification) => {
    switch (notification.type) {
      case 'partner_invitation':
        return 'Приглашение в партнёры';
      case 'game_invitation':
        return `Приглашение в игру`;
      case 'partner_accepted':
        return 'Партнёр принят!';
      case 'game_accepted':
        return 'Игра принята!';
      case 'partner_declined':
        return 'Приглашение отклонено';
      case 'game_declined':
        return 'Игра отклонена';
      default:
        return 'Уведомление';
    }
  };

  const getNotificationDescription = (notification: Notification) => {
    switch (notification.type) {
      case 'partner_invitation':
        return `${notification.fromUser.username} хочет стать партнёром`;
      case 'game_invitation':
        const gameNames = { 'truth_or_dare': 'Правда или Действие', 'sync': 'Синхронизация' };
        return `${notification.fromUser.username} приглашает в игру "${gameNames[notification.gameType as keyof typeof gameNames] || notification.gameType}"`;
      case 'partner_accepted':
        return `${notification.fromUser.username} принял ваше приглашение в партнёры`;
      case 'game_accepted':
        return `${notification.fromUser.username} принял приглашение в игру`;
      case 'partner_declined':
        return `${notification.fromUser.username} отклонил приглашение в партнёры`;
      case 'game_declined':
        return `${notification.fromUser.username} отклонил игровое приглашение`;
      default:
        return notification.fromUser.username;
    }
  };

  const handlePartnerInvitationResponse = async (notification: Notification, accept: boolean) => {
    try {
      const response = await fetch(`/api/partner-invitations/${notification.invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: accept ? 'accept' : 'decline' }),
      });

      if (response.ok) {
        // Remove notification
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        if (accept) {
          // Reload partner data
          window.location.reload();
        }
        
        toast({
          title: accept ? "Партнёр принят!" : "Приглашение отклонено",
          description: accept ? "Теперь вы можете играть вместе" : "",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось ответить на приглашение",
        variant: "destructive",
      });
    }
  };

  const handleGameInvitationResponse = async (notification: Notification, accept: boolean) => {
    try {
      const response = await fetch(`/api/game-invitations/${notification.invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: accept ? 'accept' : 'decline' }),
      });

      if (response.ok) {
        // Remove notification
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        if (accept) {
          const data = await response.json();
          if (data.roomId) {
            setCurrentGameRoom(data.roomId);
            // Navigate to the appropriate game
            const gameRoute = notification.gameType === 'truth_or_dare' ? '/truth-or-dare' : '/sync-game';
            navigate(gameRoute);
          }
        }
        
        toast({
          title: accept ? "Игра начинается!" : "Приглашение отклонено",
          description: accept ? "Переходим в игровую комнату" : "",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось ответить на приглашение",
        variant: "destructive",
      });
    }
  };

  const pendingNotifications = notifications.filter(n => 
    n.type === 'partner_invitation' || n.type === 'game_invitation'
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative rounded-full hover:bg-primary/10"
      >
        <Bell className="h-5 w-5" />
        {pendingNotifications.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {pendingNotifications.length}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 z-50"
          >
            <Card className="glass-card shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Уведомления</h3>
                  <Badge variant="secondary">{pendingNotifications.length}</Badge>
                </div>
                
                {pendingNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Нет новых уведомлений</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 rounded-lg bg-gradient-primary/10 border border-primary/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full bg-gradient-to-r ${avatarGradients[parseInt(notification.fromUser.avatar) || 0]} flex-shrink-0`}>
                            {notification.type === 'partner_invitation' ? (
                              <Users className="h-4 w-4 text-white" />
                            ) : (
                              <Gamepad2 className="h-4 w-4 text-white" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-sm">{getNotificationTitle(notification)}</p>
                            <p className="text-xs text-muted-foreground">{getNotificationDescription(notification)}</p>
                            
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (notification.type === 'partner_invitation') {
                                    handlePartnerInvitationResponse(notification, true);
                                  } else if (notification.type === 'game_invitation') {
                                    handleGameInvitationResponse(notification, true);
                                  }
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Принять
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (notification.type === 'partner_invitation') {
                                    handlePartnerInvitationResponse(notification, false);
                                  } else if (notification.type === 'game_invitation') {
                                    handleGameInvitationResponse(notification, false);
                                  }
                                }}
                                className="h-7 px-2 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Отклонить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}