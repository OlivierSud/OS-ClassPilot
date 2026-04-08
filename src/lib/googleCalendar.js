import { supabase } from './supabase';

// Récupère le token Google de la session courante
export async function getGoogleToken() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // 1. Priorité aux tokens de la session active (viennent d'être fournis par Supabase)
  if (session?.provider_token) {
    localStorage.setItem('google_provider_token', session.provider_token);
    if (session.provider_refresh_token) {
      localStorage.setItem('google_refresh_token', session.provider_refresh_token);
    }
    
    // On tente de les sauvegarder aussi en DB pour la persistance multi-appareil/PWA
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_preferences').update({
          google_access_token: session.provider_token,
          google_refresh_token: session.provider_refresh_token
        }).eq('user_id', user.id);
      }
    } catch (e) { console.error("Could not sync tokens to DB", e); }
    
    return session.provider_token;
  }
  
  // 2. Fallback sur localStorage
  let token = localStorage.getItem('google_provider_token');
  
  // 3. Si vide dans localStorage, on tente de récupérer depuis les préférences en DB
  if (!token) {
    try {
      const { data: prefs } = await supabase.from('user_preferences').select('google_access_token').single();
      if (prefs?.google_access_token) {
        token = prefs.google_access_token;
        localStorage.setItem('google_provider_token', token);
      }
    } catch (e) {}
  }
  
  return token;
}

export async function isGoogleConnected() {
  const token = await getGoogleToken();
  if (!token) return false;
  
  // On pourrait faire un appel léger pour vérifier la validité
  // return await checkTokenValidity(token);
  return true;
}

export async function checkTokenValidity(token) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token);
    return res.ok;
  } catch {
    return false;
  }
}

// Map app colors to Google Calendar color IDs
export function getGoogleColorId(colorString) {
  if (!colorString) return undefined;
  const lower = colorString.toLowerCase();
  
  // Exact matches according to ClassForm
  if (lower.includes('#7986cb')) return "1"; // Lavande
  if (lower.includes('#33b679')) return "2"; // Sauge
  if (lower.includes('#8e24aa')) return "3"; // Raisin
  if (lower.includes('#e67c73')) return "4"; // Flamant Rose
  if (lower.includes('#f6bf26')) return "5"; // Banane
  if (lower.includes('#f4511e')) return "6"; // Mandarine
  if (lower.includes('#039be5')) return "7"; // Paon
  if (lower.includes('#616161')) return "8"; // Graphite
  if (lower.includes('#3f51b5')) return "9"; // Myrtille
  if (lower.includes('#0b8043')) return "10"; // Basilic
  if (lower.includes('#d50000')) return "11"; // Tomate

  // Legacy variables support
  if (lower.includes('primary') || lower.includes('blue')) return "9";
  if (lower.includes('secondary') || lower.includes('orange')) return "6";
  if (lower.includes('accent') || lower.includes('purple')) return "3";
  if (lower.includes('error') || lower.includes('red')) return "11";
  if (lower.includes('success') || lower.includes('green')) return "10";
  
  return undefined;
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

    const colorId = getGoogleColorId(eventDetails.color);
    if (colorId) {
      eventBody.colorId = colorId;
    }

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
      .select('title, start_time, end_time, type, classes(name, color)')
      .gte('start_time', now);
      
    // Récupérer les rendus à venir
    const { data: assignments } = await supabase
      .from('assignments')
      .select('title, due_date, classes(name, color)')
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
        let summary;
        if (course.type === 'conseil_de_classe') {
          summary = `[Conseil] ${course.classes?.name || '?'} - ${course.title}`;
        } else {
          summary = `[${course.classes?.name || 'Cours'}] ${course.title}`;
        }
        
        // On évite les doublons !
        if (isAlreadySynced(summary, course.start_time)) {
          continue; 
        }

        const eventBody = {
          summary: summary,
          start: { dateTime: course.start_time },
          end: { dateTime: course.end_time || course.start_time }
        };

        const colorId = getGoogleColorId(course.classes?.color);
        if (colorId) eventBody.colorId = colorId;

        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody)
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

        const eventBody = {
          summary: summary,
          start: { date: dateString },
          end: { date: endDateString }
        };

        const colorId = getGoogleColorId(assign.classes?.color || 'var(--grad-error)'); // Les rendus sont souvent rouges par défaut
        if (colorId) eventBody.colorId = colorId;

        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody)
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

// 5. Google Drive Folder Picker Helpers
export async function listGoogleDriveFolders(parentId = 'root') {
  const token = await getGoogleToken();
  if (!token) return { error: "Non connecté à Google" };

  try {
    const q = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1000`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const reason = errData.error?.message || response.status;
      if (response.status === 401) throw new Error("Token expiré ou invalide. Essayez de vous reconnecter.");
      if (response.status === 403) throw new Error(`Permission refusée (403): ${reason}. Vérifiez que 'Google Drive API' est bien activée dans la console Google Cloud et que vous avez coché les cases d'accès lors de la connexion.`);
      throw new Error(`Erreur Drive API (${response.status}): ${reason}`);
    }

    const data = await response.json();
    return { data: data.files || [] };
  } catch (err) {
    console.error("DRIVE ERROR:", err);
    return { error: err.message };
  }
}

export async function getFolderNameById(folderId) {
  if (!folderId || folderId === 'root') return "Mon Drive (Racine)";
  const token = await getGoogleToken();
  if (!token) return "?";

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=name`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return "?";
    const data = await res.json();
    return data.name;
  } catch {
    return "?";
  }
}
