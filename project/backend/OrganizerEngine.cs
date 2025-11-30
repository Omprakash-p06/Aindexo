namespace FileIndexer;

public class OrganizerEngine
{
    private readonly SQLiteStore _store;

    public OrganizerEngine(SQLiteStore store)
    {
        _store = store;
    }

    public OrganizePreview PreviewOrganization(string targetDir)
    {
        var files = _store.GetAllEmbeddings();
        Console.Error.WriteLine($"PreviewOrganization: Found {files.Count} files with embeddings");
        
        var categories = new Dictionary<string, List<string>>();

        int filteredCount = 0;
        foreach (var file in files)
        {
            // Only organize files within the targetDir
            if (!file.Path.StartsWith(targetDir, StringComparison.OrdinalIgnoreCase)) continue;
            filteredCount++;

            string ext = Path.GetExtension(file.Path).ToLower();
            string bestCategory = ClassifyFileByEmbedding(file.Embedding, ext);

            if (!categories.ContainsKey(bestCategory))
            {
                categories[bestCategory] = new List<string>();
            }
            categories[bestCategory].Add(file.Path);
        }

        Console.Error.WriteLine($"PreviewOrganization: {filteredCount} files in target directory, {categories.Sum(c => c.Value.Count)} files categorized");

        return new OrganizePreview
        {
            Categories = categories.Select(kv => new CategoryPreview 
            { 
                Name = kv.Key, 
                Files = kv.Value.ToArray() 
            }).ToArray()
        };
    }

    public string ClassifyFileByEmbedding(float[] embedding, string ext)
    {
        if (new[] { ".jpg", ".png", ".gif", ".bmp", ".webp", ".svg", ".tiff" }.Contains(ext)) return "Images";
        if (new[] { ".pdf", ".docx", ".doc", ".txt", ".md", ".xlsx", ".xls", ".pptx", ".ppt", ".csv" }.Contains(ext)) return "Documents";
        if (new[] { ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm" }.Contains(ext)) return "Videos";
        if (new[] { ".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a" }.Contains(ext)) return "Music";
        if (new[] { ".zip", ".rar", ".7z", ".tar", ".gz", ".iso" }.Contains(ext)) return "Archives";
        if (new[] { ".exe", ".msi", ".bat", ".sh", ".apk" }.Contains(ext)) return "Executables";
        if (new[] { ".cs", ".js", ".py", ".html", ".css", ".json", ".java", ".cpp", ".h", ".ts", ".sql" }.Contains(ext)) return "Code";

        // AI Fallback (simplified for MVP)
        // In a real scenario, we'd compare against learned centroids.
        return "Miscellaneous";
    }

    public Dictionary<string, object> Organize(string rootFolder)
    {
        var preview = PreviewOrganization(rootFolder);
        int moved = 0;
        int skipped = 0;

        foreach (var category in preview.Categories)
        {
            string categoryDir = Path.Combine(rootFolder, category.Name);
            Directory.CreateDirectory(categoryDir);

            foreach (var filePath in category.Files)
            {
                if (!File.Exists(filePath)) 
                {
                    skipped++;
                    continue;
                }

                // Don't move if already in the category folder
                if (Path.GetDirectoryName(filePath)!.Equals(categoryDir, StringComparison.OrdinalIgnoreCase))
                {
                    skipped++;
                    continue;
                }

                string fileName = Path.GetFileName(filePath);
                string destPath = Path.Combine(categoryDir, fileName);

                // Handle duplicates
                int counter = 1;
                while (File.Exists(destPath))
                {
                    string nameNoExt = Path.GetFileNameWithoutExtension(fileName);
                    string ext = Path.GetExtension(fileName);
                    destPath = Path.Combine(categoryDir, $"{nameNoExt} ({counter++}){ext}");
                }

                try
                {
                    File.Move(filePath, destPath);
                    // Update DB path? 
                    // Ideally we should update the DB, but for MVP we might just let the next scan fix it.
                    // Or we can delete the old path from DB and add the new one.
                    _store.DeleteFile(filePath); 
                    // We don't have the new file's metadata handy to insert immediately without re-scanning.
                    // So we rely on the next incremental scan to pick it up.
                    
                    moved++;
                }
                catch
                {
                    skipped++;
                }
            }
        }

        return new Dictionary<string, object>
        {
            { "event", "organize-complete" },
            { "moved", moved },
            { "skipped", skipped }
        };
    }

    // Helper to analyze files (unused in main flow but requested)
    public List<(string Path, float[] Embedding)> AnalyzeFilesInFolder(string folderPath)
    {
        return _store.GetAllEmbeddings()
            .Where(f => f.Path.StartsWith(folderPath, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public void ExecuteOrganization(OrganizePreview preview, string targetBaseDir)
    {
        // Re-using the logic from Organize, but for the specific preview
        foreach (var category in preview.Categories)
        {
            string categoryDir = Path.Combine(targetBaseDir, category.Name);
            Directory.CreateDirectory(categoryDir);

            foreach (var filePath in category.Files)
            {
                if (!File.Exists(filePath)) continue;

                string fileName = Path.GetFileName(filePath);
                string destPath = Path.Combine(categoryDir, fileName);

                int counter = 1;
                while (File.Exists(destPath))
                {
                    string nameNoExt = Path.GetFileNameWithoutExtension(fileName);
                    string ext = Path.GetExtension(fileName);
                    destPath = Path.Combine(categoryDir, $"{nameNoExt} ({counter++}){ext}");
                }

                try
                {
                    File.Move(filePath, destPath);
                    _store.DeleteFile(filePath); // Remove old path from DB
                }
                catch (Exception ex)
                {
                    IPC.SendError($"Failed to move {filePath}: {ex.Message}");
                }
            }
        }
    }


}

public class OrganizePreview
{
    public CategoryPreview[] Categories { get; set; } = Array.Empty<CategoryPreview>();
}

public class CategoryPreview
{
    public string Name { get; set; } = "";
    public string[] Files { get; set; } = Array.Empty<string>();
}
