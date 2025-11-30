namespace FileIndexer;

public static class ExclusionRules
{
    public static readonly HashSet<string> SkippedDirectories = new(StringComparer.OrdinalIgnoreCase)
    {
        "Windows",
        "Program Files",
        "Program Files (x86)",
        "ProgramData",
        "$Recycle.Bin",
        "System Volume Information",
        "AppData",
        "node_modules",
        ".git",
        ".vs",
        ".vscode",
        ".idea",
        "obj",
        "bin"
    };

    public static bool ShouldSkip(string dirName)
    {
        return SkippedDirectories.Contains(dirName);
    }
}
