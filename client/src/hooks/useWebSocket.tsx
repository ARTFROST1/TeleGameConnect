import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketProps {
  userId?: number;
  roomId?: number;
  onMessage?: (message: any) => void;
}

export function useWebSocket({ userId, roomId, onMessage }: UseWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      
      // Join room if userId and roomId are provided
      if (userId && roomId) {
        ws.send(JSON.stringify({
          type: 'join',
          userId,
          roomId
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < 5) {
        const delay = Math.pow(2, reconnectAttempts) * 1000;
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [userId, roomId, onMessage, reconnectAttempts]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (userId && roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, roomId, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect
  };
}
