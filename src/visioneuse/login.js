document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('login-overlay');
    const classSelection = document.getElementById('class-selection');
    const passwordSection = document.getElementById('password-section');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const backButton = document.getElementById('back-button');
    const errorMessage = document.getElementById('login-error');
    const selectedClassLabel = document.getElementById('selected-class-label');
    const loginTitle = document.getElementById('login-title');
    const loginSubtitle = document.getElementById('login-subtitle');

    // Password configuration for each class
    const CLASS_PASSWORDS = {
        '3D1': 'aqwse',
        '3D2': 'zsxdr',
        'DA3': 'edcft',
        'Prof': 'prof01',
    };

    let selectedClass = null;

    // Check if user is already logged in for this session
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const savedGroup = sessionStorage.getItem('selectedGroup');
        overlay.style.display = 'none';
        document.dispatchEvent(new CustomEvent('login-success', { detail: { group: savedGroup } }));
    } else {
        overlay.style.display = 'flex';
        initializeClassButtons();
    }

    function initializeClassButtons() {
        if (window.COURSE_DATA && window.COURSE_DATA.courses) {
            generateClassButtons();
        } else {
            // Wait for Google Drive data to be ready
            document.addEventListener('data-ready', () => {
                generateClassButtons();
            });

            // Handle potential errors
            document.addEventListener('data-error', (e) => {
                let helpfulMessage = e.detail || 'Erreur inconnue';

                // Specific help for Google API Referer error
                if (helpfulMessage.toLowerCase().includes('referer') || helpfulMessage.toLowerCase().includes('blocked')) {
                    helpfulMessage = `
                        <strong>L'accès aux cours est bloqué par Google.</strong><br>
                        <small style="display: block; margin-top: 0.5rem; opacity: 0.8; line-height: 1.4;">
                            Cela arrive souvent si votre clé API n'autorise pas ce domaine (ou si vous testez en local sans serveur).<br><br>
                            <strong>Action requise :</strong> Vérifiez les restrictions de votre clé API dans la Console Google Cloud.
                        </small>
                    `;
                }

                classSelection.innerHTML = `
                    <div style="color: #ff4d4d; margin-bottom: 1.5rem; text-align: center; background: rgba(255, 77, 77, 0.1); padding: 1rem; border-radius: 8px;">
                        ${helpfulMessage}
                    </div>
                    <button class="class-button" onclick="window.location.reload()">Réessayer</button>
                `;
            });
        }
    }

    function generateClassButtons() {
        classSelection.innerHTML = '';

        let rawCourses = window.COURSE_DATA.courses;
        let classes = [];

        console.log("Login: Generating buttons from rawCourses:", rawCourses);

        if (Array.isArray(rawCourses)) {
            // Legacy flat structure
            classes = rawCourses.filter(item => item.type === 'folder');
        } else if (typeof rawCourses === 'object' && rawCourses !== null) {
            // New year-based structure: Get classes from the latest year
            const years = Object.keys(rawCourses).sort((a, b) => b - a);
            if (years.length > 0) {
                const latestYear = years[0];
                const yearData = rawCourses[latestYear];

                // If the yearData is itself a folder list (standard)
                if (Array.isArray(yearData)) {
                    classes = yearData.filter(item => item.type === 'folder');
                }
                // If it's the "Défaut" fallback where we might have files AND folders
                else if (yearData.children && Array.isArray(yearData.children)) {
                    classes = yearData.children.filter(item => item.type === 'folder');
                }

                console.log(`Login: Loading classes from: ${latestYear}`, classes);
            }
        }

        if (classes.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.fontSize = '0.8rem';
            emptyMsg.style.opacity = '0.7';
            emptyMsg.textContent = "Aucun dossier de classe trouvé dans Google Drive.";
            classSelection.appendChild(emptyMsg);
        }

        classes.forEach(folder => {
            const button = document.createElement('button');
            button.className = 'class-button';
            button.textContent = folder.name;
            button.addEventListener('click', () => selectClass(folder.name));
            classSelection.appendChild(button);
        });

        // Add "Prof" button
        const profButton = document.createElement('button');
        profButton.className = 'class-button prof-button';
        profButton.textContent = 'Professeur';
        profButton.addEventListener('click', () => selectClass('Prof'));
        classSelection.appendChild(profButton);
    }

    function selectClass(className) {
        selectedClass = className;

        // Hide class selection, show password input
        classSelection.style.display = 'none';
        passwordSection.style.display = 'block';

        // Update UI text
        loginTitle.textContent = 'Authentification';
        loginSubtitle.textContent = 'Entrez le mot de passe pour accéder aux cours.';
        selectedClassLabel.textContent = `Classe : ${className}`;

        // Focus password input
        passwordInput.value = '';
        passwordInput.focus();
        errorMessage.style.display = 'none';
    }

    function attemptLogin() {
        const input = passwordInput.value;
        const correctPassword = CLASS_PASSWORDS[selectedClass];

        if (input === correctPassword) {
            // Store login state
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('selectedGroup', selectedClass);

            // Fade out overlay
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.dispatchEvent(new CustomEvent('login-success', { detail: { group: selectedClass } }));
            }, 500);
        } else {
            errorMessage.textContent = 'Mot de passe incorrect';
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function goBack() {
        // Show class selection, hide password input
        passwordSection.style.display = 'none';
        classSelection.style.display = 'grid';

        // Reset UI text
        loginTitle.textContent = 'Sélectionnez votre classe';
        loginSubtitle.textContent = 'Choisissez votre classe pour accéder aux cours.';

        // Clear state
        selectedClass = null;
        passwordInput.value = '';
        errorMessage.style.display = 'none';
    }

    // Event listeners
    loginButton.addEventListener('click', attemptLogin);
    backButton.addEventListener('click', goBack);

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });

    // Switch Class Button Handler
    const switchClassBtn = document.getElementById('switch-class-btn');
    if (switchClassBtn) {
        switchClassBtn.addEventListener('click', () => {
            // Clear session storage
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('selectedGroup');

            // Reload page to show login screen
            window.location.reload();
        });
    }
});
