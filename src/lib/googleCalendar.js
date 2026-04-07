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

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: eventDetails.title,
        description: eventDetails.description || "Ajouté depuis ClassPilot",
        start: {
          dateTime: eventDetails.start_time,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: eventDetails.end_time || eventDetails.start_time,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      })
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

    let count = 0;

    if (courses) {
      for (const course of courses) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `[${course.classes?.name || 'Cours'}] ${course.title}`,
            start: { dateTime: course.start_time },
            end: { dateTime: course.end_time || course.start_time }
          })
        });
        count++;
      }
    }

    if (assignments) {
      for (const assign of assignments) {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `[Rendu] ${assign.classes?.name || '?'} - ${assign.title}`,
            start: { dateTime: assign.due_date },
            end: { dateTime: assign.due_date }
          })
        });
        count++;
      }
    }

    alert(`Succès ! ${count} événements ont été synchronisés vers le calendrier ClassPilot.`);
    return true;
  } catch (err) {
    console.error(err);
    alert("Une erreur est survenue pendant la synchronisation : " + err.message);
    return false;
  }
}
