using System.Collections.Concurrent;
using System.Runtime.InteropServices;

namespace FileIndexer;

public class DirectoryScanner
{
    private readonly SQLiteStore _store;
    private readonly EmbeddingEngine _embedder;
    private readonly ConcurrentQueue<string> _directories = new();
    private int _scannedCount = 0;

    public DirectoryScanner(SQLiteStore store, EmbeddingEngine embedder)
    {
        _store = store;
        _embedder = embedder;
    }

    public async Task ScanAll(string[] rootPaths, CancellationToken token)
    {
        foreach (var path in rootPaths)
        {
            if (Directory.Exists(path)) _directories.Enqueue(path);
        }

        var options = new ParallelOptions 
        { 
            MaxDegreeOfParallelism = Environment.ProcessorCount,
            CancellationToken = token 
        };

        try
        {
            await Task.Run(() =>
            {
                while (!_directories.IsEmpty && !token.IsCancellationRequested)
                {
                    if (_directories.TryDequeue(out var currentDir))
                    {
                        // Console.Error.WriteLine($"Scanning dir: {currentDir}");
                        ScanDirectory(currentDir, token);
                    }
                }
            }, token);
        }
        catch (OperationCanceledException) { }
    }

    private void ScanDirectory(string dirPath, CancellationToken token)
    {
        if (ExclusionRules.ShouldSkip(Path.GetFileName(dirPath))) return;

        WIN32_FIND_DATA findData;
        IntPtr hFind = FindFirstFileExW(
            Path.Combine(dirPath, "*"),
            FindExInfoBasic,
            out findData,
            FindExSearchNameMatch,
            IntPtr.Zero,
            FIND_FIRST_EX_LARGE_FETCH);

        if (hFind == INVALID_HANDLE_VALUE) return;

        try
        {
            do
            {
                if (token.IsCancellationRequested) break;

                string name = findData.cFileName;
                if (name == "." || name == "..") continue;

                string fullPath = Path.Combine(dirPath, name);

                if ((findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0)
                {
                    if (!ExclusionRules.ShouldSkip(name))
                    {
                        _directories.Enqueue(fullPath);
                    }
                }
                else
                {
                    ProcessFile(fullPath);
                }

            } while (FindNextFileW(hFind, out findData));
        }
        finally
        {
            FindClose(hFind);
        }
    }

    private int _newFilesCount = 0;
    private int _updatedFilesCount = 0;
    private int _deletedFilesCount = 0;

    public async Task ScanIncremental(string[] rootPaths, CancellationToken token)
    {
        // Reset counters
        _scannedCount = 0;
        _newFilesCount = 0;
        _updatedFilesCount = 0;
        _deletedFilesCount = 0;

        var previous = _store.GetExistingPaths();
        var seen = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);
        
        Console.Error.WriteLine($"Starting incremental scan. Database has {previous.Count} files.");
        
        // Enqueue roots
        foreach (var path in rootPaths)
        {
            if (Directory.Exists(path)) _directories.Enqueue(path);
        }

        try
        {
            await Task.Run(() =>
            {
                while (!_directories.IsEmpty && !token.IsCancellationRequested)
                {
                    if (_directories.TryDequeue(out var currentDir))
                    {
                        ScanDirectoryIncremental(currentDir, previous, seen, token);
                    }
                }
            }, token);
        }
        catch (OperationCanceledException) { }

        // Cleanup deleted files
        foreach (var oldPath in previous)
        {
            if (!seen.ContainsKey(oldPath))
            {
                bool belongsToRoot = rootPaths.Any(r => oldPath.StartsWith(r, StringComparison.OrdinalIgnoreCase));
                if (belongsToRoot)
                {
                    _store.DeleteFile(oldPath);
                    _deletedFilesCount++;
                }
            }
        }
        
        _store.Commit();

        // Send summary
        Console.Error.WriteLine($"Scan summary: {_newFilesCount} new, {_updatedFilesCount} updated, {_deletedFilesCount} deleted, {seen.Count} total checked");
        IPC.Send("scanSummary", new { 
            newFiles = _newFilesCount, 
            updatedFiles = _updatedFilesCount, 
            deletedFiles = _deletedFilesCount,
            totalChecked = seen.Count,
            totalInDb = _store.GetTotalFileCount()
        });
    }

    private void ScanDirectoryIncremental(string dirPath, HashSet<string> previous, ConcurrentDictionary<string, byte> seen, CancellationToken token)
    {
        if (ExclusionRules.ShouldSkip(Path.GetFileName(dirPath))) return;

        WIN32_FIND_DATA findData;
        IntPtr hFind = FindFirstFileExW(
            Path.Combine(dirPath, "*"),
            FindExInfoBasic,
            out findData,
            FindExSearchNameMatch,
            IntPtr.Zero,
            FIND_FIRST_EX_LARGE_FETCH);

        if (hFind == INVALID_HANDLE_VALUE) return;

        try
        {
            do
            {
                if (token.IsCancellationRequested) break;

                string name = findData.cFileName;
                if (name == "." || name == "..") continue;

                string fullPath = Path.Combine(dirPath, name);

                if ((findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0)
                {
                    if (!ExclusionRules.ShouldSkip(name))
                    {
                        _directories.Enqueue(fullPath);
                    }
                }
                else
                {
                    seen.TryAdd(fullPath, 0);
                    
                    long size = (long)((ulong)findData.nFileSizeHigh << 32 | findData.nFileSizeLow);
                    long modified = ((long)findData.ftLastWriteTime.dwHighDateTime << 32) | (uint)findData.ftLastWriteTime.dwLowDateTime;

                    if (!previous.Contains(fullPath))
                    {
                        _newFilesCount++;
                        IndexNewFile(fullPath, size, modified);
                    }
                    else
                    {
                        var (oldSize, oldMod) = _store.GetFileState(fullPath);
                        if (oldSize != size || oldMod != modified)
                        {
                            _updatedFilesCount++;
                            IndexUpdatedFile(fullPath, size, modified);
                        }
                    }
                }

            } while (FindNextFileW(hFind, out findData));
        }
        finally
        {
            FindClose(hFind);
        }
    }

    private void IndexNewFile(string path, long size, long modified)
    {
        ProcessFile(path, size, modified);
    }

    private void IndexUpdatedFile(string path, long size, long modified)
    {
        ProcessFile(path, size, modified);
    }

    private void ProcessFile(string path, long size = -1, long modified = -1)
    {
        // If size/mod not provided (legacy call), get them from metadata
        FileMetadata? metadata = null;
        if (size == -1 || modified == -1)
        {
            metadata = MetadataExtractor.GetMetadata(path);
            if (metadata == null) return;
            size = metadata.Size;
            modified = metadata.ModifiedTime;
        }

        // Update DB state
        _store.UpsertFileState(path, size, modified);
        
        // Update Metadata table (files) - get full metadata if we don't have it
        if (metadata == null)
        {
            metadata = MetadataExtractor.GetMetadata(path);
            if (metadata == null) return;
        }
        
        _store.InsertOrUpdateMetadata(metadata, path);

        // Generate embedding
        try 
        {
            string ext = Path.GetExtension(path).ToLower();
            if (new[] { ".txt", ".md", ".cs", ".js", ".json" }.Contains(ext))
            {
                string content = File.ReadAllText(path).Substring(0, Math.Min((int)new FileInfo(path).Length, 1024));
                var embedding = _embedder.GetEmbedding(System.IO.Path.GetFileName(path) + " " + content);
                _store.InsertEmbedding(path, embedding);
            }
            else
            {
                var embedding = _embedder.GetEmbedding(System.IO.Path.GetFileName(path));
                _store.InsertEmbedding(path, embedding);
            }
        }
        catch {}

        Interlocked.Increment(ref _scannedCount);
        if (_scannedCount % 10 == 0)
        {
            IPC.SendProgress(_scannedCount);
        }
    }

    // P/Invoke definitions
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern IntPtr FindFirstFileExW(
        string lpFileName,
        int fInfoLevelId,
        out WIN32_FIND_DATA lpFindFileData,
        int fSearchOp,
        IntPtr lpSearchFilter,
        int dwAdditionalFlags);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool FindNextFileW(IntPtr hFindFile, out WIN32_FIND_DATA lpFindFileData);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool FindClose(IntPtr hFindFile);

    private const int FindExInfoBasic = 1;
    private const int FindExSearchNameMatch = 0;
    private const int FIND_FIRST_EX_LARGE_FETCH = 2;
    private static readonly IntPtr INVALID_HANDLE_VALUE = new IntPtr(-1);
    private const int FILE_ATTRIBUTE_DIRECTORY = 16;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WIN32_FIND_DATA
    {
        public uint dwFileAttributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftCreationTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftLastAccessTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftLastWriteTime;
        public uint nFileSizeHigh;
        public uint nFileSizeLow;
        public uint dwReserved0;
        public uint dwReserved1;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string cFileName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 14)]
        public string cAlternateFileName;
    }
}
