import { useState, useEffect, useCallback, useRef } from 'react';
import './Visionneuse.css';

const DRIVE_CONFIG = {
  apiKey: 'AIzaSyBA2lV9mm9_tNIpErOd9yO5lMjlIYtlCwM',
  folderId: '1hXzaOpzsBJSwESAugAwutJc7oaR8Ou17'
};

const Visionneuse = () => {
  const [data, setData] = useState({ courses: {}, tips: [] });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
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
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      const viewport = page.getViewport({ scale: 2 }); // Higher scale for clarity
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
      // Load PDF via PDF.js for mobile
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

  const handleNextPage = () => {
    if (pageNum < pageCount) {
      const next = pageNum + 1;
      setPageNum(next);
      renderPage(next, pdfDoc);
    }
  };

  const handlePrevPage = () => {
    if (pageNum > 1) {
      const prev = pageNum - 1;
      setPageNum(prev);
      renderPage(prev, pdfDoc);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    if (isMobile) setSidebarOpen(false);
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

  const years = Object.keys(data.courses).sort((a, b) => b - a);
  const courseTree = years.map(year => ({
    type: 'folder',
    id: year,
    name: `Année ${year}-${parseInt(year) + 1}`,
    children: data.courses[year]
  }));

  if (loading) {
    return (
      <div className="blender-viewer" style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cahrgement du cours Blender...</p>
      </div>
    );
  }

  return (
    <div className="blender-viewer">
      {/* Sidebar Toggle Open (Mobile) */}
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
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Mode Professeur - Accès Total</span>
        </div>

        <div className="sidebar-scroll">
          <div className="menu-label">Liste des cours</div>
          <ul className="course-list">
            {renderTree(courseTree)}
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
            {/* Hybrid Viewer */}
            {isMobile && selectedFile.path.toLowerCase().endsWith('.pdf') ? (
              <div id="mobile-pdf-container">
                <div id="mobile-viewer-controls">
                  <button onClick={handlePrevPage}>Précédent</button>
                  <div className="mobile-center-controls">
                    <button id="fullscreen-btn" onClick={() => canvasRef.current?.requestFullscreen()}>⛶</button>
                    <span id="page-info">Page {pageNum} / {pageCount}</span>
                  </div>
                  <button onClick={handleNextPage}>Suivant</button>
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
