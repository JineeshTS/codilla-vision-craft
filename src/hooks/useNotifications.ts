import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/errorTracking";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

const showBrowserNotification = (title: string, message: string, actionUrl?: string | null) => {
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body: message,
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: `notification-${Date.now()}`,
  });

  if (actionUrl) {
    notification.onclick = () => {
      window.focus();
      window.location.href = actionUrl;
      notification.close();
    };
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
  const { toast } = useToast();

  const requestPermission = useCallback(async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPermission(granted ? "granted" : Notification.permission);
    return granted;
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    } else {
      setBrowserPermission("unsupported");
    }

    loadNotifications();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logError(error, { context: 'loadNotifications' });
      return;
    }

    setNotifications(data as Notification[] || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show in-app toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default',
          });

          // Show browser notification
          showBrowserNotification(
            newNotification.title,
            newNotification.message,
            newNotification.action_url
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      logError(error, { context: 'markAsRead', notificationId });
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      logError(error, { context: 'markAllAsRead' });
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      logError(error, { context: 'deleteNotification', notificationId });
      return;
    }

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return {
    notifications,
    unreadCount,
    browserPermission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications,
  };
}
