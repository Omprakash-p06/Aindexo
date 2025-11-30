using System.Collections.Concurrent;
using System.Text.Json;

namespace FileIndexer;

class Program
{
    private static CancellationTokenSource _cts = new();
    private static bool _isRunning = true;

    static async Task Main(string[] args)
    {
        try 
        {
            Console.Error.WriteLine("Backend starting...");
            string modelPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "models", "minilm.onnx");
            Console.Error.WriteLine($"Looking for model at: {modelPath}");
            
            if (File.Exists(modelPath)) Console.Error.WriteLine("Model file found.");
            else Console.Error.WriteLine("Model file NOT found.");

            // Use absolute path in user's local AppData
            string dbPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Aindexo",
                "files.db"
            );
            Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
            Console.Error.WriteLine($"Database path: {dbPath}");
            
            using var store = new SQLiteStore(dbPath);
            
            EmbeddingEngine? embedder = null;
            try 
            {
                if (File.Exists(modelPath)) 
                {
                    embedder = new EmbeddingEngine(modelPath);
                    Console.Error.WriteLine("EmbeddingEngine initialized successfully.");
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Failed to init EmbeddingEngine: {ex}");
            }

            if (!store.IsFileStateValid())
            {
                Console.Error.WriteLine("Database index invalid or empty. Full scan required.");
            }
            else
            {
                long totalFiles = store.GetTotalFileCount();
                var (total, withEmbedding, withoutEmbedding) = store.GetFileStats();
                Console.Error.WriteLine($"Database contains {totalFiles} indexed files.");
                Console.Error.WriteLine($"Files: {total} total, {withEmbedding} with embeddings, {withoutEmbedding} without embeddings");
                IPC.Send("indexStatus", new { totalFiles, filesWithEmbeddings = withEmbedding, filesWithoutEmbeddings = withoutEmbedding });
            }

            var scanner = new DirectoryScanner(store, embedder!); 
            var organizer = new OrganizerEngine(store);

            IPC.Send("ready", new { version = "1.0.0" });
            Console.Error.WriteLine("Backend ready and waiting for commands.");

            while (_isRunning)
            {
                try
                {
                    var cmd = IPC.ReadCommand();
                    if (cmd == null)
                    {
                        await Task.Delay(100);
                        continue;
                    }
                    
                    Console.Error.WriteLine($"Received command: {cmd.action}");

                    switch (cmd.action)
                    {
                        case "scan":
                            _cts = new CancellationTokenSource();
                            _ = Task.Run(() => RunScan(scanner, _cts.Token));
                            break;

                        case "resumeIndex":
                            _cts = new CancellationTokenSource();
                            _ = Task.Run(() => RunResumeIndex(scanner, _cts.Token));
                            break;

                        case "organize":
                            string targetDir = "";
                            if (cmd.payload.ValueKind != JsonValueKind.Undefined && cmd.payload.TryGetProperty("targetDir", out var prop))
                                targetDir = prop.GetString() ?? "";
                            
                            _ = Task.Run(() => RunOrganize(organizer, targetDir));
                            break;
                        
                        case "executeOrganize":
                            var preview = JsonSerializer.Deserialize<OrganizePreview>(cmd.payload.GetRawText());
                            string baseDir = cmd.payload.GetProperty("targetDir").GetString() ?? "";
                            _ = Task.Run(() => organizer.ExecuteOrganization(preview!, baseDir));
                            IPC.Send("organizeComplete", new {});
                            break;

                        case "query":
                            string query = cmd.payload.GetProperty("query").GetString() ?? "";
                            _ = Task.Run(() => RunQuery(store, embedder, query));
                            break;

                        case "stop":
                            _cts.Cancel();
                            IPC.Send("stopped", new { });
                            break;
                            
                        case "exit":
                            _isRunning = false;
                            break;

                        case "clear_data":
                            Console.Error.WriteLine("Executing clear_data command...");
                            store.ClearDatabase();
                            Console.Error.WriteLine("Database cleared successfully.");
                            IPC.Send("dataCleared", new { });
                            break;
                    }
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Error in main loop: {ex}");
                    IPC.SendError(ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Fatal error: {ex}");
        }
    }

    static async Task RunScan(DirectoryScanner scanner, CancellationToken token)
    {
        try
        {
            Console.Error.WriteLine("Starting scan...");
            IPC.Send("status", new { state = "scanning" });
            
            // Scan common user folders
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string[] roots = new[] 
            { 
                Path.Combine(userProfile, "Downloads"),
                Path.Combine(userProfile, "Documents"),
                Path.Combine(userProfile, "Pictures"),
                Path.Combine(userProfile, "Desktop"),
                Path.Combine(userProfile, "Music"),
                Path.Combine(userProfile, "Videos")
            };
            
            Console.Error.WriteLine($"Scanning roots: {string.Join(", ", roots)}");

            // Use ScanIncremental for both fresh and incremental scans as it handles both cases
            await scanner.ScanIncremental(roots, token);
            
            Console.Error.WriteLine("Scan complete.");
            IPC.Send("scanComplete", new { });
        }
        catch (OperationCanceledException)
        {
            Console.Error.WriteLine("Scan canceled.");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Scan failed: {ex}");
            IPC.SendError($"Scan failed: {ex.Message}");
        }
        finally
        {
            IPC.Send("status", new { state = "idle" });
        }
    }

    static async Task RunResumeIndex(DirectoryScanner scanner, CancellationToken token)
    {
        // Same as RunScan but triggered via resumeIndex
        await RunScan(scanner, token);
    }

    static async Task RunOrganize(OrganizerEngine organizer, string targetDir)
    {
        try
        {
            Console.Error.WriteLine($"Starting organize for: {targetDir}");
            IPC.Send("status", new { state = "organizing" });
            
            var preview = organizer.PreviewOrganization(targetDir);
            Console.Error.WriteLine($"Generated preview with {preview.Categories.Length} categories.");
            
            IPC.Send("organizePreview", preview);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Organize failed: {ex}");
            IPC.SendError($"Organize failed: {ex.Message}");
        }
        finally
        {
            IPC.Send("status", new { state = "idle" });
        }
    }

    static async Task RunQuery(SQLiteStore store, EmbeddingEngine? embedder, string query)
    {
        try
        {
            if (embedder == null) 
            {
                IPC.SendError("Model not loaded. Cannot search.");
                return;
            }

            var queryEmb = embedder.GetEmbedding(query);
            var allFiles = store.GetAllEmbeddings();
            
            var results = allFiles
                .Select(f => new { Path = f.Path, Score = CosineSimilarity(queryEmb, f.Embedding) })
                .OrderByDescending(x => x.Score)
                .Take(20)
                .ToList();

            IPC.Send("searchResults", new { results });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Query failed: {ex}");
            IPC.SendError($"Query failed: {ex.Message}");
        }
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }
}
