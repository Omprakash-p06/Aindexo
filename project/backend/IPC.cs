using System.Text.Json;

namespace FileIndexer;

public static class IPC
{
    private static readonly object _lock = new();

    public static void Send(string eventName, object data)
    {
        var message = new { @event = eventName, data };
        string json = JsonSerializer.Serialize(message);
        
        lock (_lock)
        {
            Console.WriteLine(json);
            Console.Out.Flush();
        }
    }

    public static void SendProgress(int count)
    {
        Send("progress", new { foldersScanned = count });
    }

    public static void SendError(string message)
    {
        Send("error", new { message });
    }

    public static Command? ReadCommand()
    {
        try
        {
            string? line = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(line)) return null;
            return JsonSerializer.Deserialize<Command>(line);
        }
        catch
        {
            return null;
        }
    }
}

public class Command
{
    public string action { get; set; } = "";
    public JsonElement payload { get; set; }
}
