# temecula-valley-ukulele-strummers

Temecula Valley Ukulele Strummers

## Features

- 🎵 Dynamic song list loaded from Google Drive
- 📄 PDF song sheets with view and download links
- 🔄 Automatically updated daily via GitHub Actions
- 📱 Responsive design for all devices

## Setup

This site uses a Google Cloud service account to automatically fetch PDF song sheets from a Google Drive folder.

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Quick Start for Development

1. Clone the repository
2. Open `index.html` in a web browser to view the site locally
3. The `songs.json` file contains sample data for development
4. The `script.js` file handles dynamic loading and display of songs

## Updating Songs

Songs are automatically updated daily at midnight UTC. You can also:
- Manually trigger the workflow from the Actions tab
- The workflow fetches PDFs from the configured Google Drive folder
- Changes are automatically committed back to the repository

## Structure

- `index.html` - Home page
- `songs.html` - Dynamic song list page with search and tabs
- `script.js` - JavaScript for loading and displaying songs dynamically
- `styles.css` - Stylesheet
- `songs.json` - Generated list of songs from Google Drive
- `scripts/build_songs_json.py` - Python script to fetch songs from Google Drive
- `.github/workflows/update-songs.yml` - GitHub Actions workflow
- `screenshots/` - Website screenshots
