import { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, Bell, ChevronRight, Download, Clock, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { usePWA } from '../context/PWAContext';
import { useUserPreferences } from '../hooks/useData';

const Settings = () => {
  const { isInstallable, installPWA, isInstalled } = usePWA();
  const { preferences, updatePreferences } = useUserPreferences();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await supabase.auth.signOut();
    }
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, color = 'var(--primary)', type = 'button', isToggled, children }) => {
    const active = isToggled !== undefined ? isToggled : (label === "Mode Sombre" ? isDarkMode : false);
    
    return (
      <div 
        onClick={onClick}
        className="bg-white dark:bg-slate-900 rounded-[28px] mb-4 p-4 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all active:scale-[0.98] cursor-pointer"
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
                className="relative rounded-full transition-all duration-300 shadow-inner"
                style={{ 
                  width: '50px', 
                  height: '26px', 
                  backgroundColor: active ? '#22C55E' : '#e2e8f0'
                }}
              >
                <div 
                  className="absolute bg-white rounded-full transition-all duration-300 transform shadow-md"
                  style={{ 
                    transform: active ? 'translateX(24px)' : 'translateX(0)',
                    width: '20px',
                    height: '20px',
                    top: '3px',
                    left: '3px'
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
      />
      <SettingItem 
        icon={Bell} 
        label="Rappel Quotidien" 
        type="toggle"
        isToggled={preferences?.notify_daily}
        color="var(--primary)" 
        onClick={() => updatePreferences({ notify_daily: !preferences?.notify_daily })}
      >
        {preferences?.notify_daily && (
          <select 
            value={preferences?.daily_hour}
            onChange={(e) => updatePreferences({ daily_hour: parseInt(e.target.value) })}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-2 py-1 text-xs font-black text-primary outline-none"
          >
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
              <option key={h} value={h}>{h}h00</option>
            ))}
          </select>
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
      />

      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-8 ml-4">Application</div>
      <SettingItem 
        icon={isInstalled ? () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg> : Download} 
        label={isInstalled ? "ClassPilot installée" : "Installer l'application"} 
        value={isInstalled ? "Sur votre écran d'accueil" : (isInstallable ? "Ajouter ClassPilot au menu" : "Indisponible sur ce navigateur")}
        color={isInstalled ? "var(--success)" : (isInstallable ? "var(--primary)" : "#94a3b8")} 
        onClick={(isInstalled || !isInstallable) ? null : installPWA}
        type={(isInstalled || !isInstallable) ? 'info' : 'button'}
      />

      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-8 ml-4">Compte</div>
      <SettingItem 
        icon={LogOut} 
        label="Déconnexion" 
        color="var(--error)" 
        onClick={handleLogout}
      />

      <div className="text-center mt-12 opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">ClassPilot v1.2.0 • 2026</p>
      </div>
    </div>
  );
};

export default Settings;
