import os
import shutil
from pathlib import Path

def organize_files():
    # --- COMPREHENSIVE FILE TYPE DEFINITIONS ---
    file_types = {
        'compressed': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.z', '.lz', '.lz4', '.zst', '.pkg', '.deb', '.rpm', '.snap', '.flatpak', '.appimage'],
        'documents': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp', '.pages', '.numbers', '.key', '.xps', '.oxps'],
        'e-books': ['.epub', '.mobi', '.azw', '.azw3', '.fb2'],
        'programs': ['.exe', '.msi', '.app', '.dmg', '.run', '.apk', '.ipa', '.bin', '.command', '.sh', '.bat', '.ps1', '.jar', '.deb', '.rpm'],
        'videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mpg', '.mpeg', '.ts', '.vob', '.m2ts', '.mts', '.hevc'],
        'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.raw', '.heic', '.psd', '.avif', '.jxl'],
        'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au', '.ra'],
        'code': [
            # Web
            '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.php', '.asp', '.aspx', '.jsp',
            # Native & Compiled
            '.py', '.java', '.cpp', '.c', '.cc', '.cxx', '.h', '.hpp', '.cs', '.vb', '.go', '.rs', '.swift', '.kt', '.scala', '.m', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            # Data & Config
            '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sql',
            # Other Languages
            '.rb', '.pl', '.r', '.lua', '.dart', '.clj', '.hs', '.ml', '.fs', '.vim', '.dockerfile',
        ],
        'data': ['.csv', '.xlsx', '.xls', '.db', '.sqlite', '.sqlite3', '.mdb', '.sav', '.dat', '.parquet', '.arrow', '.feather'],
        'design': [
            # Graphics & UI/UX
            '.psd', '.ai', '.sketch', '.fig', '.xd', '.indd', '.eps', '.afphoto', '.afdesign',
            # 3D & CAD
            '.blend', '.c4d', '.max', '.obj', '.fbx', '.stl', '.dwg', '.dxf', '.3ds', '.dae'
        ],
        'fonts': ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
        'system': [
            # Logs & Backups
            '.log', '.bak', '.tmp', '.cache', '.old', '.swp',
            # Disk & VM Images
            '.iso', '.img', '.dmg', '.vhd', '.vmdk', '.ova', '.ovf',
            # Registry & System Files
            '.reg', '.crash', '.dmp', '.sys', '.dll'
        ],
        'misc': ['.torrent', '.magnet', '.key', '.pem', '.crt', '.p12']
    }
    
    # Get the current directory
    current_dir = Path('.')
    
    # Define the folders the script will create and protect
    folder_names = list(file_types.keys()) + ['other', 'extra folders']
    
    # --- STEP 1: CREATE ALL NECESSARY SUBFOLDERS ---
    print("Creating/verifying subfolders...")
    for folder in folder_names:
        folder_path = current_dir / folder
        folder_path.mkdir(exist_ok=True)
    
    # --- STEP 2: MOVE EXISTING FOLDERS INTO 'extra folders' ---
    print("\nMoving existing subfolders to 'extra folders'...")
    extra_folders_path = current_dir / 'extra folders'
    moved_folders = 0
    for item in current_dir.iterdir():
        if item.is_dir() and item.name not in folder_names:
            destination = extra_folders_path / item.name
            try:
                shutil.move(str(item), str(destination))
                print(f"Moved folder '{item.name}/' to 'extra folders/'")
                moved_folders += 1
            except Exception as e:
                print(f"Error moving folder {item.name}: {e}")
    
    if moved_folders == 0:
        print("No existing subfolders to move.")
        
    # --- STEP 3: MOVE FILES INTO THEIR RESPECTIVE CATEGORIES ---
    print("\nOrganizing files...")
    script_name = os.path.basename(__file__)
    files = [f for f in current_dir.iterdir() if f.is_file() and f.name != script_name]
    
    moved_files = 0
    skipped_files = 0
    
    for file_path in files:
        file_ext = file_path.suffix.lower()
        destination_folder = None
        
        # Find the correct category for the file
        for category, extensions in file_types.items():
            if file_ext in extensions:
                destination_folder = category
                break
        
        # If no category was found, use the 'other' folder
        if not destination_folder:
            destination_folder = 'other'
        
        # Prepare the full destination path
        destination = current_dir / destination_folder / file_path.name
        
        # --- ROBUST ERROR HANDLING FOR NAME CONFLICTS ---
        counter = 1
        original_destination = destination
        
        while True:
            try:
                shutil.move(str(file_path), str(destination))
                # Provide clear feedback, especially if renamed
                if destination.name != original_destination.name:
                    print(f"Moved {file_path.name} to {destination_folder}/ (renamed to {destination.name})")
                else:
                    print(f"Moved {file_path.name} to {destination_folder}/")
                
                moved_files += 1
                break  # Exit the loop on success
                
            except FileExistsError:
                # If a file with the same name exists, create a new name
                name = file_path.stem + f"_{counter}" + file_path.suffix
                destination = current_dir / destination_folder / name
                counter += 1
            
            except Exception as e:
                # Catch other potential errors (e.g., permissions)
                print(f"Error moving {file_path.name}: {e}")
                skipped_files += 1
                break # Exit the loop on other errors
    
    print(f"\nOrganization complete!")
    print(f"  - Moved {moved_folders} folders.")
    print(f"  - Moved {moved_files} files.")
    print(f"  - Skipped {skipped_files} files due to errors.")

if __name__ == "__main__":
    print("Ultimate File Organizer Script")
    print("===============================")
    print("This script will organize files and folders in the current directory.")
    print("It will create subfolders and move items accordingly.")
    
    # Ask for confirmation before proceeding
    confirm = input("Do you want to continue? (y/n): ").lower()
    if confirm == 'y':
        organize_files()
    else:
        print("Operation cancelled.")