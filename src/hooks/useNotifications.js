import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addHours, subHours, isWithinInterval } from 'date-fns';
import { urlBase64ToUint8Array } from '../lib/push';

// Use environment variable if available, otherwise use your placeholder
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BCXE6n6giLYrpK1aLCh4BeUchfpyt_8vXcU3MeaaZm0yiUpz_C6dQAlaQBaeyAAInJxdW2kLttoFSiodSIsX9h0';

export function useNotifications() {
  const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'unsupported');

  const subscribeUserToPush = async () => {
    if (!('Notification' in window)) {
      alert("Votre navigateur ne supporte pas les notifications.");
      return;
    }

    if (Notification.permission === 'denied') {
      alert("Les notifications sont bloquées par votre navigateur. Veuillez les activer dans les paramètres du site (cliquez sur le cadenas à côté de l'URL).");
      return;
    }

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status !== 'granted') return;

      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // We always try to subscribe or get existing to make sure it's in our DB
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save/Update subscription to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Use upsert or manual check to avoid duplicates in the logic
        // But for now, we'll just insert and let the server handle it or use a simple insert
        // Better: Check if this subscription already exists for this user
        const subJson = subscription.toJSON();
        
        await supabase
          .from('push_subscriptions')
          .insert([{
            user_id: user.id,
            subscription: subJson
          }]);
          
        console.log('Subscription saved to Supabase');
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      alert("Erreur lors de l'activation des notifications push. Vérifiez que vous êtes sur un site sécurisé (HTTPS).");
      return false;
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification("Test ClassPilot", {
        body: "Ceci est une notification de test locale. Si vous voyez ceci, les notifications locales fonctionnent !",
        icon: '/logo_ClassPilot.png'
      });
    } else {
      alert("Permission non accordée. Cliquez sur 'Push Android' pour activer.");
    }
  };

  const checkAssignments = useCallback(async () => {
    if (Notification.permission !== 'granted') return;

    // Check if user is logged in first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date();
    const inOneHour = addHours(now, 1);
    const oneHourAgo = subHours(now, 1);

    const { data, error } = await supabase
      .from('assignments')
      .select('title, due_date')
      .eq('completed', false);

    if (error) {
      console.error('Error fetching assignments for notifications:', error);
      return;
    }

    if (data) {
      data.forEach(asgn => {
        const dueDate = new Date(asgn.due_date);
        if (isWithinInterval(dueDate, { start: oneHourAgo, end: inOneHour })) {
          new Notification("Rendu imminent !", {
            body: `Le devoir "${asgn.title}" est à rendre bientôt.`,
            icon: '/logo_ClassPilot.png'
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    // Check assignments on load and every 15 minutes
    checkAssignments();
    const interval = setInterval(checkAssignments, 15 * 60 * 1000);

    // Update permission state if it changes externally
    const handlePermissionChange = () => {
      setPermission(Notification.permission);
    };
    
    // Some browsers support the Permissions API
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then(status => {
        status.onchange = handlePermissionChange;
      });
    }

    return () => clearInterval(interval);
  }, [checkAssignments]);

  return { subscribeUserToPush, sendTestNotification, permission };
}
