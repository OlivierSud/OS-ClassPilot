document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.getElementById('pdf-viewer');
    const emptyState = document.getElementById('empty-state');
    const pdfContainer = document.getElementById('pdf-container');
    const courseListContainer = document.getElementById('course-list');

    // Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close');
    const sidebarOpenBtn = document.getElementById('sidebar-open');

    if (sidebarCloseBtn && sidebarOpenBtn && sidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.classList.add('closed');
            sidebarOpenBtn.classList.add('visible');
        });

        sidebarOpenBtn.addEventListener('click', () => {
            sidebar.classList.remove('closed');
            sidebarOpenBtn.classList.remove('visible');
        });
    }

    // Function to render the menu recursively
    function renderMenu(items, container, isProf = false) {
        if (!items || items.length === 0) return;

        items.forEach(item => {
            // Check visibility (explicitly false means hidden, default true)
            // PROF MODE: Ignore visibility and show everything
            if (item.visibility === false && !isProf) return;

            const li = document.createElement('li');
            li.classList.add('course-item');

            if (item.type === 'folder') {
                // Folder logic
                const folderHeader = document.createElement('div');
                folderHeader.classList.add('folder-header');

                // Icon and Name
                folderHeader.innerHTML = `
                    <span class="folder-icon">▶</span>
                    <span class="folder-name">${item.name}</span>
                `;

                // Submenu container (hidden by default)
                const submenu = document.createElement('ul');
                submenu.classList.add('submenu');
                submenu.style.display = 'none'; // Initially collapsed

                // Toggle click
                folderHeader.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent bubbling
                    const isExpanded = submenu.style.display === 'block';
                    submenu.style.display = isExpanded ? 'none' : 'block';
                    folderHeader.classList.toggle('open', !isExpanded);
                });

                li.appendChild(folderHeader);
                li.appendChild(submenu);
                container.appendChild(li);

                // Recursively render children
                renderMenu(item.children, submenu, isProf);

            } else if (item.type === 'file') {
                // File link logic wrapper
                const itemContainer = document.createElement('div');
                itemContainer.classList.add('course-item-container');

                const link = document.createElement('a');
                link.href = '#'; // Prevent default nav
                link.classList.add('course-link');
                link.setAttribute('data-src', item.path);
                link.textContent = item.name.replace('.pdf', ''); // Remove extension for cleaner look

                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    // This click is handled by the global listener at the end of DOMContentLoaded
                });

                itemContainer.appendChild(link);

                // Action Icon (Download or Share)
                const actionBtn = document.createElement('a');
                actionBtn.classList.add('course-action-btn');

                // Improved PDF detection: check path extension OR filename
                const isPDF = item.path.toLowerCase().endsWith('.pdf') ||
                    item.name.toLowerCase().endsWith('.pdf') ||
                    (item.downloadUrl && item.downloadUrl.includes('pdf'));

                if (isPDF) {
                    actionBtn.innerHTML = '⤓';
                    actionBtn.title = 'Télécharger le PDF';

                    const downloadUrl = item.downloadUrl || item.path;
                    actionBtn.href = downloadUrl; // Set default href for right-click/fallback

                    actionBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        itemContainer.classList.add('loading');
                        actionBtn.style.pointerEvents = 'none';
                        const startTime = Date.now();

                        // If it's a dynamic Drive link, just open it in a new tab to trigger download
                        if (item.downloadUrl) {
                            window.open(item.downloadUrl, '_blank');

                            // Visual feedback
                            setTimeout(() => {
                                itemContainer.classList.remove('loading');
                                itemContainer.classList.add('success');
                                setTimeout(() => {
                                    itemContainer.classList.remove('success');
                                    actionBtn.style.pointerEvents = 'auto';
                                }, 2000);
                            }, 600);
                            return;
                        }

                        // Local file logic: force download via fetch (existing logic)
                        try {
                            // Properly encode path for fetch
                            const encodedPath = item.path.split('/').map(segment => encodeURIComponent(segment)).join('/');
                            const fetchUrl = new URL(encodedPath, window.location.href).href;

                            const response = await fetch(fetchUrl);
                            if (!response.ok) throw new Error('Network response was not ok');

                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = item.name;
                            document.body.appendChild(a);
                            a.click();

                            // Ensure animation is seen (at least 600ms)
                            const elapsedTime = Date.now() - startTime;
                            const remainingTime = Math.max(0, 600 - elapsedTime);

                            setTimeout(() => {
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);

                                itemContainer.classList.remove('loading');
                                itemContainer.classList.add('success');
                                setTimeout(() => {
                                    itemContainer.classList.remove('success');
                                    actionBtn.style.pointerEvents = 'auto';
                                }, 2000);
                            }, remainingTime);

                        } catch (err) {
                            console.error('Erreur lors du téléchargement forcé :', err);
                            itemContainer.classList.remove('loading');
                            itemContainer.classList.add('error');

                            setTimeout(() => {
                                itemContainer.classList.remove('error');
                                actionBtn.style.pointerEvents = 'auto';
                                // Try standard download as fallback
                                const a = document.createElement('a');
                                a.href = item.path;
                                a.download = item.name;
                                a.target = '_blank';
                                a.click();
                            }, 1500);
                        }
                    });
                } else {
                    actionBtn.innerHTML = '🔗'; // Share icon
                    actionBtn.title = 'Copier le lien direct';
                    actionBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Get absolute URL of the file
                        const fullUrl = new URL(item.path, window.location.href).href;

                        navigator.clipboard.writeText(fullUrl).then(() => {
                            const originalHTML = actionBtn.innerHTML;
                            actionBtn.innerHTML = '✅';
                            setTimeout(() => {
                                actionBtn.innerHTML = originalHTML;
                            }, 2000);
                        }).catch(err => {
                            console.error('Erreur lors de la copie :', err);
                        });
                    });
                }

                itemContainer.appendChild(actionBtn);
                li.appendChild(itemContainer);
                container.appendChild(li);
            }
        });
    }

    // PDF.js State for Mobile
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const scale = window.devicePixelRatio || 1; // High DPI support
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    }

    async function renderPage(num) {
        pageRendering = true;
        const loader = document.getElementById('pdf-loader');
        if (loader) loader.style.display = 'flex';
        canvas.style.opacity = '0.3'; // Dim canvas during render

        const page = await pdfDoc.getPage(num);

        const wrapper = document.getElementById('pdf-canvas-wrapper');
        const containerWidth = wrapper.clientWidth - 20; // Some margin

        const unscaledViewport = page.getViewport({ scale: 1 });
        const fitScale = containerWidth / unscaledViewport.width;

        // Render at 2x the fit scale for high resolution
        const viewport = page.getViewport({ scale: fitScale * 2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Visual display size (CSS)
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = 'auto'; // Maintain aspect ratio

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        await renderTask.promise;
        pageRendering = false;

        if (loader) loader.style.display = 'none';
        canvas.style.opacity = '1';

        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }

        // Update UI
        document.getElementById('page-num').textContent = num;
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    // Global Loader Utilities
    const globalLoader = document.getElementById('global-loader');
    const showGlobalLoader = (message = 'Chargement du document...') => {
        if (globalLoader) {
            globalLoader.querySelector('p').textContent = message;
            globalLoader.style.display = 'flex';
        }
    };
    const hideGlobalLoader = () => {
        if (globalLoader) globalLoader.style.display = 'none';
    };

    async function loadPDFViewer(path, fileName) {
        showGlobalLoader();
        emptyState.style.display = 'none';
        pdfContainer.style.display = 'none';
        const mobileContainer = document.getElementById('mobile-pdf-container');
        mobileContainer.style.display = 'flex';

        const loader = document.getElementById('pdf-loader');
        if (loader) {
            loader.style.display = 'flex';
            loader.querySelector('p').textContent = 'Initialisation...';
        }
        canvas.style.opacity = '0'; // Hide canvas during initial fetch

        let finalPath = path;
        let fetchUrl = path;

        try {
            console.log("Mobile Viewer: Preparing document:", path);

            if (path.includes('drive.google.com')) {
                const fileId = path.split('/d/')[1].split('/')[0];
                const apiKey = window.DRIVE_CONFIG ? window.DRIVE_CONFIG.apiKey : '';
                fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
            } else {
                // Get the absolute path to the directory containing index.html
                const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

                // Robust encoding: split by / and encode each segment individually
                // e.g. "Tips/File 1.pdf" -> "Tips/File%201.pdf"
                const segments = path.split('/');
                const encodedSegments = segments.map(s => encodeURIComponent(s));
                const encodedPath = encodedSegments.join('/');

                // Construct the absolute URL
                fetchUrl = new URL(encodedPath, baseUrl).href;

                console.log("Diagnostic - Original path:", path);
                console.log("Diagnostic - Base URL:", baseUrl);
                console.log("Diagnostic - Encoded path:", encodedPath);
                console.log("Diagnostic - Final Fetch URL:", fetchUrl);
            }

            finalPath = fetchUrl; // Default to the encoded URL
            console.log("Mobile Viewer: Attempting to load from:", finalPath);

            // SPECIAL HANDLING FOR file:// PROTOCOL
            // Browsers block 'fetch' on file://, but PDF.js might still be able to load the direct path
            if (window.location.protocol !== 'file:') {
                try {
                    const response = await fetch(fetchUrl);
                    if (!response.ok) throw new Error(`Fetch status: ${response.status}`);
                    const blob = await response.blob();

                    if (window._currentMobilePdfBlob) URL.revokeObjectURL(window._currentMobilePdfBlob);
                    finalPath = URL.createObjectURL(blob);
                    window._currentMobilePdfBlob = finalPath;
                } catch (fetchErr) {
                    console.warn("Manual mobile blob fetch failed (likely CORS), falling back to direct URL.");
                }
            }

            try {
                const loadingTask = pdfjsLib.getDocument(finalPath);
                pdfDoc = await loadingTask.promise;
                document.getElementById('page-count').textContent = pdfDoc.numPages;

                pageNum = 1;
                await renderPage(pageNum);
                hideGlobalLoader();
            } catch (pdfJsErr) {
                // If PDF.js fails to initialize (often due to CORS on file://)
                // we silently fallback to the native iframe viewer.
                console.warn("PDF.js could not initialize, switching to native viewer:", pdfJsErr);

                hideGlobalLoader();
                emptyState.style.display = 'none';
                pdfContainer.style.display = 'block';
                document.getElementById('mobile-pdf-container').style.display = 'none';

                // Use the encoded URL for the native viewer
                viewer.src = fetchUrl;
            }
        } catch (error) {
            console.error('Unexpected error in loadPDFViewer:', error);
            if (loader) loader.style.display = 'none';
            hideGlobalLoader();

            // Emergency fallback
            emptyState.style.display = 'none';
            pdfContainer.style.display = 'block';
            document.getElementById('mobile-pdf-container').style.display = 'none';
            viewer.src = fetchUrl;
        }
    }

    // Swipe Navigation for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    const mobilePdfContainer = document.getElementById('mobile-pdf-container');
    if (mobilePdfContainer) {
        mobilePdfContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        mobilePdfContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const threshold = 50; // Minimum swipe distance
        const delta = touchEndX - touchStartX;

        if (Math.abs(delta) > threshold) {
            if (delta < 0) {
                // Swipe Left -> Next Page
                if (pdfDoc && pageNum < pdfDoc.numPages) {
                    pageNum++;
                    queueRenderPage(pageNum);
                }
            } else {
                // Swipe Right -> Previous Page
                if (pdfDoc && pageNum > 1) {
                    pageNum--;
                    queueRenderPage(pageNum);
                }
            }
        }
    }

    // Controls for Mobile Viewer
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (!pdfDoc || pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Fullscreen behavior for mobile
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            const container = document.getElementById('mobile-pdf-container');
            if (!document.fullscreenElement) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        });

        // Update icon based on state (optional but nice)
        document.addEventListener('fullscreenchange', () => {
            fullscreenBtn.innerHTML = document.fullscreenElement ? '❐' : '⛶';
        });
        document.addEventListener('webkitfullscreenchange', () => {
            fullscreenBtn.innerHTML = document.webkitFullscreenElement ? '❐' : '⛶';
        });
    }

    // Initialize Menu - Wait for Login
    document.addEventListener('login-success', () => {
        const renderApp = () => {
            if (window.COURSE_DATA) {
                console.log("Course Data Loaded. Source:", window.COURSE_DATA.isDrive ? "Google Drive" : "Local");
                console.log("Generated at:", window.COURSE_DATA.generatedAt);

                // Handle Data Structure (Object for years, or fallback Array for legacy)
                let rawCourses = window.COURSE_DATA.courses || window.COURSE_DATA;
                let courseData = [];

                // Handle Group filtering - prioritize sessionStorage (from login), then URL parameters
                let groupName = sessionStorage.getItem('selectedGroup');
                if (!groupName) {
                    const urlParams = new URLSearchParams(window.location.search);
                    groupName = urlParams.get('group');
                }

                if (groupName === 'Prof') {
                    // PROF MODE: Show everything, grouped by year folders
                    const brandSubtitle = document.querySelector('.brand-subtitle');
                    if (brandSubtitle) brandSubtitle.textContent = 'Mode Professeur - Archives Complètes';

                    if (typeof rawCourses === 'object' && !Array.isArray(rawCourses)) {
                        // Convert years object to folder structure
                        const years = Object.keys(rawCourses).sort((a, b) => b - a); // Newest first
                        courseData = years.map(year => ({
                            type: 'folder',
                            name: `Année ${year}-${parseInt(year) + 1}`,
                            children: rawCourses[year],
                            visibility: true
                        }));
                    } else {
                        courseData = rawCourses; // Legacy fallback
                    }
                } else if (groupName) {
                    // STUDENT MODE: Show only latest year for specific class
                    if (typeof rawCourses === 'object' && !Array.isArray(rawCourses)) {
                        const sortedYears = Object.keys(rawCourses).sort((a, b) => b - a);
                        if (sortedYears.length > 0) {
                            const latestYear = sortedYears[0];
                            const academicYear = `${latestYear}-${parseInt(latestYear) + 1}`;
                            const brandSubtitle = document.querySelector('.brand-subtitle');
                            if (brandSubtitle) brandSubtitle.textContent = `Cours ${groupName} - ${academicYear}`;

                            const groupFolder = rawCourses[latestYear].find(item => item.name === groupName && item.type === 'folder');
                            if (groupFolder) {
                                courseData = groupFolder.children;
                            } else {
                                console.warn(`Classe "${groupName}" non trouvée en ${latestYear}`);
                            }
                        }
                    } else {
                        // Legacy fallback filtering
                        const groupFolder = rawCourses.find(item => item.name === groupName && item.type === 'folder');
                        if (groupFolder) courseData = groupFolder.children;
                    }
                } else {
                    courseData = Array.isArray(rawCourses) ? rawCourses : [];
                }

                // Centralized click handling
                const handleLinkClick = (link, e) => {
                    const filePath = link.getAttribute('data-src');
                    const fileName = link.textContent.trim();
                    if (!filePath) return;

                    // Visual active state handling
                    document.querySelectorAll('.course-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Detection logic for PDF (Local or Drive Preview)
                    const isPDF = filePath.toLowerCase().includes('.pdf') || filePath.includes('/preview');

                    // Load content
                    if (isMobile() && isPDF) {
                        // Use PDF.js (Mobile Viewer) ONLY on Mobile
                        // This provides the "one page at a time" experience requested
                        loadPDFViewer(filePath, fileName);
                    } else if (isPDF && filePath.includes('drive.google.com')) {
                        // DESKTOP DRIVE PDF: Use Blob URL to get Native Browser Viewer
                        // (This makes it look exactly like local Tips PDFs)

                        // Show loading state in main content
                        showGlobalLoader();
                        emptyState.style.display = 'none';
                        pdfContainer.style.display = 'block';
                        document.getElementById('mobile-pdf-container').style.display = 'none';

                        // Optional: Show a subtle loading overlay in the iframe area
                        viewer.src = 'about:blank'; // Clear previous content

                        const fileId = filePath.split('/d/')[1].split('/')[0];
                        const apiKey = window.DRIVE_CONFIG ? window.DRIVE_CONFIG.apiKey : '';
                        const mediaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

                        console.log("Fetching Drive PDF for Native View:", fileId);

                        fetch(mediaUrl)
                            .then(response => {
                                if (!response.ok) throw new Error('Fetch failed');
                                return response.blob();
                            })
                            .then(blob => {
                                // Revoke previous blob if any to save memory
                                if (window._currentPdfBlob) URL.revokeObjectURL(window._currentPdfBlob);

                                const blobUrl = URL.createObjectURL(blob);
                                window._currentPdfBlob = blobUrl;
                                viewer.src = blobUrl;
                                hideGlobalLoader();
                            })
                            .catch(err => {
                                console.error("Native View Fail, falling back to Preview:", err);
                                viewer.src = filePath; // Fallback to standard preview if fetch fails
                                hideGlobalLoader();
                            });
                    } else {
                        // Use standard iframe for Desktop Local Files
                        if (isPDF) showGlobalLoader();
                        viewer.src = filePath;
                        emptyState.style.display = 'none';
                        pdfContainer.style.display = 'block';
                        document.getElementById('mobile-pdf-container').style.display = 'none';

                        if (isPDF) {
                            const onIframeLoad = () => {
                                hideGlobalLoader();
                                viewer.removeEventListener('load', onIframeLoad);
                            };
                            viewer.addEventListener('load', onIframeLoad);
                            setTimeout(hideGlobalLoader, 2000);
                        }
                    }
                };

                // Initialize Course Menu
                courseListContainer.innerHTML = '';
                renderMenu(courseData, courseListContainer, groupName === 'Prof');

                // Initialize Tips Menu
                const tipsListContainer = document.getElementById('tips-list');
                const tipsData = window.LOCAL_TIPS_DATA || [];
                if (tipsData && tipsListContainer) {
                    tipsListContainer.innerHTML = '';
                    renderMenu(tipsData, tipsListContainer, groupName === 'Prof');
                }

                // Apply global listener
                document.querySelectorAll('.course-link').forEach(link => {
                    const newLink = link.cloneNode(true);
                    link.parentNode.replaceChild(newLink, link);

                    newLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        handleLinkClick(newLink, e);
                    });
                });

                // Show switch class button
                const switchClassBtn = document.getElementById('switch-class-btn');
                if (switchClassBtn) {
                    switchClassBtn.style.display = 'block';
                }
            } else {
                courseListContainer.innerHTML = '<li style="padding:1rem; color:red;">Erreur: Données introuvables.</li>';
            }
        };

        if (window.COURSE_DATA) {
            renderApp();
        } else {
            // Wait for data if not yet loaded (async drive fetch)
            document.addEventListener('data-ready', renderApp);

            // Handle error in the sidebar too
            document.addEventListener('data-error', (e) => {
                courseListContainer.innerHTML = `
                    <li style="padding:1rem; color:#ff4d4d; font-size: 0.9rem;">
                        <strong>Erreur de chargement</strong><br>
                        ${e.detail || 'Vérifiez la console (F12) pour plus de détails.'}
                    </li>
                `;
            });
        }
    });
});

