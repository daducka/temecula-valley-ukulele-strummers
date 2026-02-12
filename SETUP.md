# Setup Instructions: Multiple Google Drive PDF Integration

This document provides step-by-step instructions for setting up the automated Google Drive PDF listing feature for the Temecula Valley Ukulele Strummers website with support for multiple drive sources.

## Overview

The website automatically fetches lists of PDF song sheets from multiple Google Drive folders and displays them on separate tabs on the website. This is done using:
- A Python script that queries the Google Drive API for multiple folders
- A `config.json` file that defines the drive sources and tabs
- A GitHub Actions workflow that runs daily (and can be triggered manually)
- A service account for secure, automated access to Google Drive

## Prerequisites

- A Google Cloud Platform account
- Google Drive folders with PDF files (one for each tab you want to display)
- Admin access to this GitHub repository

## Step 1: Create a Google Cloud Service Account

### 1.1 Create a New Google Cloud Project (if needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "temecula-ukulele-drive")
5. Click "Create"

### 1.2 Enable Google Drive API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and click "Enable"

### 1.3 Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter a name (e.g., "github-actions-drive-reader")
4. Enter a description (e.g., "Service account for reading Drive files in GitHub Actions")
5. Click "Create and Continue"
6. For role, select "Basic" → "Viewer" (or skip this step, as we'll grant access at the folder level)
7. Click "Continue" then "Done"

### 1.4 Create and Download Service Account Key

1. In the "Credentials" page, find your service account in the "Service Accounts" section
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" → "Create new key"
5. Select "JSON" format
6. Click "Create"
7. The JSON key file will be downloaded to your computer
8. **IMPORTANT**: Keep this file secure and never commit it to your repository!

The downloaded JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "github-actions-drive-reader@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Note the `client_email`** - you'll need this in the next step!

## Step 2: Share Your Google Drive Folders with the Service Account

For each Google Drive folder you want to display (e.g., TVUS and GTS):

1. Open Google Drive in your browser
2. Navigate to the folder containing your PDF song sheets
3. Right-click on the folder and select "Share"
4. In the "Add people and groups" field, paste the service account email from the JSON file (the `client_email` value, e.g., `github-actions-drive-reader@your-project-id.iam.gserviceaccount.com`)
5. Set the permission to "Viewer"
6. **Uncheck** "Notify people" (the service account doesn't receive emails)
7. Click "Share"
8. **Repeat for each folder** you want to integrate

### 2.1 Get Your Folder IDs

You need the folder ID for each folder to tell the script which folders to read from.

**Method 1: From the URL**
1. Open the folder in Google Drive
2. Look at the URL in your browser. It will look like:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
   ```
3. The folder ID is the part after `/folders/`: `1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P`
4. **Save each folder ID** - you'll need them in the next step

**Method 2: From folder details**
1. Right-click the folder in Google Drive
2. Select "Share" → Click the gear icon (settings) → "Share settings"
3. The folder ID is in the URL of the sharing settings dialog

## Step 3: Configure GitHub Secrets

GitHub Secrets are used to securely store sensitive information like API keys.

### 3.1 Add SERVICE_ACCOUNT_JSON Secret

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. For "Name", enter: `SERVICE_ACCOUNT_JSON`
5. For "Value", open the JSON key file you downloaded in Step 1.4 in a text editor
6. Copy the **entire contents** of the file and paste it into the "Value" field
7. Click "Add secret"

### 3.2 Add Drive Folder ID Secrets

For each drive source in your `config.json`, you need to add a secret:

1. Click "New repository secret"
2. For "Name", enter: `DRIVE_FOLDER_ID_<DRIVE_ID>` (e.g., `DRIVE_FOLDER_ID_TVUS` for TVUS, `DRIVE_FOLDER_ID_GTS` for GTS)
3. For "Value", paste the folder ID from Step 2.1 for that specific drive
4. Click "Add secret"
5. **Repeat** for each drive source

**Example**: If your `config.json` has:
- Drive ID: `tvus` → Create secret: `DRIVE_FOLDER_ID_TVUS`
- Drive ID: `gts` → Create secret: `DRIVE_FOLDER_ID_GTS`

### 3.3 Verify Your Secrets

After adding all secrets, you should see:
- `SERVICE_ACCOUNT_JSON`
- `DRIVE_FOLDER_ID_TVUS`
- `DRIVE_FOLDER_ID_GTS`
- (plus any additional drive sources you configured)

You won't be able to view the values after creation (for security), but you can update them if needed.

## Step 4: Test Locally (Optional but Recommended)

Before running the workflow on GitHub, you can test the script locally.

### 4.1 Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4.2 Set Environment Variables

**On Linux/Mac:**
```bash
export SERVICE_ACCOUNT_JSON='<paste the entire JSON content here>'
export DRIVE_FOLDER_ID_TVUS='<your-tvus-folder-id>'
export DRIVE_FOLDER_ID_GTS='<your-gts-folder-id>'
export CONFIG_PATH='config.json'
```

**On Windows (PowerShell):**
```powershell
$env:SERVICE_ACCOUNT_JSON='<paste the entire JSON content here>'
$env:DRIVE_FOLDER_ID_TVUS='<your-tvus-folder-id>'
$env:DRIVE_FOLDER_ID_GTS='<your-gts-folder-id>'
$env:CONFIG_PATH='config.json'
```

### 4.3 Run the Script

```bash
python scripts/build_songs_json.py
```

If successful, you should see output like:
```
============================================================
Building songs JSON files from Google Drive
============================================================
✓ Loaded configuration from config.json
Found 2 drive(s) to process
✓ Successfully loaded service account credentials
✓ Successfully connected to Google Drive API

Processing drive: TVUS (tvus)
  Folder ID: 1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
  Output file: songs-tvus.json
Querying folder: 1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
✓ Found 15 file(s)
✓ Successfully wrote 15 song(s) to songs-tvus.json

Processing drive: GTS (gts)
  Folder ID: 2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q
  Output file: songs-gts.json
Querying folder: 2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q
✓ Found 8 file(s)
✓ Successfully wrote 8 song(s) to songs-gts.json

============================================================
✓ Successfully completed!
============================================================
```

Check the generated JSON files (e.g., `songs-tvus.json`, `songs-gts.json`) to verify they contain your songs.

## Step 5: Trigger the GitHub Actions Workflow Manually

Now that everything is configured, test the workflow on GitHub.

### 5.1 Trigger the Workflow

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. In the left sidebar, click "Update Songs from Google Drive"
4. Click the "Run workflow" button (on the right side)
5. Select the branch (usually `main`)
6. Click the green "Run workflow" button

### 5.2 Monitor the Workflow

1. The workflow will appear in the list with a yellow spinner (running)
2. Click on the workflow run to see details
3. Click on the "update-songs" job to see the logs
4. You should see the output from the Python script

### 5.3 Verify the Results

If the workflow succeeds:
1. New commits will be made to your repository with the message "Update songs JSON files from Google Drive"
2. The JSON files (e.g., `songs-tvus.json`, `songs-gts.json`) will be created or updated
3. You can view the files in your repository to confirm they contain the correct data

## Step 6: Verify Automatic Scheduling

The workflow is configured to run automatically every day at midnight UTC. You don't need to do anything - it will run on its own schedule.

To check when it last ran:
1. Go to the "Actions" tab
2. Look for workflow runs with the trigger type "schedule"

## Troubleshooting

### Common Issues

**"Error: SERVICE_ACCOUNT_JSON environment variable not set"**
- Make sure you've added the `SERVICE_ACCOUNT_JSON` secret in GitHub Settings

**"Error: DRIVE_FOLDER_ID environment variable not set"** (legacy warning)
- This is expected if you haven't set the legacy variable
- The script now uses `DRIVE_FOLDER_ID_<DRIVE_ID>` format (e.g., `DRIVE_FOLDER_ID_TVUS`)

**"Warning: DRIVE_FOLDER_ID_XXX not set, skipping xxx"**
- Make sure you've added the secret for that specific drive in GitHub Settings
- Check that the drive ID in the secret name matches the ID in `config.json` (case-insensitive)
- Ensure you've shared the folder with the service account

**"Error: Failed to list files from Drive API: 404"**
- Check that the folder ID is correct
- Make sure the folder exists and hasn't been deleted

**"Error: Failed to list files from Drive API: 403"**
- Ensure the Google Drive folder is shared with the service account email
- Check that the Google Drive API is enabled in your Google Cloud project
- Verify the service account has the correct permissions

**"No PDF files found in the folder"**
- Make sure the folder contains PDF files
- The script looks for files with `mimeType='application/pdf'` or filenames ending in `.pdf`

**The workflow runs but doesn't commit changes**
- This is normal if the folder contents haven't changed since the last run
- The workflow only commits if any of the song JSON files have been modified

## Adding a New Drive Source

To add a new drive source (e.g., a third ukulele group):

### 1. Update config.json

Add a new entry to the `drives` array in `config.json`:

```json
{
  "drives": [
    {
      "id": "tvus",
      "name": "TVUS",
      "displayName": "TVUS",
      "outputFile": "songs-tvus.json"
    },
    {
      "id": "gts",
      "name": "GTS",
      "displayName": "GTS",
      "outputFile": "songs-gts.json"
    },
    {
      "id": "newgroup",
      "name": "NewGroup",
      "displayName": "New Group",
      "outputFile": "songs-newgroup.json"
    }
  ]
}
```

### 2. Add GitHub Secret

Add a new secret `DRIVE_FOLDER_ID_NEWGROUP` with the folder ID for the new group.

### 3. Update GitHub Actions Workflow

Edit `.github/workflows/update-songs.yml` and add the new environment variable:

```yaml
env:
  SERVICE_ACCOUNT_JSON: ${{ secrets.SERVICE_ACCOUNT_JSON }}
  DRIVE_FOLDER_ID_TVUS: ${{ secrets.DRIVE_FOLDER_ID_TVUS }}
  DRIVE_FOLDER_ID_GTS: ${{ secrets.DRIVE_FOLDER_ID_GTS }}
  DRIVE_FOLDER_ID_NEWGROUP: ${{ secrets.DRIVE_FOLDER_ID_NEWGROUP }}
  CONFIG_PATH: config.json
```

### 4. Share the Folder

Share the Google Drive folder with your service account email (as described in Step 2).

### 5. Test

Run the workflow manually to verify the new drive source is working correctly.

### Getting Help

If you encounter issues:
1. Check the GitHub Actions workflow logs for detailed error messages
2. Verify all secrets are set correctly
3. Test the script locally using the instructions in Step 4
4. Ensure the service account has access to the folder

## Security Best Practices

- ✅ **DO** store the service account JSON in GitHub Secrets
- ✅ **DO** share the Drive folder with "Viewer" permissions only
- ✅ **DO** review the workflow logs to ensure no secrets are printed
- ❌ **DON'T** commit the service account JSON file to the repository
- ❌ **DON'T** share your service account key publicly
- ❌ **DON'T** grant more permissions than necessary

## Updating the Configuration

### Change a Drive's Output File

To change where a drive's JSON is saved:

1. Edit `config.json`
2. Update the `outputFile` field for the drive
3. Update your `script.js` if necessary (it reads from config.json automatically)

### Change the Schedule

The workflow runs daily at midnight UTC. To change this:

1. Edit `.github/workflows/update-songs.yml`
2. Find the `cron` line under `schedule`
3. Modify the cron expression (see [crontab.guru](https://crontab.guru/) for help)

Examples:
- Every 6 hours: `0 */6 * * *`
- Every Monday at 9 AM UTC: `0 9 * * 1`
- Twice daily (6 AM and 6 PM UTC): `0 6,18 * * *`

## Next Steps

Once the workflow is successfully running and generating the song JSON files:

1. The songs will automatically appear on the Songs page (songs.html) in their respective tabs
2. Each drive source will have its own tab (e.g., TVUS, GTS)
3. The website uses script.js to dynamically load and display songs from config.json
4. Users can search and filter songs using the search bar within each tab
5. Each song has View and Download buttons that link to Google Drive

The integration is complete - your website will now automatically sync with multiple Google Drive folders!
