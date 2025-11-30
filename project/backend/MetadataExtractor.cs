using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;

namespace FileIndexer;

public class MetadataExtractor
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern SafeFileHandle CreateFileW(
        string lpFileName,
        uint dwDesiredAccess,
        uint dwShareMode,
        IntPtr lpSecurityAttributes,
        uint dwCreationDisposition,
        uint dwFlagsAndAttributes,
        IntPtr hTemplateFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool GetFileInformationByHandle(
        SafeFileHandle hFile,
        out BY_HANDLE_FILE_INFORMATION lpFileInformation);

    [StructLayout(LayoutKind.Sequential)]
    public struct BY_HANDLE_FILE_INFORMATION
    {
        public uint dwFileAttributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftCreationTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftLastAccessTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME ftLastWriteTime;
        public uint dwVolumeSerialNumber;
        public uint nFileSizeHigh;
        public uint nFileSizeLow;
        public uint nNumberOfLinks;
        public uint nFileIndexHigh;
        public uint nFileIndexLow;
    }

    private const uint GENERIC_READ = 0x80000000;
    private const uint FILE_SHARE_READ = 0x00000001;
    private const uint OPEN_EXISTING = 3;
    private const uint FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;

    public static FileMetadata? GetMetadata(string path)
    {
        using var handle = CreateFileW(
            path,
            GENERIC_READ,
            FILE_SHARE_READ,
            IntPtr.Zero,
            OPEN_EXISTING,
            FILE_FLAG_BACKUP_SEMANTICS,
            IntPtr.Zero);

        if (handle.IsInvalid) return null;

        if (GetFileInformationByHandle(handle, out var info))
        {
            long size = ((long)info.nFileSizeHigh << 32) | info.nFileSizeLow;
            long creation = ((long)info.ftCreationTime.dwHighDateTime << 32) | (uint)info.ftCreationTime.dwLowDateTime;
            long modified = ((long)info.ftLastWriteTime.dwHighDateTime << 32) | (uint)info.ftLastWriteTime.dwLowDateTime;

            return new FileMetadata
            {
                Volume = info.dwVolumeSerialNumber,
                FileIdLow = info.nFileIndexLow,
                FileIdHigh = info.nFileIndexHigh,
                Size = size,
                CreationTime = creation,
                ModifiedTime = modified,
                Attributes = info.dwFileAttributes
            };
        }

        return null;
    }
}

public class FileMetadata
{
    public uint Volume { get; set; }
    public uint FileIdLow { get; set; }
    public uint FileIdHigh { get; set; }
    public long Size { get; set; }
    public long CreationTime { get; set; }
    public long ModifiedTime { get; set; }
    public uint Attributes { get; set; }
}
