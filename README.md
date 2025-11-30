# Aindexo - AI-Powered File Organizer

An intelligent desktop application that automatically organizes your files using machine learning and semantic embeddings. Built with C# (.NET 8) backend and Electron + React frontend.

## Features

- **AI-Powered Organization**: Automatically categorizes files using ML embeddings
- **Persistent Index**: Incremental scanning - only processes new or changed files
- **Semantic Search**: Find files by meaning, not just filename
- **8 Smart Categories**: Images, Documents, Videos, Music, Archives, Code, Executables, and Miscellaneous
- **Beautiful UI**: Modern glassmorphism design with custom cursor and animations
- **Fast Scanning**: Uses Win32 API for high-performance file system traversal

## Tech Stack

### Backend
- **C# (.NET 8)**: High-performance file scanning and indexing
- **ONNX Runtime**: ML inference with MiniLM sentence transformer
- **SQLite**: Persistent file metadata and embeddings storage
- **P/Invoke**: Direct Win32 API calls for maximum speed

### Frontend
- **Electron**: Cross-platform desktop app framework
- **React**: Component-based UI
- **TailwindCSS**: Modern styling
- **GSAP**: Smooth animations

## Project Structure

```
Aindexo/
├── project/
│   ├── backend/              # C# Backend
│   │   ├── Program.cs        # Main entry point
│   │   ├── DirectoryScanner.cs  # File system scanning
│   │   ├── EmbeddingEngine.cs   # ML embeddings
│   │   ├── SQLiteStore.cs       # Database operations
│   │   ├── OrganizerEngine.cs   # File classification
│   │   ├── IPC.cs               # Frontend communication
│   │   ├── MetadataExtractor.cs # File metadata
│   │   ├── ExclusionRules.cs    # System folder filtering
│   │   └── models/              # ONNX model files
│   │
│   └── electron/            # Electron Frontend
│       ├── main.js          # Electron main process
│       ├── preload.js       # IPC bridge
│       ├── package.json
│       ├── tailwind.config.js
│       └── renderer/        # React UI
│           ├── index.html
│           ├── App.jsx
│           ├── TargetCursor.jsx
│           ├── StarBorder.jsx
│           └── components/
│               ├── FolderCard.jsx
│               ├── FileCard.jsx
│               └── OrganizeButton.jsx
│
└── README.md
```

## Prerequisites

- **Windows 10/11** (uses Win32 APIs)
- **.NET 8 SDK**: [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **MiniLM ONNX Model**: Download from [Hugging Face](https://huggingface.co/optimum/all-MiniLM-L6-v2/resolve/main/model.onnx)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Omprakash-p06/Aindexo.git
cd Aindexo
```

### 2. Download ML Model

Download the MiniLM ONNX model and place it in:
```
project/backend/models/minilm.onnx
```

### 3. Build Backend

```bash
cd project/backend
dotnet build
```

### 4. Install Frontend Dependencies

```bash
cd ../electron
npm install
```

### 5. Build TailwindCSS

```bash
npm run build:css
```

## Running the Application

From the `electron` directory:

```bash
npm start
```

The app will:
1. Start the C# backend
2. Launch the Electron window
3. Display the main interface

## Usage

### First Time Scan

1. Click **"Scan Files"** to index your files
2. The app scans: Downloads, Documents, Pictures, Desktop, Music, Videos
3. A popup shows the scan summary (new, updated, deleted files)

### Organizing Files

1. Click **"Organize"** to see AI suggestions
2. Files are categorized into smart folders
3. Scroll through the preview to see all suggestions
4. Click **"Confirm Move"** to execute the organization

### Subsequent Scans

- The database persists at: `%LOCALAPPDATA%\Aindexo\files.db`
- Only new or changed files are scanned (much faster!)
- Deleted files are automatically removed from the index

### Semantic Search

- Type in the search box to find files by meaning
- Example: "vacation photos" finds images even if not in filename
- Results show similarity score

## Database Location

The file index is stored at:
```
C:\Users\<YourName>\AppData\Local\Aindexo\files.db
```

## Development

### Backend Development

```bash
cd project/backend
dotnet watch run
```

### Frontend Development

```bash
cd project/electron
npm run build:css
npm start
```

### Building for Production

```bash
cd project/backend
dotnet publish -c Release

cd ../electron
npm run build
```

## Architecture

### Incremental Scanning
- Stores file state (path, size, modified timestamp)
- Compares current state with database
- Only indexes new/changed files
- Removes deleted files

### ML Classification
- Generates 384-dimensional embeddings using MiniLM
- Falls back to extension-based classification
- Supports 8 smart categories
- Stores embeddings in SQLite for fast retrieval

### IPC Communication
- Backend communicates via JSON over stdin/stdout
- Frontend uses Electron IPC bridge
- Events: scan, organize, status, progress, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- MiniLM model from Hugging Face
- ONNX Runtime team
- Electron and React communities
