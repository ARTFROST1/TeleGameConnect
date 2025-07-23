import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Star, Heart, Flame, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { User as UserType } from "@shared/schema";

const avatarIcons = [User, Star, Heart, Flame];

interface PartnerInvitationDialogProps {
  isOpen: boolean;
  fromUser: UserType;
  invitationId: number;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function PartnerInvitationDialog({
  isOpen,
  fromUser,
  invitationId,
  onAccept,
  onDecline,
  isLoading = false
}: PartnerInvitationDialogProps) {
  const AvatarIcon = avatarIcons[parseInt(fromUser.avatar) % avatarIcons.length];
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Приглашение в партнёры
          </DialogTitle>
          <DialogDescription className="text-center">
            У вас новое приглашение в партнёры!
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
              className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
            >
              ✨
            </motion.div>
          </motion.div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{fromUser.username}</h3>
            <p className="text-sm text-muted-foreground">
              {fromUser.firstName && fromUser.lastName 
                ? `${fromUser.firstName} ${fromUser.lastName}` 
                : fromUser.firstName || 'Пользователь'}
            </p>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>🎮 {fromUser.gamesPlayed} игр</span>
              <span>🎯 {fromUser.syncScore}% синхр.</span>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Хотите стать партнёрами и играть вместе?
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
            <Check className="w-4 h-4 mr-2" />
            Принять
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}