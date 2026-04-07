import { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, Bell, ChevronRight, Download, Clock, Calendar, Trash2, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { usePWA } from '../context/PWAContext';
import { useUserPreferences } from '../hooks/useData';
import { syncAllEventsToGoogle, deleteClassPilotCalendar } from '../lib/googleCalendar';
import { useNotifications } from '../hooks/useNotifications';

const Settings = () => {
  const { isInstallable, installPWA, isInstalled } = usePWA();
  const { preferences, updatePreferences } = useUserPreferences();
  const { subscribeUserToPush, sendImmediateTest, resetNotificationHistory, permission, logs } = useNotifications();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });
  const [showDebug, setShowDebug] = useState(false);
  const [googleIdentity, setGoogleIdentity] = useState(null);

  useEffect(() => {
    async function fetchIdentities() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.identities) {
        const googleId = user.identities.find(id => id.provider === 'google');
        if (googleId) {
          setGoogleIdentity(googleId);
        }
      }
    }
    fetchIdentities();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleConnectGoogle = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) {
      alert("Erreur de connexion Google : " + error.message);
    } else {
      alert("Redirection en cours vers Google...");
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!googleIdentity) return;
    if (!confirm("Voulez-vous vraiment supprimer l'agenda 'ClassPilot' de votre compte Google, annuler la synchronisation, et déconnecter votre compte Google de l'application ?")) return;

    try {
      // 1. Supprimer le calendrier Google
      await deleteClassPilotCalendar();

      // 2. Déconnecter l'identité Google de Supabase
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      
      if (error) throw error;

      setGoogleIdentity(null);
      localStorage.removeItem('google_provider_token');
      alert("Compte Google déconnecté et calendrier supprimé avec succès !");
    } catch (err) {
      alert("Erreur lors de la déconnexion : " + err.message);
    }
  };

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await supabase.auth.signOut();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = confirm('ATTENTION : Cette action est irréversible. Toutes vos classes, devoirs et préférences seront supprimés définitivement. Continuer ?');
    if (confirmation) {
      const { error } = await supabase.rpc('delete_own_user');
      if (error) {
        alert("Erreur lors de la suppression : " + error.message);
      } else {
        // La suppression de l'utilisateur dans auth.users déconnecte automatiquement dans la plupart des cas, 
        // mais on force le nettoyage local
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    }
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, color = 'var(--primary)', type = 'button', isToggled, children, isDark }) => {
    const active = isToggled !== undefined ? isToggled : (label === "Mode Sombre" ? isDark : false);
    
    return (
      <div 
        onClick={(e) => {
          console.log('SettingItem clicked:', label);
          if (onClick) onClick(e);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onClick) onClick();
          }
        }}
        className="bg-white rounded-[28px] mb-4 p-4 shadow-xl shadow-slate-200/40 border border-slate-100 transition-all active:scale-[0.98] cursor-pointer hover:border-slate-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-[0.95rem] font-bold text-slate-800 dark:text-slate-100 leading-tight">{label}</h3>
              {value && <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{value}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {children && <div onClick={(e) => e.stopPropagation()} className="mr-1">{children}</div>}
            
            {type === 'toggle' ? (
              <div 
                className="relative rounded-full transition-all duration-300"
                style={{ 
                  width: '56px', 
                  height: '30px', 
                  backgroundColor: active ? '#22C55E' : (isDark ? '#1e293b' : '#E8EDF2'),
                  boxShadow: active 
                    ? 'inset 2px 2px 4px rgba(0,0,0,0.1)' 
                    : (isDark 
                      ? 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #334155' 
                      : 'inset 4px 4px 6px #d1d9e6, inset -4px -4px 6px #ffffff'),
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 5px',
                  border: isDark ? '1px solid #334155' : '1px solid #f8fafc'
                }}
              >
                <div 
                  className="bg-white rounded-full transition-all duration-300 transform"
                  style={{ 
                    transform: active ? 'translateX(26px)' : 'translateX(0)',
                    width: '20px',
                    height: '20px',
                    boxShadow: isDark 
                      ? '2px 2px 5px #0f172a' 
                      : '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff',
                    background: active ? '#fff' : (isDark ? '#e2e8f0' : '#fff')
                  }}
                />
              </div>
            ) : type === 'info' ? null : (
              <ChevronRight size={18} className="text-slate-300 mr-2" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ paddingBottom: '120px' }}>
      <header className="mb-10 pt-4">
        <div className="w-12 h-1.5 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full mb-3"></div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Réglages</h1>
        <p className="text-sm text-slate-400 font-bold">Personnalisez votre expérience</p>
      </header>

      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-4">Préférences</div>
      <SettingItem 
        icon={isDarkMode ? Moon : Sun} 
        label="Mode Sombre" 
        type="toggle"
        color="#8b5cf6"
        onClick={() => setIsDarkMode(!isDarkMode)}
        isDark={isDarkMode}
      />
      <SettingItem 
        icon={Bell} 
        label="Rappel Quotidien" 
        type="toggle"
        isToggled={preferences?.notify_daily}
        color="var(--primary)" 
        onClick={() => updatePreferences({ notify_daily: !preferences?.notify_daily })}
        isDark={isDarkMode}
      >
        {preferences?.notify_daily && (
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const totalMinutes = preferences?.daily_hour !== undefined 
                ? (preferences.daily_hour < 24 ? preferences.daily_hour * 60 : preferences.daily_hour) 
                : 18 * 60;
              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;
              const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              
              return (
                <input 
                  type="time" 
                  value={timeString}
                  onChange={(e) => {
                    const [newH, newM] = e.target.value.split(':').map(Number);
                    updatePreferences({ daily_hour: newH * 60 + newM });
                  }}
                  className="form-input !w-24 !py-1 text-center font-bold text-primary bg-primary/5 border-primary/20"
                />
              );
            })()}
          </div>
        )}
      </SettingItem>
      <SettingItem 
        icon={Calendar} 
        label="Révision du Lundi" 
        value="Envoyé chaque matin"
        type="toggle"
        isToggled={preferences?.notify_weekly}
        color="var(--success)" 
        onClick={() => updatePreferences({ notify_weekly: !preferences?.notify_weekly })}
        isDark={isDarkMode}
      />
      <SettingItem 
        icon={Smartphone} 
        label="Push Android" 
        value={permission === 'granted' ? "Activé sur cet appareil" : (permission === 'denied' ? "Bloqué (cliquez pour corriger)" : "Cliquer pour activer")}
        color={permission === 'granted' ? "var(--success)" : (permission === 'denied' ? "var(--error)" : "var(--primary)")} 
        onClick={subscribeUserToPush}
        type={permission === 'granted' ? 'info' : 'button'}
        isDark={isDarkMode}
      >
        {permission === 'granted' && (
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                sendImmediateTest();
              }}
              className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              Tester
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                resetNotificationHistory();
              }}
              className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </SettingItem>
      
      {/* Diagnostic Logs */}
      {logs.length > 0 && (
        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Console de Diagnostic</h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-primary">{showDebug ? 'Masquer' : 'Afficher'}</span>
              <ChevronRight size={14} className={`text-slate-400 transition-transform ${showDebug ? 'rotate-90' : ''}`} />
            </div>
          </button>
          
          {showDebug && (
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex justify-end mb-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); resetNotificationHistory(); }}
                  className="text-[10px] font-bold text-primary/60 hover:text-primary underline"
                >
                  Effacer historique
                </button>
              </div>
              {logs.map((log, i) => (
                <div key={i} className="text-[11px] font-medium text-slate-600 font-mono break-all leading-relaxed border-l-2 border-slate-200 pl-2">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-8 ml-4">Application</div>
      <SettingItem 
        icon={isInstalled ? () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg> : Download} 
        label={isInstalled ? "ClassPilot installée" : "Installer l'application"} 
        value={isInstalled ? "Sur votre écran d'accueil" : (isInstallable ? "Ajouter ClassPilot au menu" : "Indisponible sur ce navigateur")}
        color={isInstalled ? "var(--success)" : (isInstallable ? "var(--primary)" : "#94a3b8")} 
        onClick={(isInstalled || !isInstallable) ? null : installPWA}
        type={(isInstalled || !isInstallable) ? 'info' : 'button'}
        isDark={isDarkMode}
      />

      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-8 ml-4">Compte</div>
      
      <SettingItem 
        icon={Calendar} 
        label="Connecté à Google" 
        value={googleIdentity ? googleIdentity.identity_data.email : "Associer le compte"}
        color={googleIdentity ? "var(--success)" : "var(--primary)"} 
        onClick={googleIdentity ? null : handleConnectGoogle}
        isDark={isDarkMode}
      >
        {googleIdentity?.identity_data?.avatar_url && (
          <img 
            src={googleIdentity.identity_data.avatar_url} 
            alt="Google" 
            className="w-5 h-5 rounded-full border border-slate-100 shadow-sm"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </SettingItem>

      {googleIdentity && (
        <>
          <SettingItem 
            icon={Clock} 
            label="Synchroniser tout l'agenda" 
            value="Pousse tous les cours vers Google"
            color="var(--success)" 
            onClick={async () => {
              const success = await syncAllEventsToGoogle();
              if (success) {
                // Optionnel
              }
            }}
            isDark={isDarkMode}
          />
          
          <SettingItem 
            icon={Trash2} 
            label="Supprimer & Déconnecter Google" 
            value="Action irréversible sur votre agenda"
            color="var(--error)" 
            onClick={handleDisconnectGoogle}
            isDark={isDarkMode}
          />
        </>
      )}

      {/* Synchroniser tout l'agenda n'apparait pas si pas connecté (fait par le wrapper au-dessus) */}

      <SettingItem 
        icon={LogOut} 
        label="Déconnexion" 
        color="var(--primary)" 
        onClick={handleLogout}
        isDark={isDarkMode}
      />
      <SettingItem 
        icon={Trash2} 
        label="Supprimer le compte" 
        value="Action irréversible"
        color="var(--error)" 
        onClick={handleDeleteAccount}
        isDark={isDarkMode}
      />

      <div className="text-center mt-12 opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ClassPilot v1.2.0 • 2026</p>
      </div>
      
      {/* Diagnostic tool removed */}
    </div>
  );
};

export default Settings;
