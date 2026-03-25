import { useState, useEffect, useCallback, useRef } from 'react';
import './Visionneuse.css';

const DRIVE_CONFIG = {
  apiKey: 'AIzaSyBA2lV9mm9_tNIpErOd9yO5lMjlIYtlCwM',
  folderId: '1hXzaOpzsBJSwESAugAwutJc7oaR8Ou17'
};

const CLASS_PASSWORDS = {
  '3D1': 'aqwse',
  '3D2': 'zsxdr',
  'DA3': 'edcft',
  'Prof': 'prof01',
};

const Visionneuse = () => {
  const [data, setData] = useState({ courses: {}, tips: [] });
  const [loading, setLoading] = useState(true);
  const [userClass, setUserClass] = useState(() => sessionStorage.getItem('blender_group'));
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Login State
  const [loginState, setLoginState] = useState('selection'); // 'selection' or 'password'
  const [pendingClass, setPendingClass] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // PDF.js State for Mobile
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else if (userClass) setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userClass]);

  const toggleFolder = (id) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchGoogleDriveData = useCallback(async () => {
    try {
      const apiKey = DRIVE_CONFIG.apiKey;
      const rootFolderId = DRIVE_CONFIG.folderId;
      
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

      const rootContents = await getFolderContents(rootFolderId);
      const finalData = { courses: {}, tips: [] };
      let mainFolderFound = false;

      // Strategy 1: Look for 'Années' or 'Cours' folder
      for (const item of rootContents) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const nameLower = item.name.toLowerCase().trim();
          if (nameLower.includes('anné') || nameLower === 'cours') {
            mainFolderFound = true;
            const years = await getFolderContents(item.id);
            for (const year of years) {
              if (year.mimeType === 'application/vnd.google-apps.folder') {
                finalData.courses[year.name] = await buildTree(year.id, year.name);
              }
            }
          }
        }
      }

      // Fallback 1: Check root items if they are year folders (4 digits)
      if (!mainFolderFound) {
        for (const item of rootContents) {
          if (item.mimeType === 'application/vnd.google-apps.folder' && /^\d{4}$/.test(item.name)) {
            finalData.courses[item.name] = await buildTree(item.id, item.name);
            mainFolderFound = true;
          }
        }
      }

      // Fallback 2: Default container
      if (!mainFolderFound) {
        finalData.courses["Défaut"] = await buildTree(rootFolderId, "Défaut");
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

  // PDF.js Rendering Logic for Mobile
  const renderPage = useCallback(async (num, doc) => {
    if (!doc || !canvasRef.current || isRendering) return;
    
    setIsRendering(true);
    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await doc.getPage(num);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const viewport = page.getViewport({ scale: 2 });
      const wrapperWidth = canvas.parentElement.clientWidth - 20;
      const displayScale = wrapperWidth / viewport.width;
      const finalViewport = page.getViewport({ scale: displayScale * 2 });

      canvas.height = finalViewport.height;
      canvas.width = finalViewport.width;
      canvas.style.width = `${wrapperWidth}px`;
      canvas.style.height = 'auto';

      const renderContext = {
        canvasContext: ctx,
        viewport: finalViewport
      };
      
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      
      await renderTask.promise;
      setIsRendering(false);
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error("PDF Render Error:", err);
      }
      setIsRendering(false);
    }
  }, [isRendering]);

  useEffect(() => {
    if (selectedFile && isMobile && selectedFile.path.toLowerCase().endsWith('.pdf')) {
      const loadPDF = async () => {
        try {
          const loadingTask = window.pdfjsLib.getDocument(selectedFile.path);
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setPageCount(doc.numPages);
          setPageNum(1);
          renderPage(1, doc);
        } catch (err) {
          console.error("PDF.js Load Error:", err);
        }
      };
      loadPDF();
    } else {
      setPdfDoc(null);
    }
  }, [selectedFile, isMobile, renderPage]);

  // Logic to filter data based on userClass
  const getFilteredTree = () => {
    if (!userClass || !data.courses) return [];

    const years = Object.keys(data.courses).sort((a, b) => b - a);
    
    if (userClass === 'Prof') {
      return years.map(year => ({
        type: 'folder',
        id: year,
        name: `Année ${year}-${parseInt(year) + 1}`,
        children: data.courses[year]
      }));
    } else {
      // Student Mode: Only latest year, filtered by class name
      if (years.length === 0) return [];
      const latestYear = years[0];
      const items = data.courses[latestYear];
      
      // If it's the default tree, show it all
      if (latestYear === 'Défaut') return items;

      // Otherwise find the class folder
      const classFolder = items.find(item => item.name === userClass && item.type === 'folder');
      return classFolder ? classFolder.children : [];
    }
  };

  const handleLogin = () => {
    if (CLASS_PASSWORDS[pendingClass] === passwordInput) {
      setUserClass(pendingClass);
      sessionStorage.setItem('blender_group', pendingClass);
      setLoginState('selection');
      setPendingClass(null);
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Mot de passe incorrect');
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    if (isMobile) setSidebarOpen(false);
  };

  const handleSwitchClass = () => {
    setUserClass(null);
    sessionStorage.removeItem('blender_group');
    setSelectedFile(null);
  };

  const renderTree = (items) => {
    if (!items) return null;

    return items.map((item) => {
      const isExpanded = expandedFolders[item.id];
      const isFile = item.type === 'file';
      const isActive = selectedFile?.id === item.id;

      if (isFile) {
        return (
          <li key={item.id} className="course-item">
            <div className="course-item-container">
              <a 
                href="#" 
                className={`course-link ${isActive ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleSelectFile(item); }}
              >
                {item.name.replace('.pdf', '')}
              </a>
            </div>
          </li>
        );
      } else {
        return (
          <li key={item.id} className="course-item">
            <div className={`folder-header ${isExpanded ? 'open' : ''}`} onClick={() => toggleFolder(item.id)}>
              <span className="folder-icon">▶</span>
              <span className="folder-name">{item.name}</span>
            </div>
            {isExpanded && (
              <ul className="submenu">
                {renderTree(item.children)}
              </ul>
            )}
          </li>
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="blender-viewer" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Connexion à Google Drive...</p>
      </div>
    );
  }

  // If not logged in, show Overlay
  if (!userClass) {
    return (
      <div className="blender-viewer" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="login-overlay" style={{ display: 'flex', position: 'relative' }}>
          <div className="login-box">
            {loginState === 'selection' ? (
              <>
                <h2>Sélectionnez votre classe</h2>
                <p>Choisissez votre classe pour accéder aux cours.</p>
                <div id="class-selection" style={{ display: 'grid' }}>
                  {['3D1', '3D2', 'DA3'].map(c => (
                    <button key={c} className="class-button" onClick={() => { setPendingClass(c); setLoginState('password'); }}>
                      {c}
                    </button>
                  ))}
                  <button className="class-button prof-button" onClick={() => { setPendingClass('Prof'); setLoginState('password'); }}>
                    Professeur
                  </button>
                </div>
              </>
            ) : (
              <div id="password-section">
                <h2>Authentification</h2>
                <p>Entrez le mot de passe pour {pendingClass}</p>
                <input 
                  type="password" 
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '1rem', padding: '1rem' }}
                  placeholder="Mot de passe"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
                <button className="class-button" style={{ width: '100%' }} onClick={handleLogin}>Entrer</button>
                <button className="secondary-button" onClick={() => { setLoginState('selection'); setLoginError(''); }}>Retour</button>
                {loginError && <p className="error-msg">{loginError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredTree = getFilteredTree();

  return (
    <div className="blender-viewer">
      <button 
        className={`sidebar-toggle-open ${!sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(true)}
      >
        ▶
      </button>

      <nav className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <button className="sidebar-toggle-close" onClick={() => setSidebarOpen(false)}>×</button>
        <div className="brand">
          <span>3D</span> Blender
        </div>
        <div className="brand-subtitle">
          Cours créé par Olivier Sudermann<br/>
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
            {userClass === 'Prof' ? 'Mode Professeur - Accès Total' : `Cours ${userClass}`}
          </span>
        </div>

        <button className="switch-class-button" onClick={handleSwitchClass}>
          Changer de classe
        </button>

        <div className="sidebar-scroll">
          <div className="menu-label">Liste des cours</div>
          <ul className="course-list">
            {renderTree(filteredTree)}
          </ul>

          <div className="menu-label" style={{ marginTop: '2rem' }}>3D Tips</div>
          <ul className="course-list">
            {renderTree(data.tips)}
          </ul>
        </div>

        <div className="sidebar-footer">
          <a href="https://oliviersudermann.wixsite.com/olivier-sudermann" target="_blank" rel="noopener noreferrer">
            Cours réalisé par Olivier Sudermann
          </a>
        </div>
      </nav>

      <main className="main-content">
        {!selectedFile ? (
          <div className="empty-state">
            <h2>Bienvenue au cours de Blender</h2>
            <p>Sélectionnez le cours dans le menu de gauche pour commencer.</p>
          </div>
        ) : (
          <>
            {isMobile && selectedFile.path.toLowerCase().endsWith('.pdf') ? (
              <div id="mobile-pdf-container">
                <div id="mobile-viewer-controls">
                  <button onClick={() => { if(pageNum > 1) { setPageNum(pageNum-1); renderPage(pageNum-1, pdfDoc); } }}>Précédent</button>
                  <div className="mobile-center-controls">
                    <button id="fullscreen-btn" onClick={() => canvasRef.current?.requestFullscreen()}>⛶</button>
                    <span id="page-info">Page {pageNum} / {pageCount}</span>
                  </div>
                  <button onClick={() => { if(pageNum < pageCount) { setPageNum(pageNum+1); renderPage(pageNum+1, pdfDoc); } }}>Suivant</button>
                </div>
                <div id="pdf-canvas-wrapper">
                  {isRendering && <div className="spinner" style={{ margin: '20px auto' }}></div>}
                  <canvas ref={canvasRef} id="pdf-canvas"></canvas>
                </div>
              </div>
            ) : (
              <div id="pdf-container">
                <iframe 
                  src={selectedFile.path} 
                  title="Viewer Mixer"
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Visionneuse;
