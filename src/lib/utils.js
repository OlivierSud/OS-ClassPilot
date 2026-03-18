import { format, isBefore, differenceInDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date) => {
  return format(new Date(date), 'EEEE d MMMM', { locale: fr });
};

export const formatTime = (date) => {
  return format(new Date(date), 'HH:mm');
};

export const getTimeRemaining = (date) => {
  const target = new Date(date);
  const now = new Date();
  
  // Différence en jours de calendrier (ignorons les heures pour le calcul des "jours")
  const diff = differenceInDays(startOfDay(target), startOfDay(now));
  
  if (diff < 0) return 'Délai passé';
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return `Dans ${diff} jours`;
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
