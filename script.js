// Load and display songs from JSON
let allSongs = [];
let currentTab = 'songs-1';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadSongs();
    setupSearch();
    setupTabs();
    setupHamburgerMenu();
});

// Load songs from JSON file
async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        allSongs = await response.json();
        displaySongs(allSongs);
    } catch (error) {
        console.error('Error loading songs:', error);
        document.getElementById('song-list').innerHTML = '<p class="error">Error loading songs. Please try again later.</p>';
    }
}

// Display songs in the list
function displaySongs(songs) {
    const songList = document.getElementById('song-list');
    
    if (songs.length === 0) {
        songList.innerHTML = '<p class="no-results">No songs found.</p>';
        return;
    }
    
    // Clear existing content
    songList.innerHTML = '';
    
    // Create song rows safely without XSS vulnerabilities
    songs.forEach(song => {
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
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredSongs = allSongs.filter(song => 
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
            
            // For now, both tabs show the same songs
            // In a real app, you might filter songs based on tab
            displaySongs(allSongs);
        });
    });
}

// Setup hamburger menu toggle
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const headerMenu = document.getElementById('header-menu');
    
    if (hamburger && headerMenu) {
        // Toggle menu on hamburger click
        hamburger.addEventListener('click', function() {
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
