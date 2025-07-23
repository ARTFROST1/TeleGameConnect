import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { User as UserType, Notification } from '@shared/schema';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketProps {
  roomId?: number;
  sendMessage?: (message: any) => void;
  onPartnerInvitationReceived?: (notification: Notification) => void;
  onPartnerUpdate?: (partner: UserType) => void;
  onGameInvitation?: (notification: Notification) => void;
  onGameAccepted?: (notification: Notification) => void;
}

export function useWebSocket({
  roomId,
  onPartnerInvitationReceived,
  onPartnerUpdate,
  onGameInvitation,
  onGameAccepted
}: UseWebSocketProps = {}): { isConnected: boolean; sendMessage: (message: any) => void } {
  const { currentUser } = useGame();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!currentUser) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Join room or user session
        if (roomId) {
          wsRef.current?.send(JSON.stringify({
            type: 'join',
            userId: currentUser.id,
            roomId: roomId
          }));
        } else {
          // Join user session for notifications
          wsRef.current?.send(JSON.stringify({
            type: 'join_user_session',
            userId: currentUser.id
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          switch (message.type) {
            case 'notification':
              handleNotification(message.notification);
              break;
            case 'game_start':
              toast({
                title: "Игра началась!",
                description: "Оба игрока подключены. Удачи!",
              });
              break;
            case 'turn_changed':
              // Handle turn changes in game
              break;
            case 'partner_answered':
              toast({
                title: "Партнёр ответил",
                description: "Ваш партнёр дал ответ на вопрос",
              });
              break;
            case 'sync_result':
              // Handle sync game results
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionId(null);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (currentUser) {
            connect();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [currentUser, roomId, toast]);

  const handleNotification = useCallback((notification: Notification) => {
    console.log('Processing notification:', notification);
    
    switch (notification.type) {
      case 'partner_invitation_received':
        if (onPartnerInvitationReceived) {
          onPartnerInvitationReceived(notification);
        }
        toast({
          title: "Новое приглашение!",
          description: `${notification.fromUser?.username} приглашает вас стать партнёрами`,
        });
        break;
        
      case 'partner_update':
        if (onPartnerUpdate && notification.partner) {
          onPartnerUpdate(notification.partner);
        }
        toast({
          title: "Партнёр найден!",
          description: `Теперь вы партнёры с ${notification.partner?.username}`,
        });
        break;
        
      case 'partner_declined':
        toast({
          title: "Приглашение отклонено",
          description: `${notification.fromUser?.username} отклонил ваше приглашение`,
          variant: "destructive",
        });
        break;
        
      case 'game_invitation':
        if (onGameInvitation) {
          onGameInvitation(notification);
        }
        toast({
          title: "Приглашение в игру!",
          description: `${notification.fromUser?.username} приглашает вас в ${notification.gameType === 'truth_or_dare' ? 'Правда или Действие' : 'Синхронизация'}`,
        });
        break;
        
      case 'game_accepted':
        if (onGameAccepted) {
          onGameAccepted(notification);
        }
        toast({
          title: "Игра принята!",
          description: `${notification.fromUser?.username} принял ваше приглашение в игру`,
        });
        break;
        
      case 'game_declined':
        toast({
          title: "Игра отклонена",
          description: `${notification.fromUser?.username} отклонил ваше приглашение в игру`,
          variant: "destructive",
        });
        break;
    }
  }, [onPartnerInvitationReceived, onPartnerUpdate, onGameInvitation, onGameAccepted, toast]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionId(null);
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (currentUser) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [currentUser, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    disconnect,
    connectionId
  };
}