#!/usr/bin/env python3
"""
Build songs.json from Google Drive folder contents.

This script authenticates with Google Drive API using a service account,
lists PDF files in a specified folder, and generates a JSON file with
metadata and download links.

Supports multiple drive folders via config.json.
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
DEFAULT_CONFIG_PATH = "config.json"
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
    Generate download URL for a Google Drive file.
    Uses the direct download format from drive.usercontent.google.com.
    
    Args:
        file_id: Google Drive file ID
        
    Returns:
        String with the download URL
    """
    return f'https://drive.usercontent.google.com/u/0/uc?id={file_id}&export=download'


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
        # Remove .pdf extension (after case-insensitive check)
        if name.lower().endswith('.pdf'):
            name = name[:-4]
        
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


def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load drive configuration from config.json.
    
    Args:
        config_path: Path to the config file
        
    Returns:
        Dictionary containing configuration data
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"✓ Loaded configuration from {config_path}")
        return config
    except FileNotFoundError:
        print(f"Error: Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config file: {e}", file=sys.stderr)
        sys.exit(1)


def process_single_drive(service, drive_config: Dict[str, Any], folder_id: str):
    """
    Process a single drive configuration.
    
    Args:
        service: Authenticated Google Drive API service
        drive_config: Drive configuration from config.json
        folder_id: The Google Drive folder ID
    """
    drive_id = drive_config.get('id', 'unknown')
    drive_name = drive_config.get('name', 'Unknown')
    output_file = drive_config.get('outputFile', f'songs-{drive_id}.json')
    
    print(f"\nProcessing drive: {drive_name} ({drive_id})")
    print(f"  Folder ID: {folder_id}")
    print(f"  Output file: {output_file}")
    
    # List files
    files = list_files_in_folder(service, folder_id)
    
    if not files:
        print(f"  Warning: No PDF files found in folder for {drive_name}", file=sys.stderr)
    
    # Build JSON structure
    data = build_songs_json(files, folder_id)
    
    # Write to file
    write_json_file(data, output_file)


def main():
    """Main execution function."""
    print("=" * 60)
    print("Building songs JSON files from Google Drive")
    print("=" * 60)
    
    # Load configuration
    config_path = os.environ.get('CONFIG_PATH', DEFAULT_CONFIG_PATH)
    config = load_config(config_path)
    
    drives = config.get('drives', [])
    if not drives:
        print("Error: No drives configured in config.json", file=sys.stderr)
        sys.exit(1)
    
    print(f"Found {len(drives)} drive(s) to process")
    
    # Authenticate and build service
    credentials = get_credentials()
    
    try:
        service = build('drive', 'v3', credentials=credentials)
        print("✓ Successfully connected to Google Drive API")
    except Exception as e:
        print(f"Error: Failed to build Drive service: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Process each drive
    for drive_config in drives:
        drive_id = drive_config.get('id', 'unknown')
        # Get folder ID from environment variable based on drive ID
        env_var_name = f'DRIVE_FOLDER_ID_{drive_id.upper()}'
        folder_id = os.environ.get(env_var_name)
        
        if not folder_id:
            print(f"Warning: {env_var_name} not set, skipping {drive_id}", file=sys.stderr)
            continue
        
        try:
            process_single_drive(service, drive_config, folder_id)
        except Exception as e:
            print(f"Error processing {drive_id}: {e}", file=sys.stderr)
            # Continue with other drives instead of exiting
    
    # Also handle legacy DRIVE_FOLDER_ID for backward compatibility
    legacy_folder_id = os.environ.get('DRIVE_FOLDER_ID')
    if legacy_folder_id:
        print("\n⚠ Legacy DRIVE_FOLDER_ID detected - generating songs.json for backward compatibility")
        output_path = os.environ.get('OUTPUT_JSON_PATH', DEFAULT_OUTPUT_PATH)
        files = list_files_in_folder(service, legacy_folder_id)
        data = build_songs_json(files, legacy_folder_id)
        write_json_file(data, output_path)
    
    print()
    print("=" * 60)
    print("✓ Successfully completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
