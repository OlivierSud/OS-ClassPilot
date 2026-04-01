const DRIVE_CONFIG = {
    apiKey: 'AIzaSyBA2lV9mm9_tNIpErOd9yO5lMjlIYtlCwM',
    folderId: '1hXzaOpzsBJSwESAugAwutJc7oaR8Ou17'
};
window.DRIVE_CONFIG = DRIVE_CONFIG;

/**
 * Fetches all files and folders from a specific Google Drive folder ID.
 * Returns a structured tree similar to the local courses_data.js structure.
 */
async function fetchGoogleDriveData() {
    console.log("Fetching data from Google Drive...");

    // Check if running via file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn("⚠️ Attention : Vous utilisez le protocole 'file://'. L'API Google Drive peut bloquer les requêtes sans Referer. Utilisez un serveur local (ex: Live Server) ou désactivez les restrictions de la clé API pour les tests.");
    }

    try {
        const rootFolderId = DRIVE_CONFIG.folderId;
        const apiKey = DRIVE_CONFIG.apiKey;

        // Fetch all files that are in the folder or its children
        // We fetch everything in one go if possible, or recursively.
        // For simplicity and performance, we'll fetch all files that have the root folder in their parents (recursively might need multiple calls).
        // Actually, Google Drive API search 'q' doesn't easily do "all descendants".
        // We'll implement a recursive fetcher.

        async function getFolderContents(folderId) {
            const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink,webContentLink)&key=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error.message || "Failed to fetch folder contents");
            }
            const data = await response.json();
            return data.files || [];
        }

        async function buildTree(folderId, folderName) {
            const files = await getFolderContents(folderId);
            const children = [];

            // Sort: Folders first, then files
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
                        name: file.name,
                        id: file.id,
                        children: subChildren,
                        visibility: true // Default visibility
                    });
                } else if (file.mimeType === 'application/pdf') {
                    children.push({
                        type: 'file',
                        name: file.name,
                        id: file.id,
                        // Use the direct preview link which is designed for iframes and embedding
                        path: `https://drive.google.com/file/d/${file.id}/preview`,
                        downloadUrl: file.webContentLink, // For forced download
                        visibility: true
                    });
                } else if (file.name === 'index.html') {
                    // Handle HTML tips if any
                    children.push({
                        type: 'file',
                        name: folderName, // Use parent folder name as title
                        id: file.id,
                        path: `https://drive.google.com/file/d/${file.id}/preview`,
                        visibility: true
                    });
                }
            }
            return children;
        }

        // The root folder contains 'Années' (or 'Cours') and 'Tips' usually.
        const rootContents = await getFolderContents(rootFolderId);
        console.log("Root items found:", rootContents.map(i => `${i.name} (${i.mimeType})`));

        const finalData = {
            courses: {},
            tips: [],
            generatedAt: new Date().toISOString()
        };

        let mainFolderFound = false;

        for (const item of rootContents) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                const nameLower = item.name.toLowerCase().trim();

                // Matches "Années", "Année", "Cours", etc.
                if (nameLower.includes('anné') || nameLower === 'cours') {
                    mainFolderFound = true;
                    console.log(`Found main container: '${item.name}'. Scanning for years...`);
                    const years = await getFolderContents(item.id);
                    for (const year of years) {
                        if (year.mimeType === 'application/vnd.google-apps.folder') {
                            console.log(`Scanning year/category: ${year.name}`);
                            finalData.courses[year.name] = await buildTree(year.id, year.name);
                        }
                    }
                }
                // Skip Tips from Drive as per user request (reverted to local repo)
            }
        }

        // FALLBACK 1: If no 'Années' or 'Cours' folder found, check if years are directly in the root
        if (!mainFolderFound) {
            console.warn("No 'Années' or 'Cours' folder found at root. Checking if root contains year folders directly...");
            for (const item of rootContents) {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                    const nameLower = item.name.toLowerCase().trim();
                    if (nameLower === 'tips') continue;

                    // If folder name is exactly 4 digits (ex: 2025)
                    if (/^\d{4}$/.test(item.name)) {
                        console.log(`Fallback: Treating root folder '${item.name}' as a year category.`);
                        finalData.courses[item.name] = await buildTree(item.id, item.name);
                        mainFolderFound = true;
                    }
                }
            }
        }

        // FALLBACK 2: If still nothing, treat root as a single category "Défaut"
        if (!mainFolderFound) {
            const potentialClasses = rootContents.filter(i => i.mimeType === 'application/vnd.google-apps.folder' && i.name.toLowerCase() !== 'tips');
            if (potentialClasses.length > 0) {
                console.log("Root contains potential course folders. Treating root as the latest year.");
                finalData.courses["Défaut"] = await buildTree(rootFolderId, "Défaut");
            }
        }

        console.log("Final Course Data Structure:", finalData);
        return finalData;

    } catch (error) {
        console.error("Google Drive Fetch Error:", error);
        throw error;
    }
}

window.fetchGoogleDriveData = fetchGoogleDriveData;
// Start fetching immediately and store the promise globally
window.driveDataPromise = fetchGoogleDriveData().then(data => {
    window.COURSE_DATA = data;
    window.COURSE_DATA.isDrive = true;
    document.dispatchEvent(new Event('data-ready'));
    console.log("Google Drive data is ready.");
    return data;
}).catch(err => {
    console.error("Failed to initialize Google Drive data:", err);
    document.dispatchEvent(new CustomEvent('data-error', { detail: err.message }));
    throw err;
});
