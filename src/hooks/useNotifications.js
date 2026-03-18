import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { addHours, subHours, isWithinInterval } from 'date-fns';
import { urlBase64ToUint8Array } from '../lib/push';

// NOTE: You'll need to generate your own VAPID keys.
// For now, this is a placeholder. 
const VAPID_PUBLIC_KEY = 'BNgF2V-1-Nz6nof22uC0IsCCxLxTxKEb3e7XmF8DrLaf1kxnNivWOhCMy_N31eQMgC6Uf4ddO4-fzb2IBDBztck';

export function useNotifications() {
  const subscribeUserToPush = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) return;

      // Subscribe new user
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .insert([{
            user_id: user.id,
            subscription: subscription.toJSON()
          }]);
      }

      console.log('User is subscribed to Push Notifications');
    } catch (error) {
      console.error('Failed to subscribe to push', error);
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          subscribeUserToPush();
        }
      });
    } else if (Notification.permission === 'granted') {
      subscribeUserToPush();
    }

    const checkAssignments = async () => {
      // (Keep existing local check for when app is open)
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const inOneHour = addHours(now, 1);
      const oneHourAgo = subHours(now, 1);

      const { data } = await supabase
        .from('assignments')
        .select('title, due_date')
        .eq('completed', false);

      if (data) {
        data.forEach(asgn => {
          const dueDate = new Date(asgn.due_date);
          if (isWithinInterval(dueDate, { start: oneHourAgo, end: inOneHour })) {
            new Notification("Rendu imminent !", {
              body: `Le devoir "${asgn.title}" est à rendre bientôt.`,
              icon: '/pwa-192x192.png'
            });
          }
        });
      }
    };

    const interval = setInterval(checkAssignments, 15 * 60 * 1000);
    checkAssignments();

    return () => clearInterval(interval);
  }, []);
}
