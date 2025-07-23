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

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // In development, connect directly to the Express server port
      const isDev = import.meta.env.DEV;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = isDev ? window.location.hostname + ':5000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log('Creating WebSocket connection to:', wsUrl, 'for user:', currentUser.id);
      
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
              // Remove toast notification to reduce distractions in game
              break;
            case 'turn_changed':
              // Dispatch custom event for Truth or Dare game
              window.dispatchEvent(new CustomEvent('truth-or-dare-message', { detail: message }));
              break;
            case 'question_assigned':
              // Dispatch custom event for Truth or Dare game
              window.dispatchEvent(new CustomEvent('truth-or-dare-message', { detail: message }));
              break;
            case 'player_left_game':
              // Dispatch custom event for player leaving game
              window.dispatchEvent(new CustomEvent('truth-or-dare-message', { detail: message }));
              break;
            case 'partner_answered':
              // Remove toast notification to reduce distractions in game
              break;
            case 'sync_result':
              // Handle sync game results
              break;
            case 'game_started':
              // Handle game start signal - navigate to game room
              console.log('Game starting:', message);
              if (message.roomId) {
                if (message.gameType === 'truth_or_dare') {
                  window.location.href = `/truth-or-dare/${message.roomId}`;
                } else {
                  window.location.href = `/game/${message.roomId}`;
                }
              }
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionId(null);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (currentUser) {
            console.log('Attempting to reconnect...');
            connect();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('Failed to connect to:', wsUrl);
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
        break;
        
      case 'game_accepted':
        if (onGameAccepted) {
          onGameAccepted(notification);
        }
        break;
        
      case 'game_declined':
        // Silent handling, no toast
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
      console.log('useEffect: connecting for user', currentUser.id);
      connect();
    }

    return () => {
      // Clean up on unmount
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [currentUser?.id, connect]);

  return {
    isConnected,
    sendMessage
  };
}