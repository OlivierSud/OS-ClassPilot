import os
import json
import re
from datetime import datetime
import urllib.request

# Configuration
COURSES_DIR = 'Cours'
TIPS_DIR = 'Tips'
COURSES_OUTPUT = 'courses_data.js'
TIPS_OUTPUT = 'tips_data.js'
LOGIN_FILE = 'login.js'
DRIVE_CONFIG_FILE = 'googleDrive.js'
ALLOWED_EXTENSIONS = {'.pdf'}

def load_existing_visibility(filepath):
    """
    Loads existing JS file and extracts a map of item paths/names to their visibility status.
    """
    visibility_map = {}
    if not os.path.exists(filepath):
        return visibility_map

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract JSON part
        # Handles both window.COURSE_DATA and window.LOCAL_TIPS_DATA
        match = re.search(r'(?:COURSE_DATA|TIPS_DATA|LOCAL_TIPS_DATA)\s*=\s*(\[.*?\]|\{.*?\});', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            # Remove trailing semicolon if it was caught inside the group mistakenly
            json_str = json_str.strip()
            if json_str.endswith(';'): json_str = json_str[:-1]
            
            data = json.loads(json_str)
            
            def extract_visibility(items):
                if isinstance(items, dict):
                    for k, v in items.items():
                        extract_visibility(v)
                elif isinstance(items, list):
                    for item in items:
                        key = item.get('path', item.get('name'))
                        if key:
                            visibility_map[key] = item.get('visibility', True)
                        if 'children' in item:
                            extract_visibility(item['children'])

            extract_visibility(data)
                
    except Exception as e:
        print(f"Warning: Could not load existing visibility settings from {filepath}: {e}")
        
    return visibility_map

def scan_directory(path, visibility_map):
    """
    Recursively scans a directory and returns a structured list of items.
    """
    items = []
    if not os.path.exists(path):
        return items
        
    try:
        entries = os.listdir(path)
        entries.sort(key=lambda x: (not os.path.isdir(os.path.join(path, x)), x.lower()))

        for entry in entries:
            full_path = os.path.join(path, entry)
            
            if os.path.isdir(full_path):
                index_path = os.path.join(full_path, 'index.html')
                if os.path.exists(index_path):
                    rel_path = index_path.replace('\\', '/')
                    is_visible = visibility_map.get(rel_path, visibility_map.get(entry, True))
                    items.append({
                        "type": "file",
                        "name": entry,
                        "path": rel_path,
                        "visibility": is_visible
                    })
                else:
                    children = scan_directory(full_path, visibility_map)
                    if children:
                        is_visible = visibility_map.get(entry, True)
                        items.append({
                            "type": "folder",
                            "name": entry,
                            "children": children,
                            "visibility": is_visible
                        })
            else:
                _, ext = os.path.splitext(entry)
                if ext.lower() in ALLOWED_EXTENSIONS:
                    rel_path = full_path.replace('\\', '/')
                    is_visible = visibility_map.get(rel_path, visibility_map.get(entry, True))
                    items.append({
                        "type": "file",
                        "name": entry.replace('.pdf', ''),
                        "path": rel_path,
                        "visibility": is_visible
                    })
    except Exception as e:
        print(f"Error scanning {path}: {e}")
    return items

def get_drive_config():
    """Extracts Drive config from googleDrive.js."""
    if not os.path.exists(DRIVE_CONFIG_FILE):
        return None, None
    with open(DRIVE_CONFIG_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    key_match = re.search(r"apiKey:\s*['\"](.*?)['\"]", content)
    id_match = re.search(r"folderId:\s*['\"](.*?)['\"]", content)
    return (key_match.group(1) if key_match else None, id_match.group(1) if id_match else None)

def fetch_drive_json(url):
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Drive API Error: {e}")
        return None

def sync_google_drive_classes():
    """Fetches classes from Drive and updates login.js."""
    api_key, folder_id = get_drive_config()
    if not api_key or not folder_id:
        print("Drive config not found in googleDrive.js. Skipping class sync.")
        return

    print("Fetching classes from Google Drive...")
    # 1. Find the "Années" or "Cours" folder
    base_url = "https://www.googleapis.com/drive/v3/files"
    query = f"'{folder_id}'+in+parents+and+trashed=false"
    fields = "files(id,name,mimeType)"
    data = fetch_drive_json(f"{base_url}?q={query}&fields={fields}&key={api_key}")
    
    if not data or 'files' not in data: return

    main_folder_id = None
    for f in data['files']:
        name = f['name'].lower()
        if 'anné' in name or 'cours' in name:
            main_folder_id = f['id']
            break
    
    # 2. Find the latest year
    target_id = main_folder_id if main_folder_id else folder_id
    data = fetch_drive_json(f"{base_url}?q='{target_id}'+in+parents+and+trashed=false&fields={fields}&key={api_key}")
    
    year_folders = [f for f in data['files'] if f['mimeType'] == 'application/vnd.google-apps.folder' and re.match(r'^\d{4}$', f['name'])]
    if year_folders:
        latest_year = sorted(year_folders, key=lambda x: x['name'], reverse=True)[0]
        print(f"Found latest year: {latest_year['name']}")
        # Get classes in that year
        class_data = fetch_drive_json(f"{base_url}?q='{latest_year['id']}'+in+parents+and+trashed=false&fields={fields}&key={api_key}")
        classes = [f['name'] for f in class_data['files'] if f['mimeType'] == 'application/vnd.google-apps.folder']
    else:
        # Fallback if no year folders
        classes = [f['name'] for f in data['files'] if f['mimeType'] == 'application/vnd.google-apps.folder' and f['name'].lower() != 'tips']

    if not classes:
        print("No classes found on Drive.")
        return

    # 3. Update login.js
    if not os.path.exists(LOGIN_FILE): return
    with open(LOGIN_FILE, 'r', encoding='utf-8') as f:
        login_content = f.read()

    # Find CLASS_PASSWORDS block
    match = re.search(r'const\s+CLASS_PASSWORDS\s*=\s*(\{.*?\});', login_content, re.DOTALL)
    if not match: return
    
    passwords_str = match.group(1)
    # This is a bit risky to parse as JSON because it's JS, but usually it's simple
    # Clean it up for json.loads: replace single quotes with double, handle trailing commas
    clean_pw = re.sub(r"'", '"', passwords_str)
    clean_pw = re.sub(r",\s*\}", "}", clean_pw)
    try:
        passwords = json.loads(clean_pw)
    except:
        # Fallback manual extraction if JSON fails
        passwords = {}
        for line in passwords_str.split('\n'):
            pw_match = re.search(r"['\"](.*?)['\"]\s*:\s*['\"](.*?)['\"]", line)
            if pw_match: passwords[pw_match.group(1)] = pw_match.group(2)

    updated = False
    for c in classes:
        if c not in passwords:
            print(f"\n--- Nouvelle classe déctectée : {c} ---")
            new_pw = input(f"Veuillez entrer un mot de passe pour {c} : ").strip()
            passwords[c] = new_pw
            updated = True
    
    if updated:
        # Reconstruct the JS object strictly
        new_passwords_js = "{\n"
        for c, p in sorted(passwords.items()):
            new_passwords_js += f"        '{c}': '{p}',\n"
        new_passwords_js = new_passwords_js.rstrip(',\n') + "\n    }"
        
        new_content = login_content.replace(match.group(1), new_passwords_js)
        with open(LOGIN_FILE, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("login.js mis à jour avec les nouveaux mots de passe.")

def update_files():
    # 1. Update tips_data.js
    print("Updating tips_data.js...")
    vis_tips = load_existing_visibility(TIPS_OUTPUT)
    tips = scan_directory(TIPS_DIR, vis_tips)
    tips_js = f"const TIPS_DATA = {json.dumps(tips, indent=4, ensure_ascii=False)};\n\nwindow.LOCAL_TIPS_DATA = TIPS_DATA;"
    with open(TIPS_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(tips_js)

    # 2. Update courses_data.js (local fallback)
    print("Updating courses_data.js...")
    vis_courses = load_existing_visibility(COURSES_OUTPUT)
    courses_data = {"courses": {}, "tips": tips, "generatedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    
    cours_dir = next((d for d in os.listdir('.') if os.path.isdir(d) and d.lower() == 'cours'), None)
    if cours_dir:
        year_folders = [f for f in os.listdir(cours_dir) if os.path.isdir(os.path.join(cours_dir, f)) and re.match(r'^\d{4}$', f)]
        if year_folders:
            for y in sorted(year_folders, reverse=True):
                courses_data["courses"][y] = scan_directory(os.path.join(cours_dir, y), vis_courses)
        else:
            courses_data["courses"] = scan_directory(cours_dir, vis_courses)
    
    courses_js = f"window.COURSE_DATA = {json.dumps(courses_data, indent=4, ensure_ascii=False)};"
    with open(COURSES_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(courses_js)

    # 3. Sync Drive classes
    sync_google_drive_classes()

if __name__ == "__main__":
    update_files()
    print("\nMise à jour terminée.")
