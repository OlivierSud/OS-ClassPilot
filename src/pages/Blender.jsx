import { ChevronLeft, ExternalLink, FileText, Github, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Blender = () => {
  const navigate = useNavigate();

  const tips = [
    {
      id: 1,
      title: "Raccourcis clavier",
      type: "html",
      source: "github",
      url: "https://github.com/OlivierSud/OS-blender-course/tree/main/Tips/Raccourcis%20clavier",
      description: "Liste complète des raccourcis essentiels pour Blender."
    },
    {
      id: 2,
      title: "Configuration Initiale",
      type: "pdf",
      source: "google",
      url: "https://www.google.com/search?q=Blender+configuration+initiale+pdf",
      description: "Guide PDF sur la configuration optimale du logiciel."
    },
    {
      id: 3,
      title: "Modélisation Low Poly",
      type: "html",
      source: "github",
      url: "https://github.com/OlivierSud/OS-blender-course/tree/main/Tips",
      description: "Astuces pour une modélisation efficace et légère."
    },
    {
      id: 4,
      title: "Nodes de Géométrie",
      type: "pdf",
      source: "google",
      url: "https://www.google.com/search?q=Blender+Geometry+Nodes+tips+pdf",
      description: "Récapitulatif des nodes les plus utilisés."
    }
  ];

  return (
    <div className="page-container">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="bg-white p-2 rounded-full shadow-sm active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Blender Tips</h1>
      </header>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Tips HTML (GitHub)</h2>
          <div className="grid grid-cols-1 gap-4">
            {tips.filter(t => t.type === 'html').map(tip => (
              <motion.a
                key={tip.id}
                href={tip.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="card flex items-center gap-4 p-4 hover:shadow-md transition-shadow"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="bg-github p-3 rounded-2xl text-white">
                  <Github size={24} />
                </div>
                <div className="flex-1">
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{tip.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tip.description}</p>
                </div>
                <ExternalLink size={18} className="text-slate-400" />
              </motion.a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Tips PDF (Compte Google)</h2>
          <div className="grid grid-cols-1 gap-4">
            {tips.filter(t => t.type === 'pdf').map(tip => (
              <motion.a
                key={tip.id}
                href={tip.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="card flex items-center gap-4 p-4 hover:shadow-md transition-shadow"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="bg-google-pdf p-3 rounded-2xl text-white">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{tip.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tip.description}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  PDF
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 p-6 bg-slate-50 rounded-[24px] border border-slate-100 italic text-sm text-slate-500">
        <p>
          Note : Les fichiers HTML sont synchronisés avec votre projet GitHub, tandis que les PDF doivent être consultés sur votre compte Google Drive.
        </p>
      </div>
    </div>
  );
};

export default Blender;
