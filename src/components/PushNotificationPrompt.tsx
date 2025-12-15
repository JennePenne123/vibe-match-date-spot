import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

const DISMISSED_KEY = 'push_notification_prompt_dismissed';
const PROMPT_DELAY = 5000; // Show after 5 seconds

export const PushNotificationPrompt: React.FC = () => {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe, isLoading } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Don't show if not supported, already subscribed, or already granted/denied
    if (!isSupported || isSubscribed || permission === 'denied') {
      return;
    }

    // Show after delay if user is logged in
    if (user && permission === 'default') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, PROMPT_DELAY);

      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!isVisible || isDismissed || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-premium-lg">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-romantic flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1">
              Never miss a date invite! 💌
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get notified instantly when someone sends you a date invitation or accepts yours.
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isLoading}
                className="bg-gradient-romantic hover:opacity-90 text-white"
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
