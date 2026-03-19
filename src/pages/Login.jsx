import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import logoApp from '../icones/logo_ClassPilot.png';

const Login = () => {
  const { isInstallable, installPWA, isInstalled } = usePWA();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Vérifiez vos emails pour confirmer l'inscription !");
    setLoading(false);
  };

  return (
    <div 
      style={{ 
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #1E3A5F, #2A4D73)',
        padding: '24px',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          width: '100%',
          textAlign: 'center',
          maxWidth: '350px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          color: '#F5F7FA'
        }}
      >
        {/* Icon */}
        <img src={logoApp} alt="logo" style={{ width: '80px', marginBottom: '15px' }} />
        
        {/* Title & Subtitle */}
        <h1 style={{ fontSize: '28px', marginBottom: '5px', color: '#F5F7FA' }}>
          ClassPilot
        </h1>
        <p style={{ fontSize: '13px', color: '#FFC857', marginBottom: '25px' }}>
          Gestion de cours et projets
        </p>

        <form 
          style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }} 
          onSubmit={handleLogin}
        >
          <div className="mb-[15px]">
            <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block' }}>
              Email
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                outline: 'none'
              }}
              placeholder="votre@email.com"
            />
          </div>

          <div className="mb-[15px]">
            <label style={{ fontSize: '12px', marginBottom: '5px', display: 'block' }}>
              Mot de passe
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF8C42, #FFC857)',
              color: '#1E3A5F',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.3s',
              boxShadow: '0 8px 15px rgba(255, 140, 66, 0.2)'
            }}
            className="hover:-translate-y-0.5"
          >
            {loading ? 'Connexion...' : 'Connexion'}
          </button>



          <button 
            type="button"
            onClick={handleSignUp}
            style={{
              marginTop: '15px',
              display: 'block',
              fontSize: '13px',
              color: '#FFC857',
              textDecoration: 'none',
              background: 'none',
              width: '100%',
              textAlign: 'center'
            }}
          >
            Créer un compte
          </button>

          <button 
            type="button"
            onClick={isInstalled ? null : installPWA}
            disabled={isInstalled || (!isInstallable && !isInstalled)}
            style={{
              marginTop: '15px',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              color: isInstalled ? '#22C55E' : 'white',
              background: 'rgba(255,255,255,0.1)',
              border: isInstalled ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              width: '100%',
              cursor: isInstalled ? 'default' : (isInstallable ? 'pointer' : 'not-allowed'),
              opacity: (!isInstallable && !isInstalled) ? 0.5 : 1
            }}
          >
            {isInstalled ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
                Application installée
              </>
            ) : (
              <>
                <Download size={16} />
                {isInstallable ? "Installer l'application" : "Installation non dispo."}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
