import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';

interface GameContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  partner: User | null;
  setPartner: (partner: User | null) => void;
  pendingPartnerInvitation: {user: User, invitationId: number, type: 'sent' | 'received'} | null;
  setPendingPartnerInvitation: (invitation: {user: User, invitationId: number, type: 'sent' | 'received'} | null) => void;
  currentGameRoom: number | null;
  setCurrentGameRoom: (roomId: number | null) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [pendingPartnerInvitation, setPendingPartnerInvitation] = useState<{user: User, invitationId: number, type: 'sent' | 'received'} | null>(null);
  const [currentGameRoom, setCurrentGameRoom] = useState<number | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Load partner and pending invitations when user changes
  useEffect(() => {
    const loadPartnerAndInvitations = async () => {
      if (currentUser?.partnerId) {
        try {
          const response = await fetch(`/api/users/${currentUser.partnerId}`);
          if (response.ok) {
            const partnerData = await response.json();
            setPartner(partnerData);
            setPendingPartnerInvitation(null);
          }
        } catch (error) {
          console.error('Failed to load partner:', error);
        }
      } else {
        setPartner(null);
        
        // Check for pending invitations if no partner
        if (currentUser?.id) {
          try {
            const [sentResponse, receivedResponse] = await Promise.all([
              fetch(`/api/partner-invitations/sent/${currentUser.id}`),
              fetch(`/api/partner-invitations/${currentUser.id}`)
            ]);

            if (sentResponse.ok) {
              const sentInvitations = await sentResponse.json();
              if (sentInvitations.length > 0) {
                // Show the first pending sent invitation
                const invitation = sentInvitations[0];
                const userResponse = await fetch(`/api/users/${invitation.toUserId}`);
                if (userResponse.ok) {
                  const user = await userResponse.json();
                  setPendingPartnerInvitation({
                    user,
                    invitationId: invitation.id,
                    type: 'sent'
                  });
                  return;
                }
              }
            }

            if (receivedResponse.ok) {
              const receivedInvitations = await receivedResponse.json();
              if (receivedInvitations.length > 0) {
                // Show the first received invitation
                const invitation = receivedInvitations[0];
                const userResponse = await fetch(`/api/users/${invitation.fromUserId}`);
                if (userResponse.ok) {
                  const user = await userResponse.json();
                  setPendingPartnerInvitation({
                    user,
                    invitationId: invitation.id,
                    type: 'received'
                  });
                  return;
                }
              }
            }

            // No pending invitations
            setPendingPartnerInvitation(null);
          } catch (error) {
            console.error('Failed to load invitations:', error);
          }
        }
      }
    };

    loadPartnerAndInvitations();
  }, [currentUser?.partnerId, currentUser?.id]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join_room',
        roomId: 1, // Global notification room
        userId: currentUser.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification' && data.notification) {
          const notification = data.notification;
          
          // Handle different notification types
          switch (notification.type) {
            case 'partner_invitation_received':
              if (notification.fromUser) {
                setPendingPartnerInvitation({
                  user: notification.fromUser,
                  invitationId: notification.invitationId!,
                  type: 'received'
                });
              }
              break;
              
            case 'partner_update':
              if (notification.partner) {
                setPartner(notification.partner);
                setPendingPartnerInvitation(null);
                // Update current user with partner
                setCurrentUser(prev => prev ? { ...prev, partnerId: notification.partner!.id } : null);
              }
              break;
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentUser?.id]);

  return (
    <GameContext.Provider value={{
      currentUser,
      setCurrentUser,
      partner,
      setPartner,
      pendingPartnerInvitation,
      setPendingPartnerInvitation,
      currentGameRoom,
      setCurrentGameRoom
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
