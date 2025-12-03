import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface SessionTimeoutDialogProps {
  open: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutDialog = ({
  open,
  secondsRemaining,
  onExtend,
  onLogout,
}: SessionTimeoutDialogProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <span className="block">
                Your session is about to expire due to inactivity.
              </span>
              <span className="block text-lg font-semibold text-foreground">
                Time remaining: {formatTime(secondsRemaining)}
              </span>
              <span className="block text-sm">
                Click "Stay Logged In" to continue your session, or you'll be automatically logged out.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Log Out Now</AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
