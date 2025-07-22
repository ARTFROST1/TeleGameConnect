import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';

interface GameContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  partner: User | null;
  setPartner: (partner: User | null) => void;
  currentGameRoom: number | null;
  setCurrentGameRoom: (roomId: number | null) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null> (null);
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

  // Load partner when user changes
  useEffect(() => {
    const loadPartner = async () => {
      if (currentUser?.partnerId) {
        try {
          const response = await fetch(`/api/users/${currentUser.partnerId}`);
          if (response.ok) {
            const partnerData = await response.json();
            setPartner(partnerData);
          }
        } catch (error) {
          console.error('Failed to load partner:', error);
        }
      } else {
        setPartner(null);
      }
    };

    loadPartner();
  }, [currentUser?.partnerId]);

  return (
    <GameContext.Provider value={{
      currentUser,
      setCurrentUser,
      partner,
      setPartner,
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
