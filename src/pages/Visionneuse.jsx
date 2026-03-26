import { useState, useEffect, useCallback, useRef } from 'react';
import './Visionneuse.css';

const DRIVE_CONFIG = {
  apiKey: 'AIzaSyBA2lV9mm9_tNIpErOd9yO5lMjlIYtlCwM',
  folderId: '1hXzaOpzsBJSwESAugAwutJc7oaR8Ou17'
};

const Visionneuse = () => {
  const [data, setData] = useState({ courses: [], tips: [] });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loadingFolders, setLoadingFolders] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [viewMode, setViewMode] = useState('page'); // 'page' | 'scroll'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const renderTaskRef = useRef(null);
  const mainContentRef = useRef(null);

  // Pinch-to-zoom state (refs for 60fps, no re-renders during gesture)
  const zoomRef = useRef({ scale: 1, translateX: 0, translateY: 0 });
  const lastTouchRef = useRef(null);
  const lastTapRef = useRef(0);

  // Refs stables pour la navigation par swipe (évite les closures périmées)
  const pageNumRef = useRef(1);
  const pageCountRef = useRef(0);
  const pdfDocRef = useRef(null);
  const navigatePageRef = useRef(null);

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
        initialCourses = await getFolderContents(mainContainerFolder.id);
      } else {
        const yearFolders = rootContents.filter(item => item.type === 'folder' && /^\d{4}$/.test(item.name));
        if (yearFolders.length > 0) {
          initialCourses = yearFolders;
        } else {
          initialCourses = rootContents;
        }
      }

      // Local Tips
      const baseUrl = import.meta.env.BASE_URL || '/';
      const tips = [
        {
          type: 'file',
          id: 'tip-1',
          name: 'Interface et base de modélisation',
          path: `${baseUrl}visionneuse/Tips/Interface et base de modélisation.pdf`
        },
        {
          type: 'file',
          id: 'tip-2',
          name: 'Raccourcis clavier',
          path: `${baseUrl}visionneuse/Tips/Raccourcis clavier/index.html`
        },
      ]; Auto - expand the newest year(optional)
      if (initialCourses.length > 0) {
        const newest = initialCourses.sort((a, b) => b.name.localeCompare(a.name))[0];
        // We'll expand it in the next frame to avoid issues
        setTimeout(() => toggleFolder(newest), 100);
      }
    } catch (err) {
      console.error("Initial fetch error:", err);
      setLoading(false);
    }
  }, [getFolderContents]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Sync des refs de navigation (mis à jour à chaque render, pas de useEffect)
  pageNumRef.current = pageNum;
  pageCountRef.current = pageCount;
  pdfDocRef.current = pdfDoc;
  navigatePageRef.current = (delta) => {
    const newPage = pageNumRef.current + delta;
    if (newPage >= 1 && newPage <= pageCountRef.current && pdfDocRef.current) {
      setPageNum(newPage);
      renderPage(newPage, pdfDocRef.current);
    }
  };

  // Ref for rendering flag to avoid infinite loops in useCallback
  const isRenderingRef = useRef(false);
  const [renderingState, setRenderingState] = useState(false); // Only for UI spinner

  // PDF.js Rendering Logic for Mobile
  const renderPage = useCallback(async (num, doc) => {
    if (!doc || !canvasRef.current || isRenderingRef.current) return;

    isRenderingRef.current = true;
    setRenderingState(true);
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
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error("PDF Render Error:", err);
      }
    } finally {
      isRenderingRef.current = false;
      setRenderingState(false);
    }
  }, []);

  // Load PDF when file or mode changes
  useEffect(() => {
    let active = true;
    const isPDF = selectedFile?.path?.toLowerCase().includes('.pdf') || selectedFile?.path?.includes('/preview');
    if (selectedFile && viewMode === 'page' && isPDF) {
      const loadPDF = async () => {
        try {
          // For Google Drive preview URLs, extract direct media URL
          let pdfUrl = selectedFile.path;
          if (pdfUrl.includes('drive.google.com') && pdfUrl.includes('/preview')) {
            const fileId = pdfUrl.split('/d/')[1].split('/')[0];
            pdfUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${DRIVE_CONFIG.apiKey}`;
          }
          const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
          const doc = await loadingTask.promise;
          if (!active) return;
          setPdfDoc(doc);
          setPageCount(doc.numPages);
          setPageNum(1);
          // Small delay so the canvas is mounted
          setTimeout(() => renderPage(1, doc), 50);
        } catch (err) {
          if (active) console.error("PDF.js Load Error:", err);
        }
      };
      loadPDF();
    } else {
      setPdfDoc(null);
    }
    return () => { active = false; };
  }, [selectedFile, viewMode, renderPage]);

  // Reset page on file change
  useEffect(() => {
    setPageNum(1);
  }, [selectedFile]);

  // Fullscreen API
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mainContentRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // ── Pinch-to-zoom & pan on canvas wrapper ──────────────────────────────
  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const getDistance = (t1, t2) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getMidpoint = (t1, t2) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const applyTransform = () => {
      const { scale, translateX, translateY } = zoomRef.current;
      if (canvasRef.current) {
        canvasRef.current.style.transform =
          `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        canvasRef.current.style.transformOrigin = 'center top';
      }
    };

    const resetZoom = () => {
      zoomRef.current = { scale: 1, translateX: 0, translateY: 0 };
      applyTransform();
    };

    let initialDist = null;
    let initialScale = 1;
    let initialMid = null;
    let initialTranslate = { x: 0, y: 0 };
    let isPinching = false;
    let panStart = null;
    let panTranslate = { x: 0, y: 0 };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        panStart = null;
        initialDist = getDistance(e.touches[0], e.touches[1]);
        initialMid = getMidpoint(e.touches[0], e.touches[1]);
        initialScale = zoomRef.current.scale;
        initialTranslate = { x: zoomRef.current.translateX, y: zoomRef.current.translateY };
      } else if (e.touches.length === 1 && !isPinching) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          resetZoom();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panTranslate = { x: zoomRef.current.translateX, y: zoomRef.current.translateY };
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDist !== null) {
        e.preventDefault();
        const newDist = getDistance(e.touches[0], e.touches[1]);
        const newScale = Math.min(5, Math.max(0.5, initialScale * (newDist / initialDist)));
        const newMid = getMidpoint(e.touches[0], e.touches[1]);
        const dx = newMid.x - initialMid.x;
        const dy = newMid.y - initialMid.y;
        zoomRef.current = {
          scale: newScale,
          translateX: initialTranslate.x + dx,
          translateY: initialTranslate.y + dy,
        };
        applyTransform();
      } else if (e.touches.length === 1 && panStart && zoomRef.current.scale > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - panStart.x;
        const dy = e.touches[0].clientY - panStart.y;
        zoomRef.current = {
          ...zoomRef.current,
          translateX: panTranslate.x + dx,
          translateY: panTranslate.y + dy,
        };
        applyTransform();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        isPinching = false;
        initialDist = null;
        if (zoomRef.current.scale < 1) resetZoom();
      }
      if (e.touches.length === 0) {
        // Swipe horizontal → navigation entre pages (seulement si pas zoomé)
        if (panStart && Math.abs(zoomRef.current.scale - 1) < 0.15) {
          const touch = e.changedTouches[0];
          const deltaX = touch.clientX - panStart.x;
          const deltaY = touch.clientY - panStart.y;
          // Swipe valide : > 50px et plus horizontal que vertical
          if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            navigatePageRef.current?.(deltaX < 0 ? 1 : -1);
          }
        }
        panStart = null;
      }
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
    };
  }, [viewMode, selectedFile]);

  // Reset zoom when file or mode changes
  useEffect(() => {
    zoomRef.current = { scale: 1, translateX: 0, translateY: 0 };
    if (canvasRef.current) canvasRef.current.style.transform = '';
  }, [selectedFile, viewMode]);

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    if (isMobile) setSidebarOpen(false);
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
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Ouverture de la bibliothèque Blender...</p>
      </div>
    );
  }

  return (
    <div className="blender-viewer">
      <button
        className={`fab-menu ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="16" y2="12"></line>
              <line x1="4" y1="18" x2="11" y2="18"></line>
            </>
          )}
        </svg>
      </button>
      <nav className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <div className="brand"><span>3D</span> Blender</div>
        <div className="brand-subtitle">Cours créé par Olivier Sudermann<br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Accès Total (Professeur)</span></div>
        <div className="sidebar-scroll">
          <div className="menu-label">Liste des cours</div>
          <ul className="course-list">{renderTree(data.courses)}</ul>
          <div className="menu-label" style={{ marginTop: '2rem' }}>3D Tips</div>
          <ul className="course-list">{renderTree(data.tips)}</ul>
        </div>
        <div className="sidebar-footer">
          <a href="https://oliviersudermann.wixsite.com/olivier-sudermann" target="_blank" rel="noopener noreferrer">Cours réalisé par Olivier Sudermann</a>
        </div>
      </nav>
      <main className="main-content" ref={mainContentRef}>
        {!selectedFile ? (
          <div className="empty-state">
            <h2>Bienvenue au cours de Blender</h2>
            <p>Sélectionnez le cours dans le menu de gauche pour commencer.</p>
          </div>
        ) : (
          <>
            {/* ─── Toolbar ─────────────────────────────────────── */}
            <div className="viewer-toolbar">
              <span className="viewer-filename">{selectedFile.name.replace('.pdf', '')}</span>
              <div className="viewer-toolbar-actions">
                {/* View Mode Toggle */}
                <div className="view-mode-toggle">
                  <button
                    className={`vt-btn ${viewMode === 'page' ? 'active' : ''}`}
                    onClick={() => setViewMode('page')}
                    title="Page par page"
                  >
                    □
                  </button>
                  <button
                    className={`vt-btn ${viewMode === 'scroll' ? 'active' : ''}`}
                    onClick={() => setViewMode('scroll')}
                    title="Défilement continu"
                  >
                    ☰
                  </button>
                </div>
                {/* Download */}
                <a
                  href={selectedFile.downloadUrl || selectedFile.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="vt-btn"
                  title="Télécharger"
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </a>
                {/* Fullscreen */}
                <button className="vt-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}>
                  {isFullscreen ? '❐' : '⛶'}
                </button>
              </div>
            </div>

            {/* ─── Viewer ──────────────────────────────────────── */}
            {viewMode === 'page' ? (
              <div id="mobile-pdf-container" style={{ display: 'flex' }}>
                <div id="pdf-canvas-wrapper" ref={canvasWrapperRef}>
                  {renderingState && <div className="spinner" style={{ margin: '20px auto' }}></div>}
                  {pageCount > 1 && (
                    <div className="page-indicator">
                      {pageNum} / {pageCount}
                    </div>
                  )}
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
