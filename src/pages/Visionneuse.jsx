import { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  ExternalLink, 
  MonitorPlay,
  ArrowLeft,
  Search,
  BookOpen
} from 'lucide-react';

const DRIVE_CONFIG = {
  apiKey: 'AIzaSyBA2lV9mm9_tNIpErOd9yO5lMjlIYtlCwM',
  folderId: '1hXzaOpzsBJSwESAugAwutJc7oaR8Ou17'
};

const Visionneuse = () => {
  const [data, setData] = useState({ courses: {}, tips: [] });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'viewer'

  const toggleFolder = (id) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchGoogleDriveData = useCallback(async () => {
    try {
      const apiKey = DRIVE_CONFIG.apiKey;
      
      const getFolderContents = async (folderId) => {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webContentLink)&key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch folder");
        const resData = await response.json();
        return resData.files || [];
      };

      const buildTree = async (folderId, folderName) => {
        const files = await getFolderContents(folderId);
        const children = [];

        files.sort((a, b) => {
          const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
          const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';
          if (isAFolder && !isBFolder) return -1;
          if (!isAFolder && isBFolder) return 1;
          return a.name.localeCompare(b.name);
        });

        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            const subChildren = await buildTree(file.id, file.name);
            children.push({
              type: 'folder',
              id: file.id,
              name: file.name,
              children: subChildren
            });
          } else if (file.mimeType === 'application/pdf') {
            children.push({
              type: 'file',
              id: file.id,
              name: file.name,
              path: `https://drive.google.com/file/d/${file.id}/preview`,
              downloadUrl: file.webContentLink
            });
          }
        }
        return children;
      };

      const rootContents = await getFolderContents(DRIVE_CONFIG.folderId);
      const finalData = { courses: {}, tips: [] };

      for (const item of rootContents) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const nameLower = item.name.toLowerCase().trim();
          if (nameLower.includes('anné') || nameLower === 'cours') {
            const years = await getFolderContents(item.id);
            for (const year of years) {
              if (year.mimeType === 'application/vnd.google-apps.folder') {
                finalData.courses[year.name] = await buildTree(year.id, year.name);
              }
            }
          }
        }
      }

      // Local Tips
      finalData.tips = [
        {
          type: 'file',
          id: 'tip-1',
          name: 'Interface et base de modélisation',
          path: '/visionneuse/Tips/Interface et base de modélisation.pdf'
        },
        {
          type: 'file',
          id: 'tip-2',
          name: 'Raccourcis clavier',
          path: '/visionneuse/Tips/Raccourcis clavier/index.html'
        }
      ];

      setData(finalData);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoogleDriveData();
  }, [fetchGoogleDriveData]);

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    if (window.innerWidth < 1024) {
      setViewMode('viewer');
    }
  };

  const renderTree = (items, depth = 0) => {
    if (!items) return null;

    return items
      .filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.type === 'folder' && item.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))
      )
      .map((item) => {
        const isExpanded = expandedFolders[item.id];
        const isFile = item.type === 'file';

        return (
          <div key={item.id || item.name} className="tree-item">
            <div 
              className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all hover:bg-primary/5 active:scale-[0.98] ${selectedFile?.id === item.id ? 'bg-primary/10 border-l-4 border-primary' : ''}`}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
              onClick={() => isFile ? handleSelectFile(item) : toggleFolder(item.id)}
            >
              {!isFile ? (
                isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
              ) : (
                <div className="w-4" /> 
              )}
              
              {isFile ? (
                <FileText size={18} className="text-primary" />
              ) : (
                <Folder size={18} className="text-accent fill-accent/10" />
              )}
              
              <span className={`text-sm ${isFile ? 'font-medium text-slate-700 dark:text-slate-200' : 'font-bold text-slate-800 dark:text-slate-100'}`}>
                {item.name.replace('.pdf', '')}
              </span>
            </div>
            
            {!isFile && isExpanded && (
              <div className="folder-children">
                {renderTree(item.children, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-bg-color gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-500 animate-pulse">Chargement de la bibliothèque 3D...</p>
      </div>
    );
  }

  const years = Object.keys(data.courses).sort((a, b) => b - a);
  const treeData = years.map(year => ({
    type: 'folder',
    id: year,
    name: `Année ${year}-${parseInt(year) + 1}`,
    children: data.courses[year]
  }));

  return (
    <div className={`flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-bg-color overflow-hidden`}>
      <aside className={`w-full lg:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl ${viewMode === 'viewer' ? 'hidden' : 'flex'}`}>
        <div className="p-6">
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl text-white shadow-lg shadow-primary/20">
                <MonitorPlay size={20} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Blender</h1>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bibliothèque de cours</p>
          </header>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher un cours..." 
              className="form-input !pl-10 !py-2.5 !text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-10 custom-scrollbar">
          <div className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Cours</div>
          {renderTree(treeData)}

          <div className="mt-8 px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Astuces 3D</div>
          {renderTree(data.tips)}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col relative bg-slate-100 dark:bg-[#0b1121] ${viewMode === 'list' && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
        {selectedFile ? (
          <>
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setViewMode('list')}
                  className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{selectedFile.name.replace('.pdf', '')}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">O.S. Blender Course</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedFile.downloadUrl && (
                  <a 
                    href={selectedFile.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <Download size={20} />
                  </a>
                )}
                <a 
                  href={selectedFile.path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#323639] overflow-hidden relative">
              <iframe 
                src={selectedFile.path} 
                className="w-full h-full border-none shadow-2xl"
                title="Viewer Blender"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
              <BookOpen size={36} className="text-primary" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Veuillez sélectionner un cours</h2>
            <p className="text-sm text-slate-400 max-w-xs font-medium">Choisissez un chapitre dans la liste à gauche pour commencer votre apprentissage sur Blender.</p>
            
            <div className="mt-12 lg:hidden">
              <button 
                onClick={() => setViewMode('list')}
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
              >
                Ouvrir la liste
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Visionneuse;
