import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { addHours, subHours, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { urlBase64ToUint8Array } from '../lib/push';
import { useUserPreferences } from './useData';

// Use environment variable if available, otherwise use your placeholder
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BCXE6n6giLYrpK1aLCh4BeUchfpyt_8vXcU3MeaaZm0yiUpz_C6dQAlaQBaeyAAInJxdW2kLttoFSiodSIsX9h0';

export function useNotifications() {
  const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'unsupported');
  const { preferences } = useUserPreferences();

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
      setPermission(status);

      if (status !== 'granted') return;

      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const subJson = subscription.toJSON();
        await supabase.from('push_subscriptions').insert([{
          user_id: user.id,
          subscription: subJson
        }]);
        alert("Notifications activées avec succès !");
      }
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return false;
    }
  };

  const showNotification = useCallback(async (title, options, id) => {
    console.log(`[Diagnostic] Attempting showNotification: "${title}"`, { options, id });
    
    // Check if already notified
    const notified = JSON.parse(localStorage.getItem('cp_notified') || '[]');
    if (id && notified.includes(id)) {
      console.log(`[Diagnostic] ID "${id}" already notified, skipping.`);
      return;
    }

    if (Notification.permission === 'granted') {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
      console.log(`[Diagnostic] SW Registration:`, registration ? 'Found' : 'NOT FOUND');

      const finalOptions = {
        icon: '/logo_ClassPilot.png',
        badge: '/logo_ClassPilot.png',
        vibrate: [200, 100, 200],
        ...options
      };

      try {
        if (registration) {
          await registration.showNotification(title, finalOptions);
          console.log(`[Diagnostic] registration.showNotification called successfully.`);
        } else {
          new Notification(title, finalOptions);
          console.log(`[Diagnostic] fallback new Notification called successfully.`);
        }

        if (id) {
          notified.push(id);
          if (notified.length > 50) notified.shift();
          localStorage.setItem('cp_notified', JSON.stringify(notified));
        }
      } catch (err) {
        console.error(`[Diagnostic] Error during showNotification:`, err);
      }
    } else {
      console.warn(`[Diagnostic] Permission NOT GRANTED:`, Notification.permission);
    }
  }, []);

  const sendImmediateTest = useCallback(() => {
    console.log('[Diagnostic] Manual test triggered.');
    showNotification("Test ClassPilot 🚀", {
      body: "Si vous voyez ceci, le canal de notification local est opérationnel !",
    }, null);
  }, [showNotification]);

  const checkDailyReminder = useCallback(async () => {
    if (!preferences?.notify_daily) {
      console.log('[Diagnostic] Daily reminder disabled in preferences.');
      return;
    }
    if (Notification.permission !== 'granted') {
      console.log('[Diagnostic] Permission not granted for daily reminder.');
      return;
    }

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const lastDaily = localStorage.getItem('cp_last_daily');
    
    if (lastDaily === todayStr) {
      console.log('[Diagnostic] Daily reminder already sent for today:', todayStr);
      return;
    }

    const dailyHour = preferences.daily_hour !== undefined 
      ? (preferences.daily_hour < 24 ? preferences.daily_hour * 60 : preferences.daily_hour) 
      : 18 * 60;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    console.log(`[Diagnostic] Daily Check: now=${currentMinutes}min, target=${dailyHour}min`);

    if (currentMinutes >= dailyHour) {
      console.log('[Diagnostic] It is time! Checking for events in next 48h...');
      const todayStart = startOfDay(now).toISOString();
      const limit48h = endOfDay(addDays(now, 2)).toISOString();

      const { count: cCount, error: cErr } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', todayStart)
        .lte('start_time', limit48h);

      const { count: aCount, error: aErr } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('completed', false)
        .gte('due_date', todayStart)
        .lte('due_date', limit48h);

      if (cErr || aErr) console.error('[Diagnostic] Supabase Error during 48h check:', cErr || aErr);

      const totalEventsNext48h = (cCount || 0) + (aCount || 0);
      console.log(`[Diagnostic] Events in 48h: ${totalEventsNext48h} (${cCount} courses, ${aCount} assignments)`);
      
      if (totalEventsNext48h === 0) {
        console.log('[Diagnostic] No events in next 48h, skipping notification.');
        localStorage.setItem('cp_last_daily', todayStr);
        return;
      }

      // Fetch details for Today
      const todayEnd = endOfDay(now).toISOString();
      const { data: todayCourses } = await supabase
        .from('courses')
        .select('title')
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd);

      const { data: todayAssignments } = await supabase
        .from('assignments')
        .select('title')
        .eq('completed', false)
        .gte('due_date', todayStart)
        .lte('due_date', todayEnd);

      // Fetch details for Tomorrow
      const tomorrowStart = startOfDay(addDays(now, 1)).toISOString();
      const tomorrowEnd = endOfDay(addDays(now, 1)).toISOString();
      const { data: tomorrowCourses } = await supabase
        .from('courses')
        .select('title')
        .gte('start_time', tomorrowStart)
        .lte('start_time', tomorrowEnd);

      let body = "";
      
      // Today section
      if (todayCourses?.length || todayAssignments?.length) {
        const titles = [
          ...(todayCourses?.map(c => c.title) || []),
          ...(todayAssignments?.map(a => `Rendu: ${a.title}`) || [])
        ];
        body += `Aujourd'hui : ${titles.join(', ')}. `;
      } else {
        body += "Rien de prévu aujourd'hui. ";
      }

      // Tomorrow section
      if (tomorrowCourses?.length) {
        body += `Demain : ${tomorrowCourses.length} cours prévu(s).`;
      } else if (totalEventsNext48h > (todayCourses?.length || 0) + (todayAssignments?.length || 0)) {
        body += "Activités prévues après-demain.";
      }

      showNotification("Votre programme 🎯", { body }, null);
      localStorage.setItem('cp_last_daily', todayStr);
    }
  }, [preferences, showNotification]);

  const checkUpcomingEvents = useCallback(async () => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const in30Min = addHours(now, 0.5); // Check for next 30 min
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    console.log(`[Diagnostic] Checking for upcoming events between ${now.toISOString()} and ${in30Min.toISOString()}`);

    // Courses starting soon
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, start_time')
      .gte('start_time', now.toISOString())
      .lte('start_time', in30Min.toISOString());

    courses?.forEach(course => {
      console.log(`[Diagnostic] Found upcoming course: ${course.title}`);
      showNotification("Cours imminent ! 🏫", {
        body: `Votre cours "${course.title}" commence bientôt.`,
        tag: `course_${course.id}`
      }, `course_${course.id}`);
    });

    // Assignments due soon
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, due_date')
      .eq('completed', false)
      .gte('due_date', now.toISOString())
      .lte('due_date', in30Min.toISOString());

    assignments?.forEach(asgn => {
      console.log(`[Diagnostic] Found upcoming assignment: ${asgn.title}`);
      showNotification("Rendu urgent ! ⏳", {
        body: `Le devoir "${asgn.title}" est à rendre très bientôt.`,
        tag: `asgn_${asgn.id}`
      }, `asgn_${asgn.id}`);
    });
  }, [showNotification]);

  useEffect(() => {
    const runChecks = () => {
      console.log('[Diagnostic] Global check interval triggered.');
      checkUpcomingEvents();
      checkDailyReminder();
    };

    runChecks();
    const interval = setInterval(runChecks, 5 * 60 * 1000); // Check every 5 min

    const handlePermissionChange = () => setPermission(Notification.permission);
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then(status => {
        status.onchange = handlePermissionChange;
      });
    }

    return () => clearInterval(interval);
  }, [checkUpcomingEvents, checkDailyReminder]);

  const resetNotificationHistory = useCallback(() => {
    localStorage.removeItem('cp_last_daily');
    localStorage.removeItem('cp_notified');
    console.log('[Diagnostic] Notification history cleared.');
    alert("Historique des notifications réinitialisé pour aujourd'hui.");
  }, []);

  return { subscribeUserToPush, sendImmediateTest, resetNotificationHistory, permission };
}
