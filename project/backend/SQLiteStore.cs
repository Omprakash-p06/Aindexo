using Microsoft.Data.Sqlite;

namespace FileIndexer;

public class SQLiteStore : IDisposable
{
    private readonly SqliteConnection _connection;

    public SQLiteStore(string dbPath)
    {
        _connection = new SqliteConnection($"Data Source={dbPath}");
        _connection.Open();
        Initialize();
    }

    private void Initialize()
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = @"
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            CREATE TABLE IF NOT EXISTS files (
                volume INTEGER,
                fileIdLow INTEGER,
                fileIdHigh INTEGER,
                path TEXT UNIQUE,
                size INTEGER,
                modified INTEGER,
                embedding BLOB,
                PRIMARY KEY(volume, fileIdLow, fileIdHigh)
            );
            CREATE TABLE IF NOT EXISTS file_state (
                path TEXT PRIMARY KEY,
                size INTEGER,
                modified INTEGER
            );
        ";
        cmd.ExecuteNonQuery();
    }

    public void InsertOrUpdateMetadata(FileMetadata metadata, string path)
    {
        using var cmd = _connection.CreateCommand();
        
        // First, delete any existing record with this path but different FileID (stale entry)
        cmd.CommandText = "DELETE FROM files WHERE path = $path AND (volume != $vol OR fileIdLow != $low OR fileIdHigh != $high)";
        cmd.Parameters.AddWithValue("$vol", metadata.Volume);
        cmd.Parameters.AddWithValue("$low", metadata.FileIdLow);
        cmd.Parameters.AddWithValue("$high", metadata.FileIdHigh);
        cmd.Parameters.AddWithValue("$path", path);
        cmd.ExecuteNonQuery();

        // Now perform the upsert based on FileID
        cmd.CommandText = @"
            INSERT INTO files (volume, fileIdLow, fileIdHigh, path, size, modified)
            VALUES ($vol, $low, $high, $path, $size, $mod)
            ON CONFLICT(volume, fileIdLow, fileIdHigh) DO UPDATE SET
                path = excluded.path,
                size = excluded.size,
                modified = excluded.modified;
        ";
        // Parameters are already added above, but we need to add size and mod
        cmd.Parameters.AddWithValue("$size", metadata.Size);
        cmd.Parameters.AddWithValue("$mod", metadata.ModifiedTime);
        cmd.ExecuteNonQuery();
    }

    public void UpsertFileState(string path, long size, long modified)
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO file_state(path,size,modified) VALUES($p,$s,$m)
            ON CONFLICT(path) DO UPDATE SET size=$s, modified=$m";
        cmd.Parameters.AddWithValue("$p", path);
        cmd.Parameters.AddWithValue("$s", size);
        cmd.Parameters.AddWithValue("$m", modified);
        cmd.ExecuteNonQuery();
    }

    public void DeleteFile(string path)
    {
        using var cmd1 = _connection.CreateCommand();
        cmd1.CommandText = "DELETE FROM files WHERE path=$p";
        cmd1.Parameters.AddWithValue("$p", path);
        cmd1.ExecuteNonQuery();

        using var cmd2 = _connection.CreateCommand();
        cmd2.CommandText = "DELETE FROM file_state WHERE path=$p";
        cmd2.Parameters.AddWithValue("$p", path);
        cmd2.ExecuteNonQuery();
    }

    public void ClearDatabase()
    {
        try 
        {
            using var cmd = _connection.CreateCommand();
            cmd.CommandText = @"
                DELETE FROM files;
                DELETE FROM file_state;
            ";
            int rows = cmd.ExecuteNonQuery();
            Console.Error.WriteLine($"ClearDatabase: Deleted rows. Rows affected: {rows}");
            
            // Force checkpoint
            using var cmd2 = _connection.CreateCommand();
            cmd2.CommandText = "PRAGMA wal_checkpoint(FULL);";
            cmd2.ExecuteNonQuery();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"ClearDatabase failed: {ex}");
            throw;
        }
    }

    public HashSet<string> GetExistingPaths()
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "SELECT path FROM file_state";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
            set.Add(reader.GetString(0));
        return set;
    }

    public (long Size, long Modified) GetFileState(string path)
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "SELECT size, modified FROM file_state WHERE path=$p";
        cmd.Parameters.AddWithValue("$p", path);
        using var reader = cmd.ExecuteReader();
        if (reader.Read())
        {
            return (reader.GetInt64(0), reader.GetInt64(1));
        }
        return (-1, -1);
    }

    public bool IsFileStateValid()
    {
        // Simple check if table exists and has data
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "SELECT count(*) FROM file_state";
        try
        {
            var count = (long)cmd.ExecuteScalar()!;
            return count > 0;
        }
        catch
        {
            return false;
        }
    }

    public long GetTotalFileCount()
    {
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "SELECT count(*) FROM file_state";
        try
        {
            return (long)cmd.ExecuteScalar()!;
        }
        catch
        {
            return 0;
        }
    }

    public void Commit()
    {
        // Force a checkpoint to ensure data is written from WAL to the main DB file
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "PRAGMA wal_checkpoint(FULL);";
        cmd.ExecuteNonQuery();
    }

    public void InsertEmbedding(string path, float[] embedding)
    {
        byte[] bytes = new byte[embedding.Length * 4];
        Buffer.BlockCopy(embedding, 0, bytes, 0, bytes.Length);

        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "UPDATE files SET embedding = $emb WHERE path = $path";
        cmd.Parameters.AddWithValue("$emb", bytes);
        cmd.Parameters.AddWithValue("$path", path);
        cmd.ExecuteNonQuery();
    }

    public List<(string Path, float[] Embedding)> GetAllEmbeddings()
    {
        var results = new List<(string, float[])>();
        using var cmd = _connection.CreateCommand();
        cmd.CommandText = "SELECT path, embedding FROM files WHERE embedding IS NOT NULL";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            string path = reader.GetString(0);
            byte[] bytes = (byte[])reader["embedding"];
            float[] floats = new float[bytes.Length / 4];
            Buffer.BlockCopy(bytes, 0, floats, 0, bytes.Length);
            results.Add((path, floats));
        }
        return results;
    }

    public (long totalFiles, long filesWithEmbeddings, long filesWithoutEmbeddings) GetFileStats()
    {
        long total = 0;
        long withEmbedding = 0;

        using var cmd1 = _connection.CreateCommand();
        cmd1.CommandText = "SELECT count(*) FROM files";
        total = (long)cmd1.ExecuteScalar()!;

        using var cmd2 = _connection.CreateCommand();
        cmd2.CommandText = "SELECT count(*) FROM files WHERE embedding IS NOT NULL";
        withEmbedding = (long)cmd2.ExecuteScalar()!;

        return (total, withEmbedding, total - withEmbedding);
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
