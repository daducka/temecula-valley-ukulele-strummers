#!/usr/bin/env python3
"""
Build songs.json from Google Drive folder contents.

This script authenticates with Google Drive API using a service account,
lists PDF files in a specified folder, and generates a JSON file with
metadata and download links.
"""

import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError as e:
    print(f"Error: Missing required package: {e}", file=sys.stderr)
    print("Please install dependencies: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)


# Configuration
DEFAULT_OUTPUT_PATH = "songs.json"
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']


def get_credentials():
    """
    Get service account credentials from environment variable.
    
    Returns:
        service_account.Credentials: Authenticated credentials
    """
    service_account_json = os.environ.get('SERVICE_ACCOUNT_JSON')
    
    if not service_account_json:
        print("Error: SERVICE_ACCOUNT_JSON environment variable not set", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Parse the JSON string into a dictionary
        service_account_info = json.loads(service_account_json)
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=SCOPES
        )
        print("✓ Successfully loaded service account credentials")
        return credentials
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in SERVICE_ACCOUNT_JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: Failed to load credentials: {e}", file=sys.stderr)
        sys.exit(1)


def list_files_in_folder(service, folder_id: str) -> List[Dict[str, Any]]:
    """
    List all PDF files in the specified Google Drive folder.
    
    Args:
        service: Authenticated Google Drive API service
        folder_id: ID of the folder to list files from
        
    Returns:
        List of file metadata dictionaries
    """
    files = []
    page_token = None
    
    # Query for PDF files in the folder
    query = f"'{folder_id}' in parents and (mimeType='application/pdf' or name contains '.pdf') and trashed=false"
    
    print(f"Querying folder: {folder_id}")
    
    try:
        while True:
            results = service.files().list(
                q=query,
                spaces='drive',
                fields='nextPageToken, files(id, name, mimeType, modifiedTime, size)',
                pageToken=page_token,
                pageSize=100
            ).execute()
            
            items = results.get('files', [])
            files.extend(items)
            
            page_token = results.get('nextPageToken')
            if not page_token:
                break
                
        print(f"✓ Found {len(files)} file(s)")
        return files
        
    except HttpError as error:
        print(f"Error: Failed to list files from Drive API: {error}", file=sys.stderr)
        if error.resp.status == 404:
            print("  Hint: Check that the folder ID is correct and the service account has access", file=sys.stderr)
        elif error.resp.status == 403:
            print("  Hint: Ensure the folder is shared with the service account email", file=sys.stderr)
        sys.exit(1)


def generate_file_urls(file_id: str) -> str:
    """
    Generate view URL for a Google Drive file.
    The same URL works for both viewing and downloading in the browser.
    
    Args:
        file_id: Google Drive file ID
        
    Returns:
        String with the view URL
    """
    return f'https://drive.google.com/file/d/{file_id}/view?usp=sharing'


def build_songs_json(files: List[Dict[str, Any]], folder_id: str) -> List[Dict[str, Any]]:
    """
    Build the songs.json structure from file list.
    Output format matches the existing script.js expectations.
    
    Args:
        files: List of file metadata from Drive API
        folder_id: The folder ID being processed
        
    Returns:
        List of song dictionaries ready for JSON serialization
    """
    songs = []
    
    for idx, file in enumerate(files, start=1):
        file_id = file['id']
        pdf_url = generate_file_urls(file_id)
        
        # Extract song name without .pdf extension
        name = file['name']
        # Handle case-insensitive .pdf extension
        if name.lower().endswith('.pdf'):
            name = name[:-4]  # Remove last 4 characters (.pdf or .PDF or .Pdf, etc.)
        
        song = {
            'id': idx,
            'name': name,
            'pdfUrl': pdf_url
        }
        songs.append(song)
    
    # Sort by name (case-insensitive) for deterministic output
    songs.sort(key=lambda x: x['name'].lower())
    
    # Re-number IDs after sorting
    for idx, song in enumerate(songs, start=1):
        song['id'] = idx
    
    return songs


def write_json_file(data: List[Dict[str, Any]], output_path: str):
    """
    Write the songs data to a JSON file with pretty formatting.
    
    Args:
        data: List of songs to serialize
        output_path: Path where the JSON file should be written
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')  # Add trailing newline
        print(f"✓ Successfully wrote {len(data)} song(s) to {output_path}")
    except Exception as e:
        print(f"Error: Failed to write JSON file: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main execution function."""
    print("=" * 60)
    print("Building songs.json from Google Drive")
    print("=" * 60)
    
    # Get configuration from environment
    folder_id = os.environ.get('DRIVE_FOLDER_ID')
    if not folder_id:
        print("Error: DRIVE_FOLDER_ID environment variable not set", file=sys.stderr)
        sys.exit(1)
    
    output_path = os.environ.get('OUTPUT_JSON_PATH', DEFAULT_OUTPUT_PATH)
    
    print(f"Output path: {output_path}")
    print()
    
    # Authenticate and build service
    credentials = get_credentials()
    
    try:
        service = build('drive', 'v3', credentials=credentials)
        print("✓ Successfully connected to Google Drive API")
    except Exception as e:
        print(f"Error: Failed to build Drive service: {e}", file=sys.stderr)
        sys.exit(1)
    
    # List files
    files = list_files_in_folder(service, folder_id)
    
    if not files:
        print("Warning: No PDF files found in the folder", file=sys.stderr)
    
    # Build JSON structure
    data = build_songs_json(files, folder_id)
    
    # Write to file
    write_json_file(data, output_path)
    
    print()
    print("=" * 60)
    print("✓ Successfully completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
