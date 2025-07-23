import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Star, Heart, Flame, Check, X, GamepadIcon, MessageCircleQuestion, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@shared/schema";

const avatarIcons = [User, Star, Heart, Flame];

interface GameInvitationDialogProps {
  isOpen: boolean;
  fromUser: UserType;
  gameType: 'truth_or_dare' | 'sync';
  invitationId: number;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function GameInvitationDialog({
  isOpen,
  fromUser,
  gameType,
  invitationId,
  onAccept,
  onDecline,
  isLoading = false
}: GameInvitationDialogProps) {
  const AvatarIcon = avatarIcons[parseInt(fromUser.avatar) % avatarIcons.length];
  const gameTitle = gameType === 'truth_or_dare' ? 'Правда или Действие' : 'Синхронизация';
  const GameIcon = gameType === 'truth_or_dare' ? MessageCircleQuestion : RotateCcw;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Приглашение в игру
          </DialogTitle>
          <DialogDescription className="text-center">
            {fromUser.username} приглашает вас в игру!
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg`}>
              <AvatarIcon className="w-10 h-10 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center"
            >
              <GameIcon className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{fromUser.username}</h3>
            <p className="text-sm text-muted-foreground">
              {fromUser.firstName && fromUser.lastName 
                ? `${fromUser.firstName} ${fromUser.lastName}` 
                : fromUser.firstName || 'Пользователь'}
            </p>
          </div>
          
          <div className="text-center p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-primary/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <GameIcon className="h-6 w-6 text-primary" />
              <h4 className="text-lg font-semibold text-primary">{gameTitle}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {gameType === 'truth_or_dare' 
                ? 'Игра на откровенность и смелость'
                : 'Проверьте, насколько вы синхронны'
              }
            </p>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Готовы принять вызов?
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onDecline}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Отклонить
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={onAccept}
            disabled={isLoading}
          >
            <GamepadIcon className="w-4 h-4 mr-2" />
            Играть!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}