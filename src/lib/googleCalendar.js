import { supabase } from './supabase';

// Récupère le token Google de la session courante
export async function getGoogleToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    localStorage.setItem('google_provider_token', session.provider_token);
    return session.provider_token;
  }
  return localStorage.getItem('google_provider_token');
}

export async function isGoogleConnected() {
  const token = await getGoogleToken();
  return token !== null;
}

// 1. Cherche ou crée le calendrier "ClassPilot"
export async function getOrCreateCalendarId(token) {
  // Liste les calendriers
  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!listRes.ok) throw new Error("Erreur lors de la récupération des calendriers.");
  const data = await listRes.json();
  const existingCal = data.items?.find(cal => cal.summary === "ClassPilot");
  
  if (existingCal) return existingCal.id;

  // S'il n'existe pas, on le crée
  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ summary: "ClassPilot", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
  });

  if (!createRes.ok) throw new Error("Erreur lors de la création du calendrier ClassPilot.");
  const newCal = await createRes.json();
  return newCal.id;
}

// 2. Ajoute un événement dans le calendrier "ClassPilot"
export async function syncEventToGoogleCalendar(eventDetails) {
  const token = await getGoogleToken();
  if (!token) return { error: "Non connecté à Google" };

  try {
    const calendarId = await getOrCreateCalendarId(token);

    let eventBody = {
      summary: eventDetails.title,
      description: eventDetails.description || "Ajouté depuis ClassPilot",
    };

    if (eventDetails.isAllDay) {
      const endDate = new Date(eventDetails.start_time);
      endDate.setDate(endDate.getDate() + 1);
      eventBody.start = { date: new Date(eventDetails.start_time).toISOString().split('T')[0] };
      eventBody.end = { date: endDate.toISOString().split('T')[0] };
    } else {
      eventBody.start = {
        dateTime: eventDetails.start_time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      eventBody.end = {
        dateTime: eventDetails.end_time || eventDetails.start_time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { error: "Token Google expiré. Veuillez vous reconnecter à Google dans les Réglages." };
      }
      return { error: `Erreur Google API. Code: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
}

// 3. Synchronisation massive (Tous les cours / Devoirs à venir)
export async function syncAllEventsToGoogle() {
  const token = await getGoogleToken();
  if (!token) {
    alert("Vous devez d'abord connecter votre compte Google dans les réglages.");
    return false;
  }

  try {
    const calendarId = await getOrCreateCalendarId(token);
    const now = new Date().toISOString();

    // Récupérer les cours à venir
    const { data: courses } = await supabase
      .from('courses')
      .select('title, start_time, end_time, classes(name)')
      .gte('start_time', now);
      
    // Récupérer les rendus à venir
    const { data: assignments } = await supabase
      .from('assignments')
      .select('title, due_date, classes(name)')
      .eq('completed', false)
      .gte('due_date', now);

    // Récupérer les événements *déjà existants* sur Google Calendar
    const eventsRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=2500`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const existingEventsData = await eventsRes.json();
    const googleEvents = existingEventsData.items || [];

    // Helper pour vérifier l'existence
    const isAlreadySynced = (summary, startTimeStr) => {
      return googleEvents.some(ge => {
        // match sur le titre
        if (ge.summary !== summary) return false;
        // match sur la date de début
        const geStartTime = ge.start?.dateTime || ge.start?.date;
        if (!geStartTime) return false;
        return new Date(geStartTime).getTime() === new Date(startTimeStr).getTime();
      });
    };

    let count = 0;

    if (courses) {
      for (const course of courses) {
        const summary = `[${course.classes?.name || 'Cours'}] ${course.title}`;
        
        // On évite les doublons !
        if (isAlreadySynced(summary, course.start_time)) {
          continue; 
        }

        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: summary,
            start: { dateTime: course.start_time },
            end: { dateTime: course.end_time || course.start_time }
          })
        });
        count++;
      }
    }

    if (assignments) {
      for (const assign of assignments) {
        const summary = `[Rendu] ${assign.classes?.name || '?'} - ${assign.title}`;
        
        // On évite les doublons !
        if (isAlreadySynced(summary, assign.due_date)) {
          continue; 
        }

        const endDate = new Date(assign.due_date);
        endDate.setDate(endDate.getDate() + 1); // Google Calendar "all-day" end is exclusive
        const dateString = new Date(assign.due_date).toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];

        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: summary,
            start: { date: dateString },
            end: { date: endDateString }
          })
        });
        count++;
      }
    }

    alert(count === 0 
      ? "Tout est déjà à jour ! Aucun nouvel événement à synchroniser." 
      : `Succès ! ${count} nouveaux événements ont été synchronisés.`);
    return true;
  } catch (err) {
    console.error(err);
    alert("Une erreur est survenue pendant la synchronisation : " + err.message);
    return false;
  }
}

// 4. Supprimer le calendrier ClassPilot
export async function deleteClassPilotCalendar() {
  const token = await getGoogleToken();
  if (!token) return { error: "Non connecté à Google" };

  try {
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!listRes.ok) throw new Error("Impossible de lister les calendriers.");
    const data = await listRes.json();
    const existingCal = data.items?.find(cal => cal.summary === "ClassPilot");

    if (existingCal) {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(existingCal.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { success: true };
    }
    return { success: true, message: "Le calendrier n'existait pas." };
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
}
