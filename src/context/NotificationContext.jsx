import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addHours, startOfDay, endOfDay, format, addDays } from 'date-fns';
import { urlBase64ToUint8Array } from '../lib/push';
import { useUserPreferences } from '../hooks/useData';

const NotificationContext = createContext();

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BCXE6n6giLYrpK1aLCh4BeUchfpyt_8vXcU3MeaaZm0yiUpz_C6dQAlaQBaeyAAInJxdW2kLttoFSiodSIsX9h0';

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'unsupported');
  const [logs, setLogs] = useState([]);
  const { preferences } = useUserPreferences();

  const addLog = useCallback((msg) => {
    const time = format(new Date(), 'HH:mm:ss');
    const newLog = `[${time}] ${msg}`;
    console.log(newLog);
    setLogs(prev => [newLog, ...prev].slice(0, 15)); // Keep last 15 for better history
  }, []);

  const subscribeUserToPush = async () => {
    addLog('Tentative d\'abonnement push...');
    if (!('Notification' in window)) {
      alert("Votre navigateur ne supporte pas les notifications.");
      return;
    }
    if (Notification.permission === 'denied') {
      alert("Les notifications sont bloquées. Veuillez les activer dans les paramètres du site.");
      return;
    }

    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status !== 'granted') return;

      if (!('serviceWorker' in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').insert([{
          user_id: user.id,
          subscription: subscription.toJSON()
        }]);
        addLog("Abonnement push réussi !");
        alert("Notifications activées !");
      }
      return true;
    } catch (error) {
      addLog(`Échec abonnement: ${error.message}`);
      return false;
    }
  };

  const showNotification = useCallback(async (title, options, id) => {
    addLog(`Notification: "${title}"`);
    const notified = JSON.parse(localStorage.getItem('cp_notified') || '[]');
    if (id && notified.includes(id)) {
      addLog(`ID "${id}" déjà notifié.`);
      return;
    }

    if (Notification.permission === 'granted') {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
      const finalOptions = {
        icon: '/logo_ClassPilot.png',
        badge: '/logo_ClassPilot.png',
        vibrate: [200, 100, 200],
        ...options
      };

      try {
        if (registration) {
          await registration.showNotification(title, finalOptions);
        } else {
          new Notification(title, finalOptions);
        }
        if (id) {
          notified.push(id);
          if (notified.length > 50) notified.shift();
          localStorage.setItem('cp_notified', JSON.stringify(notified));
        }
      } catch (err) {
        addLog(`Erreur showNotification: ${err.message}`);
      }
    }
  }, [addLog]);

  const sendImmediateTest = useCallback(() => {
    addLog('Test manuel.');
    showNotification("Test ClassPilot 🚀", {
      body: "Le canal est opérationnel !",
    }, null);
  }, [showNotification, addLog]);

  const checkDailyReminder = useCallback(async () => {
    if (!preferences?.notify_daily || Notification.permission !== 'granted') return;

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    if (localStorage.getItem('cp_last_daily') === todayStr) return;

    const dailyHour = preferences.daily_hour !== undefined 
      ? (preferences.daily_hour < 24 ? preferences.daily_hour * 60 : preferences.daily_hour) 
      : 18 * 60;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (currentMinutes >= dailyHour) {
      addLog(`Rappel Daily: trigger=${dailyHour}m, check 48h...`);
      const todayStart = startOfDay(now).toISOString();
      const limit48h = endOfDay(addDays(now, 2)).toISOString();

      try {
        const { count: cCount } = await supabase.from('courses').select('*', { count: 'exact', head: true }).gte('start_time', todayStart).lte('start_time', limit48h);
        const { count: aCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('completed', false).gte('due_date', todayStart).lte('due_date', limit48h);

        const total = (cCount || 0) + (aCount || 0);
        if (total === 0) {
          addLog('Rien dans les 48h, saut.');
          localStorage.setItem('cp_last_daily', todayStr);
          return;
        }

        const { data: todayCourses } = await supabase.from('courses').select('title').gte('start_time', todayStart).lte('start_time', endOfDay(now).toISOString());
        const { data: todayAssignments } = await supabase.from('assignments').select('title').eq('completed', false).gte('due_date', todayStart).lte('due_date', endOfDay(now).toISOString());
        const { data: tomorrowCourses } = await supabase.from('courses').select('title').gte('start_time', startOfDay(addDays(now, 1)).toISOString()).lte('start_time', endOfDay(addDays(now, 1)).toISOString());

        let body = "";
        if (todayCourses?.length || todayAssignments?.length) {
          const titles = [...(todayCourses?.map(c => c.title) || []), ...(todayAssignments?.map(a => `Rendu: ${a.title}`) || [])];
          body += `Aujourd'hui : ${titles.join(', ')}. `;
        }
        if (tomorrowCourses?.length) body += `Demain: ${tomorrowCourses.length} cours.`;

        showNotification("Programme 🎯", { body }, null);
        localStorage.setItem('cp_last_daily', todayStr);
      } catch (err) {
        addLog(`Erreur Daily: ${err.message}`);
      }
    }
  }, [preferences, showNotification, addLog]);

  const checkUpcomingEvents = useCallback(async () => {
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const in30Min = addHours(now, 0.5);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: courses } = await supabase.from('courses').select('id, title, start_time').gte('start_time', now.toISOString()).lte('start_time', in30Min.toISOString());
      courses?.forEach(c => showNotification("Cours imminent ! 🏫", { body: `"${c.title}" commence bientôt.`, tag: `course_${c.id}` }, `course_${c.id}`));

      const { data: assignments } = await supabase.from('assignments').select('id, title, due_date').eq('completed', false).gte('due_date', now.toISOString()).lte('due_date', in30Min.toISOString());
      assignments?.forEach(a => showNotification("Rendu urgent ! ⏳", { body: `"${a.title}" est à rendre bientôt.`, tag: `asgn_${a.id}` }, `asgn_${a.id}`));
    } catch (err) {
      addLog(`Erreur Upcoming: ${err.message}`);
    }
  }, [showNotification, addLog]);

  useEffect(() => {
    addLog('NotificationProvider monté. Vérification...');
    const runChecks = () => {
      checkUpcomingEvents();
      checkDailyReminder();
    };
    runChecks();
    const interval = setInterval(runChecks, 5 * 60 * 1000);

    const handlePermissionChange = () => setPermission(Notification.permission);
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then(status => { status.onchange = handlePermissionChange; });
    }
    return () => clearInterval(interval);
  }, [checkUpcomingEvents, checkDailyReminder, addLog]);

  const resetNotificationHistory = useCallback(() => {
    localStorage.removeItem('cp_last_daily');
    localStorage.removeItem('cp_notified');
    addLog('Historique réinitialisé.');
    alert("Historique réinitialisé !");
  }, [addLog]);

  const value = {
    permission,
    subscribeUserToPush,
    sendImmediateTest,
    resetNotificationHistory,
    logs
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
