import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// VAPID public key - will be loaded from environment/secrets
const VAPID_PUBLIC_KEY = ''; // To be configured

interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'unsupported';
  isLoading: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'unsupported',
    isLoading: true,
  });

  // Check browser support
  const checkSupport = useCallback(() => {
    const supported = 'serviceWorker' in navigator && 
                      'PushManager' in window && 
                      'Notification' in window;
    return supported;
  }, []);

  // Initialize state
  useEffect(() => {
    const init = async () => {
      const isSupported = checkSupport();
      
      if (!isSupported) {
        setState({
          isSupported: false,
          isSubscribed: false,
          permission: 'unsupported',
          isLoading: false,
        });
        return;
      }

      // Check current permission
      const permission = Notification.permission;

      // Check if already subscribed
      let isSubscribed = false;
      if (user && permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          isSubscribed = !!subscription;
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }

      setState({
        isSupported,
        isSubscribed,
        permission,
        isLoading: false,
      });
    };

    init();
  }, [user, checkSupport]);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    setState(prev => ({ ...prev, permission }));
    return permission;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to enable notifications',
        variant: 'destructive',
      });
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID public key not configured - push notifications disabled');
      toast({
        title: 'Push notifications not available',
        description: 'Push notifications are not yet configured',
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
        });
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Extract subscription data
      const subscriptionJSON = subscription.toJSON();
      const endpoint = subscriptionJSON.endpoint || '';
      const authKey = subscriptionJSON.keys?.auth || '';
      const p256dhKey = subscriptionJSON.keys?.p256dh || '';

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint,
        auth_key: authKey,
        p256dh_key: p256dhKey,
        user_agent: navigator.userAgent,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint',
      });

      if (error) {
        throw error;
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: true, 
        isLoading: false,
        permission: 'granted',
      }));

      toast({
        title: 'Notifications enabled! 🔔',
        description: "You'll be notified when you receive date invitations",
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast({
        title: 'Failed to enable notifications',
        description: 'Please try again later',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user, requestPermission, registerServiceWorker, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setState(prev => ({ 
        ...prev, 
        isSubscribed: false, 
        isLoading: false,
      }));

      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications',
      });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user, toast]);

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (state.isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [state.isSubscribed, subscribe, unsubscribe]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    toggleSubscription,
    requestPermission,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
