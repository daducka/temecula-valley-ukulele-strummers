# temecula-valley-ukulele-strummers

Temecula Valley Ukulele Strummers

## Features

- 🎵 Dynamic song list loaded from multiple Google Drive sources
- 📑 Tab-based interface for different song collections (TVUS, GTS)
- 📄 PDF song sheets with view and download links
- 🔄 Automatically updated daily via GitHub Actions
- 📱 Responsive design for all devices
- 🔍 Search functionality within each tab

## Setup

This site uses a Google Cloud service account to automatically fetch PDF song sheets from multiple Google Drive folders. Each drive source is configured in `config.json` and can be displayed on a separate tab.

For detailed setup instructions, see [SETUP.md](SETUP.md).

## Quick Start for Development

1. Clone the repository
2. Open `index.html` in a web browser to view the site locally
3. The `songs-tvus.json` and `songs-gts.json` files contain sample data for development
4. The `script.js` file handles dynamic loading and display of songs
5. The `config.json` file defines available drive sources and their configurations

## Updating Songs

Songs are automatically updated daily at midnight UTC. You can also:
- Manually trigger the workflow from the Actions tab
- The workflow fetches PDFs from the configured Google Drive folders
- Changes are automatically committed back to the repository

To add a new drive source:
1. Add a new entry to `config.json` with a unique ID and display name
2. Add the corresponding Google Drive folder ID as a secret (e.g., `DRIVE_FOLDER_ID_NEWID`)
3. Update the GitHub Actions workflow to include the new environment variable

## Structure

- `index.html` - Home page
- `songs.html` - Dynamic song list page with search and tabs
- `script.js` - JavaScript for loading and displaying songs dynamically
- `styles.css` - Stylesheet
- `config.json` - Configuration file defining drive sources
- `songs-tvus.json` - Generated list of TVUS songs from Google Drive
- `songs-gts.json` - Generated list of GTS songs from Google Drive
- `scripts/build_songs_json.py` - Python script to fetch songs from multiple Google Drive folders
- `.github/workflows/update-songs.yml` - GitHub Actions workflow
- `screenshots/` - Website screenshots
