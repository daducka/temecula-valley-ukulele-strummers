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
        downloadBtn.addEventListener('click', () => downloadPDF(song.pdfUrl));
        
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
    const menuOverlay = document.getElementById('menu-overlay');
    const menuClose = document.querySelector('.menu-close');
    
    if (hamburger && menuOverlay) {
        // Open menu
        hamburger.addEventListener('click', function() {
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        });
        
        // Close menu with close button
        if (menuClose) {
            menuClose.addEventListener('click', function() {
                menuOverlay.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            });
        }
        
        // Close menu when clicking overlay background
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        });
    }
}

// View PDF (opens in new tab)
function viewPDF(pdfUrl) {
    // In a real app, this would open the actual PDF
    window.open(pdfUrl, '_blank');
}

// Download PDF
function downloadPDF(pdfUrl) {
    // In a real app, this would trigger a download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfUrl.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
