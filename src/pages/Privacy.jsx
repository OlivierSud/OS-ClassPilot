import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <button 
        onClick={() => navigate('/login')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginBottom: '24px' }}
      >
        <ChevronLeft size={20} /> Retour
      </button>

      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Règles de confidentialité</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.6 }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>1. Collecte des données</h2>
          <p>Nous collectons uniquement les données nécessaires au bon fonctionnement de l'application ClassPilot, telles que votre adresse email lors de l'inscription, et les données relatives à vos cours (titres, dates, descriptions).</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>2. Synchronisation Google Agenda</h2>
          <p>Lorsque vous choisissez de lier votre compte Google à ClassPilot, nous demandons l'autorisation d'accéder à votre Google Agenda. Cette autorisation est utilisée <strong>exclusivement</strong> pour :</p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Créer un nouveau calendrier nommé "ClassPilot" dans votre compte Google.</li>
            <li>Ajouter, mettre à jour, ou supprimer les événements (cours et rendus) générés depuis l'application ClassPilot vers ce calendrier dédié.</li>
          </ul>
          <p style={{ marginTop: '8px' }}>Nous ne lisons, ne modifions, ni ne supprimons aucun de vos autres événements personnels existants sur votre Google Agenda.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>3. Stockage et Sécurité</h2>
          <p>Vos données sont stockées de manière sécurisée via Supabase. Les tokens d'authentification Google (si vous liez votre compte) sont stockés localement sur votre appareil pour permettre la synchronisation, et ne sont pas utilisés à d'autres fins commerciales.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>4. Suppression des données</h2>
          <p>Vous pouvez à tout moment vous déconnecter de Google depuis les réglages de l'application, ce qui révoquera immédiatement l'accès à votre agenda. Vous pouvez également supprimer définitivement l'intégralité de votre compte ClassPilot ; toutes vos données associées seront alors effacées.</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
