import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <button 
        onClick={() => navigate('/login')} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', marginBottom: '24px' }}
      >
        <ChevronLeft size={20} /> Retour
      </button>

      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Conditions d'utilisation</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.6 }}>
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>1. Acceptation des conditions</h2>
          <p>En créant un compte sur ClassPilot, vous acceptez pleinement et sans réserve les présentes conditions d'utilisation. Si vous n'êtes pas d'accord avec ces conditions, veuillez ne pas utiliser l'application.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>2. Utilisation du service</h2>
          <p>ClassPilot est un outil destiné à vous aider à suivre vos cours, vos rendus et vos horaires. Vous êtes responsable des informations que vous y inscrivez. Nous ne garantissons pas de manière absolue l'absence de bugs pouvant entraîner une perte de données, bien que nous fassions de notre mieux pour assurer la fiabilité du service.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>3. Service Tiers (Google Agenda)</h2>
          <p>ClassPilot offre une fonctionnalité permettant la synchronisation avec Google Agenda via les API Google. L'utilisation de cette fonctionnalité est soumise aux règles de confidentialité de Google liées à l'authentification OAuth. ClassPilot décline toute responsabilité quant au fonctionnement interne des services de Google.</p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>4. Modification du service</h2>
          <p>Nous nous réservons le droit de modifier, suspendre ou interrompre l'application (ou toute partie de celle-ci) à tout moment, avec ou sans préavis.</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
