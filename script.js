// Load and display songs from JSON
let allSongs = [];
let currentTab = null;
let driveConfigs = [];
let songsByDrive = {};
let currentPage = 1;
let itemsPerPage = 10;
let filteredSongs = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    setupDarkModeToggle();
    setupHamburgerMenu();
    
    // Only run these if we're on the songs page
    if (document.getElementById('song-list')) {
        loadConfig();
        setupSearch();
    }
});

// Load configuration and initialize
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        driveConfigs = config.drives || [];
        
        if (driveConfigs.length === 0) {
            console.error('No drives configured');
            document.getElementById('song-list').innerHTML = '<p class="error">No drives configured. Please check configuration.</p>';
            return;
        }
        
        // Set current tab to first drive
        currentTab = driveConfigs[0].id;
        
        // Create tabs dynamically
        createTabs();
        
        // Load songs for all drives
        await loadAllSongs();
        
        // Display songs for the active tab
        displaySongsForCurrentTab();
        
        // Setup tabs after creation
        setupTabs();
    } catch (error) {
        console.error('Error loading config:', error);
        document.getElementById('song-list').innerHTML = '<p class="error">Error loading configuration. Please try again later.</p>';
    }
}

// Create tabs from config
function createTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    driveConfigs.forEach((drive, index) => {
        const button = document.createElement('button');
        button.className = 'tab-btn';
        button.dataset.tab = drive.id;
        button.textContent = drive.displayName || drive.name;
        
        // First tab is active by default
        if (index === 0) {
            button.classList.add('active');
        }
        
        tabsContainer.appendChild(button);
    });
}

// Load songs from all drive sources
async function loadAllSongs() {
    const loadPromises = driveConfigs.map(async (drive) => {
        try {
            const response = await fetch(drive.outputFile);
            const songs = await response.json();
            songsByDrive[drive.id] = songs;
            console.log(`Loaded ${songs.length} songs for ${drive.name}`);
        } catch (error) {
            console.error(`Error loading songs for ${drive.name}:`, error);
            songsByDrive[drive.id] = [];
        }
    });
    
    await Promise.all(loadPromises);
}

// Display songs for the current tab
function displaySongsForCurrentTab() {
    allSongs = songsByDrive[currentTab] || [];
    currentPage = 1; // Reset to page 1 when switching tabs
    filteredSongs = allSongs;
    displaySongs(filteredSongs);
}

// Display songs in the list
function displaySongs(songs) {
    const songList = document.getElementById('song-list');
    filteredSongs = songs;
    
    if (songs.length === 0) {
        songList.innerHTML = '<p class="no-results">No songs found.</p>';
        return;
    }
    
    // Check if current page is beyond available pages and reset if needed
    const totalPages = Math.ceil(songs.length / itemsPerPage);
    if (currentPage > totalPages) {
        currentPage = 1;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const songsToDisplay = songs.slice(startIndex, endIndex);
    
    // Clear existing content
    songList.innerHTML = '';
    
    // Create song rows safely without XSS vulnerabilities
    songsToDisplay.forEach(song => {
        const songRow = document.createElement('div');
        songRow.className = 'song-row';
        
        const songName = document.createElement('div');
        songName.className = 'song-name';
        songName.textContent = song.name; // Use textContent to prevent XSS
        songName.title = song.name; // Show full name on hover
        
        const songActions = document.createElement('div');
        songActions.className = 'song-actions';
        
        // Create view button
        const viewBtn = document.createElement('button');
        viewBtn.className = 'icon-btn view-btn';
        viewBtn.title = 'View PDF';
        viewBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>`;
        viewBtn.addEventListener('click', () => viewPDF(song.pdfUrl));
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'icon-btn download-btn';
        downloadBtn.title = 'Download PDF';
        downloadBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>`;
        downloadBtn.addEventListener('click', () => downloadPDF(song.pdfUrl, song.name));
        
        // Assemble the song row
        songActions.appendChild(viewBtn);
        songActions.appendChild(downloadBtn);
        songRow.appendChild(songName);
        songRow.appendChild(songActions);
        songList.appendChild(songRow);
    });
    
    // Add pagination controls
    renderPagination(songs.length);
}

// Helper function to create pagination controls
function createPaginationControls(totalPages) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displaySongs(filteredSongs);
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displaySongs(filteredSongs);
        }
    });
    paginationContainer.appendChild(nextBtn);
    
    return paginationContainer;
}

// Render pagination controls
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Remove existing pagination if it exists
    const existingPagination = document.querySelectorAll('.pagination-container');
    existingPagination.forEach(el => el.remove());
    
    // Don't show pagination if only one page
    if (totalPages <= 1) {
        return;
    }
    
    const songList = document.getElementById('song-list');
    
    // Add pagination at the top
    const topPagination = createPaginationControls(totalPages);
    songList.insertBefore(topPagination, songList.firstChild);
    
    // Add pagination at the bottom
    const bottomPagination = createPaginationControls(totalPages);
    songList.appendChild(bottomPagination);
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const currentSongs = songsByDrive[currentTab] || [];
            const filteredSongs = currentSongs.filter(song => 
                song.name.toLowerCase().includes(searchTerm) ||
                (song.artist && song.artist.toLowerCase().includes(searchTerm))
            );
            displaySongs(filteredSongs);
        });
    }
}

// Setup tab functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            currentTab = this.dataset.tab;
            
            // Clear search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Display songs for the new tab
            displaySongsForCurrentTab();
        });
    });
}

// Setup hamburger menu toggle
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const headerMenu = document.getElementById('header-menu');
    
    if (hamburger && headerMenu) {
        // Toggle menu on hamburger click
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling to document
            const isOpen = headerMenu.classList.contains('open');
            
            if (isOpen) {
                headerMenu.classList.remove('open');
                hamburger.classList.remove('active');
            } else {
                headerMenu.classList.add('open');
                hamburger.classList.add('active');
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !headerMenu.contains(e.target)) {
                headerMenu.classList.remove('open');
                hamburger.classList.remove('active');
            }
        });
    }
}

// Extract Google Drive file ID from URL
function extractFileId(url) {
    // Extract ID from URL patterns like:
    // https://drive.usercontent.google.com/u/0/uc?id={id}&export=download
    // https://drive.google.com/file/d/{id}/view
    const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)\//);
    return match ? match[1] : null;
}

// Helper function to trigger download
function triggerDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// View PDF (opens in new tab)
function viewPDF(pdfUrl) {
    const fileId = extractFileId(pdfUrl);
    if (fileId) {
        // Use the view URL format for Google Drive
        const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
        window.open(viewUrl, '_blank');
    } else {
        // Fallback to original URL if ID extraction fails
        window.open(pdfUrl, '_blank');
    }
}

// Download PDF
function downloadPDF(pdfUrl, songName) {
    const fileId = extractFileId(pdfUrl);
    if (fileId) {
        // Use the download URL format for Google Drive
        const downloadUrl = `https://drive.usercontent.google.com/u/0/uc?id=${fileId}&export=download`;
        // Use song name as filename if available, add .pdf extension if not already present
        const filename = songName ? (songName.endsWith('.pdf') ? songName : `${songName}.pdf`) : '';
        triggerDownload(downloadUrl, filename);
    } else {
        // Fallback to original behavior if ID extraction fails
        const filename = pdfUrl.split('/').pop();
        triggerDownload(pdfUrl, filename);
    }
}

// Open PDF in GoodReader app, with fallback to direct download URL
function openInGoodReader(pdfUrl) {
    const fileId = extractFileId(pdfUrl);

    const directUrl = fileId
        ? `https://drive.usercontent.google.com/u/0/uc?id=${fileId}&export=download`
        : pdfUrl;

    const deepLink = `gropen://${directUrl}`;

    // Attempt to open GoodReader
    window.location.href = deepLink;

    // Fallback if app not installed: cancel if GoodReader takes focus (page becomes hidden)
    let fallbackTimer = setTimeout(() => {
        document.removeEventListener('visibilitychange', cancelFallback);
        window.open(directUrl, '_blank');
    }, 900);

    function cancelFallback() {
        if (document.hidden) {
            clearTimeout(fallbackTimer);
            document.removeEventListener('visibilitychange', cancelFallback);
        }
    }

    document.addEventListener('visibilitychange', cancelFallback);
}

// Dark mode functionality
function initializeDarkMode() {
    // Check for saved dark mode preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

function setupDarkModeToggle() {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
        });
    }
}
