# Setup Instructions: Google Drive PDF Integration

This document provides step-by-step instructions for setting up the automated Google Drive PDF listing feature for the Temecula Valley Ukulele Strummers website.

## Overview

The website automatically fetches a list of PDF song sheets from a Google Drive folder and displays them on the website. This is done using:
- A Python script that queries the Google Drive API
- A GitHub Actions workflow that runs daily (and can be triggered manually)
- A service account for secure, automated access to Google Drive

## Prerequisites

- A Google Cloud Platform account
- A Google Drive folder with PDF files
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

## Step 2: Share Your Google Drive Folder with the Service Account

1. Open Google Drive in your browser
2. Navigate to the folder containing your PDF song sheets
3. Right-click on the folder and select "Share"
4. In the "Add people and groups" field, paste the service account email from the JSON file (the `client_email` value, e.g., `github-actions-drive-reader@your-project-id.iam.gserviceaccount.com`)
5. Set the permission to "Viewer"
6. **Uncheck** "Notify people" (the service account doesn't receive emails)
7. Click "Share"

### 2.1 Get Your Folder ID

You need the folder ID to tell the script which folder to read from.

**Method 1: From the URL**
1. Open the folder in Google Drive
2. Look at the URL in your browser. It will look like:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
   ```
3. The folder ID is the part after `/folders/`: `1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P`

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

### 3.2 Add DRIVE_FOLDER_ID Secret

1. Click "New repository secret" again
2. For "Name", enter: `DRIVE_FOLDER_ID`
3. For "Value", paste the folder ID from Step 2.1
4. Click "Add secret"

### 3.3 Verify Your Secrets

After adding both secrets, you should see:
- `SERVICE_ACCOUNT_JSON`
- `DRIVE_FOLDER_ID`

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
export DRIVE_FOLDER_ID='<your-folder-id>'
export OUTPUT_JSON_PATH='public/songs.json'
```

**On Windows (PowerShell):**
```powershell
$env:SERVICE_ACCOUNT_JSON='<paste the entire JSON content here>'
$env:DRIVE_FOLDER_ID='<your-folder-id>'
$env:OUTPUT_JSON_PATH='public/songs.json'
```

### 4.3 Run the Script

```bash
python scripts/build_songs_json.py
```

If successful, you should see output like:
```
============================================================
Building songs.json from Google Drive
============================================================
Output path: public/songs.json

✓ Successfully loaded service account credentials
✓ Successfully connected to Google Drive API
Querying folder: 1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P
✓ Found 15 file(s)
✓ Successfully wrote 15 song(s) to public/songs.json

============================================================
✓ Successfully completed!
============================================================
```

Check the `public/songs.json` file to verify it contains your songs.

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
1. A new commit will be made to your repository with the message "Update songs.json from Google Drive"
2. The `public/songs.json` file will be created or updated
3. You can view the file in your repository to confirm it contains the correct data

## Step 6: Verify Automatic Scheduling

The workflow is configured to run automatically every day at midnight UTC. You don't need to do anything - it will run on its own schedule.

To check when it last ran:
1. Go to the "Actions" tab
2. Look for workflow runs with the trigger type "schedule"

## Troubleshooting

### Common Issues

**"Error: SERVICE_ACCOUNT_JSON environment variable not set"**
- Make sure you've added the `SERVICE_ACCOUNT_JSON` secret in GitHub Settings

**"Error: DRIVE_FOLDER_ID environment variable not set"**
- Make sure you've added the `DRIVE_FOLDER_ID` secret in GitHub Settings

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
- The workflow only commits if `public/songs.json` has been modified

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

### Change the Output Path

By default, the JSON file is saved to `public/songs.json`. To change this:

1. Edit `.github/workflows/update-songs.yml`
2. Find the `OUTPUT_JSON_PATH` environment variable
3. Change it to your desired path (e.g., `data/songs.json`)
4. Update your website code to fetch from the new location

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

Once the workflow is successfully running and generating `public/songs.json`:

1. Update your `songs.html` page to fetch and display songs from the JSON file
2. Consider adding JavaScript to dynamically render the song list
3. Add styling to make the song cards visually appealing
4. Optionally add filtering/search functionality

See the website implementation for examples of how to use the generated JSON data.
