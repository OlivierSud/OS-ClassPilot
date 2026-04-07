import { supabase } from './supabase';

export async function getGoogleToken() {
  const { data: { session } } = await supabase.auth.getSession();
  // Supabase stocke le token du provider (Google) ici lors d'une connexion OAuth
  if (session?.provider_token) {
    return session.provider_token;
  }
  return null;
}

export async function isGoogleConnected() {
  const token = await getGoogleToken();
  return token !== null;
}

export async function syncEventToGoogleCalendar(eventDetails) {
  const token = await getGoogleToken();
  if (!token) {
    console.log("ClassPilot: Pas de token Google, synchronisation ignorée.");
    return { error: "Non connecté à Google (Token manquant)" };
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: "ClassPilot: " + eventDetails.title,
        description: "Ajouté depuis ClassPilot",
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
      return { error: `Google API Error: ${response.statusText}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: err.message };
  }
}
