import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addHours, subHours, isWithinInterval } from 'date-fns';
import { urlBase64ToUint8Array } from '../lib/push';

// Use environment variable if available, otherwise use your placeholder
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BCXE6n6giLYrpK1aLCh4BeUchfpyt_8vXcU3MeaaZm0yiUpz_C6dQAlaQBaeyAAInJxdW2kLttoFSiodSIsX9h0';

export function useNotifications() {
  const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'unsupported');

  const subscribeUserToPush = async () => {
    console.log('Attempting to subscribe to push...');
    
    if (!('Notification' in window)) {
      alert("Votre navigateur ne supporte pas les notifications.");
      return;
    }

    if (Notification.permission === 'denied') {
      alert("Les notifications sont bloquées par votre navigateur. Veuillez les activer dans les paramètres du site (cliquez sur le cadenas à côté de l'URL).");
      return;
    }

    try {
      console.log('Requesting permission...');
      const status = await Notification.requestPermission();
      console.log('Permission status:', status);
      setPermission(status);

      if (status !== 'granted') {
        alert("Permission refusée ou ignorée.");
        return;
      }

      if (!('serviceWorker' in navigator)) {
        alert("Les Service Workers ne sont pas supportés ou vous n'êtes pas dans un contexte sécurisé (HTTPS).");
        return;
      }

      console.log('Waiting for SW ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('SW ready!');

      if (!registration.pushManager) {
        alert("Push Manager non disponible sur ce navigateur.");
        return;
      }

      console.log('Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('Subscription successful:', subscription);

      // Save/Update subscription to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Saving subscription for user:', user.id);
        const subJson = subscription.toJSON();
        
        const { error } = await supabase
          .from('push_subscriptions')
          .insert([{
            user_id: user.id,
            subscription: subJson
          }]);
          
        if (error) {
          console.error('Database error:', error);
          alert("Erreur lors de l'enregistrement en base de données : " + error.message);
        } else {
          alert("Notifications activées avec succès !");
          console.log('Subscription saved to Supabase');
        }
      } else {
        alert("Vous devez être connecté pour activer les notifications push.");
      }

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      alert("Erreur lors de l'activation : " + error.message);
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
