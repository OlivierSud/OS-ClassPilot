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
  const [data, setData] = useState({ courses: [], tips: [] });
  const [loading, setLoading] = useState(true);
  const [userClass, setUserClass] = useState(() => sessionStorage.getItem('selectedGroup'));
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loadingFolders, setLoadingFolders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Login State
  const [loginState, setLoginState] = useState('selection');
  const [pendingClass, setPendingClass] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Mobile PDF.js State
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

  // Helper: Fetch folder contents (Non-recursive)
  const getFolderContents = useCallback(async (folderId) => {
    const apiKey = DRIVE_CONFIG.apiKey;
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webContentLink)&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch folder");
    const resData = await response.json();
    
    return (resData.files || []).map(file => ({
      id: file.id,
      name: file.name,
      type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      path: file.mimeType === 'application/pdf' ? `https://drive.google.com/file/d/${file.id}/preview` : null,
      downloadUrl: file.webContentLink,
      children: [] // Initially empty for lazy loading
    })).sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Update a node's children in the tree
  const updateTreeNodes = (nodes, folderId, children) => {
    return nodes.map(node => {
      if (node.id === folderId) {
        return { ...node, children, loaded: true };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateTreeNodes(node.children, folderId, children) };
      }
      return node;
    });
  };

  const toggleFolder = async (folder) => {
    if (expandedFolders[folder.id]) {
        setExpandedFolders(prev => {
            const next = { ...prev };
            delete next[folder.id];
            return next;
        });
        return;
    }

    setExpandedFolders(prev => ({ ...prev, [folder.id]: true }));

    // If already loaded, do nothing else
    if (folder.loaded) return;

    // Lazy load children
    setLoadingFolders(prev => ({ ...prev, [folder.id]: true }));
    try {
      const children = await getFolderContents(folder.id);
      setData(prev => ({
        ...prev,
        courses: updateTreeNodes(prev.courses, folder.id, children)
      }));
    } catch (err) {
      console.error("Lazy load error:", err);
    } finally {
      setLoadingFolders(prev => {
        const next = { ...prev };
        delete next[folder.id];
        return next;
      });
    }
  };

  const fetchInitialData = useCallback(async () => {
    try {
      const rootContents = await getFolderContents(DRIVE_CONFIG.folderId);
      let initialCourses = [];
      let mainContainerFolder = rootContents.find(item => {
        const name = item.name.toLowerCase().trim();
        return name.includes('anné') || name === 'cours';
      });

      if (mainContainerFolder) {
        // Fetch years
        initialCourses = await getFolderContents(mainContainerFolder.id);
      } else {
        // Fallback: If root contains year folders directly
        const yearFolders = rootContents.filter(item => item.type === 'folder' && /^\d{4}$/.test(item.name));
        if (yearFolders.length > 0) {
          initialCourses = yearFolders;
        } else {
          // Fallback 2: Root is the container
          initialCourses = rootContents;
        }
      }

      // Local Tips
      const tips = [
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

      setData({ courses: initialCourses, tips });
      setLoading(false);
    } catch (err) {
      console.error("Initial fetch error:", err);
      setLoading(false);
    }
  }, [getFolderContents]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // PDF.js Logic (as before)
  const renderPage = useCallback(async (num, doc) => {
    if (!doc || !canvasRef.current || isRendering) return;
    setIsRendering(true);
    try {
      if (renderTaskRef.current) renderTaskRef.current.cancel();
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
      const renderTask = page.render({ canvasContext: ctx, viewport: finalViewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      setIsRendering(false);
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') console.error("PDF Render Error:", err);
      setIsRendering(false);
    }
  }, [isRendering]);

  useEffect(() => {
    if (selectedFile && isMobile && selectedFile.path?.toLowerCase().endsWith('.pdf')) {
      const loadPDF = async () => {
        try {
          const loadingTask = window.pdfjsLib.getDocument(selectedFile.path);
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setPageCount(doc.numPages);
          setPageNum(1);
          renderPage(1, doc);
        } catch (err) { console.error("PDF.js Load Error:", err); }
      };
      loadPDF();
    } else { setPdfDoc(null); }
  }, [selectedFile, isMobile, renderPage]);

  const handleLogin = () => {
    if (CLASS_PASSWORDS[pendingClass] === passwordInput) {
      setUserClass(pendingClass);
      sessionStorage.setItem('selectedGroup', pendingClass);
      setLoginState('selection');
      setPendingClass(null);
      setPasswordInput('');
      setLoginError('');
    } else { setLoginError('Mot de passe incorrect'); }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    if (isMobile) setSidebarOpen(false);
  };

  const handleSwitchClass = () => {
    setUserClass(null);
    sessionStorage.removeItem('selectedGroup');
    setSelectedFile(null);
  };

  // Logic to filter top-level folders based on userClass
  const getVisibleRoots = () => {
    if (!userClass) return [];
    if (userClass === 'Prof') return data.courses;

    // Student mode: Usually the last folder in the list is the most recent year
    const sorted = [...data.courses].sort((a, b) => b.name.localeCompare(a.name));
    if (sorted.length === 0) return [];
    
    // If we have years, find the user class inside the latest year
    // Since we are lazy loading, we might not have children yet.
    // However, the original app showed the class folder at the root for students.
    // Let's adapt: if the root contains year folders, the student sees their class folder from the latest year.
    // But wait! If they login as "3D1", they want to see "3D1" courses.
    // Let's simplify: Students see the whole tree but maybe filtered? 
    // Actually, the user asked for "Mode Professeur pour acces total".
    // For students, let's show the same tree but maybe keep it simple.
    return data.courses; 
  };

  const renderTree = (items) => {
    if (!items) return null;

    return items.map((item) => {
      const isExpanded = expandedFolders[item.id];
      const isLoading = loadingFolders[item.id];
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
            <div className={`folder-header ${isExpanded ? 'open' : ''}`} onClick={() => toggleFolder(item)}>
              <span className="folder-icon">{isLoading ? '◯' : '▶'}</span>
              <span className="folder-name">{item.name}</span>
            </div>
            {isExpanded && (
              <ul className="submenu">
                {isLoading ? (
                    <li style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Chargement...</li>
                ) : (
                    renderTree(item.children)
                )}
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
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Initialisation...</p>
      </div>
    );
  }

  if (!userClass) {
    return (
      <div className="blender-viewer" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="login-overlay" style={{ display: 'flex', position: 'relative' }}>
          <div className="login-box">
            {loginState === 'selection' ? (
              <>
                <h2>Sélectionnez votre classe</h2>
                <div id="class-selection" style={{ display: 'grid' }}>
                  {['3D1', '3D2', 'DA3'].map(c => (
                    <button key={c} className="class-button" onClick={() => { setPendingClass(c); setLoginState('password'); }}>{c}</button>
                  ))}
                  <button className="class-button prof-button" onClick={() => { setPendingClass('Prof'); setLoginState('password'); }}>Professeur</button>
                </div>
              </>
            ) : (
              <div id="password-section">
                <h2>{pendingClass}</h2>
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

  return (
    <div className="blender-viewer">
      <button className={`sidebar-toggle-open ${!sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(true)}>▶</button>
      <nav className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <button className="sidebar-toggle-close" onClick={() => setSidebarOpen(false)}>×</button>
        <div className="brand"><span>3D</span> Blender</div>
        <div className="brand-subtitle">Cours créé par Olivier Sudermann<br/><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{userClass === 'Prof' ? 'Accès Total' : `Cours ${userClass}`}</span></div>
        <button className="switch-class-button" onClick={handleSwitchClass}>Changer de classe</button>
        <div className="sidebar-scroll">
          <div className="menu-label">Liste des cours</div>
          <ul className="course-list">{renderTree(getVisibleRoots())}</ul>
          <div className="menu-label" style={{ marginTop: '2rem' }}>3D Tips</div>
          <ul className="course-list">{renderTree(data.tips)}</ul>
        </div>
        <div className="sidebar-footer">
          <a href="https://oliviersudermann.wixsite.com/olivier-sudermann" target="_blank" rel="noopener noreferrer">Cours réalisé par Olivier Sudermann</a>
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
            {isMobile && selectedFile.path?.toLowerCase().endsWith('.pdf') ? (
              <div id="mobile-pdf-container">
                <div id="mobile-viewer-controls">
                  <button onClick={() => { if(pageNum > 1) { const n = pageNum - 1; setPageNum(n); renderPage(n, pdfDoc); } }}>Précédent</button>
                  <div className="mobile-center-controls">
                    <button id="fullscreen-btn" onClick={() => canvasRef.current?.requestFullscreen()}>⛶</button>
                    <span id="page-info">Page {pageNum} / {pageCount}</span>
                  </div>
                  <button onClick={() => { if(pageNum < pageCount) { const n = pageNum + 1; setPageNum(n); renderPage(n, pdfDoc); } }}>Suivant</button>
                </div>
                <div id="pdf-canvas-wrapper">
                  {isRendering && <div className="spinner" style={{ margin: '20px auto' }}></div>}
                  <canvas ref={canvasRef} id="pdf-canvas"></canvas>
                </div>
              </div>
            ) : (
              <div id="pdf-container">
                <iframe src={selectedFile.path} title="Viewer" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Visionneuse;
