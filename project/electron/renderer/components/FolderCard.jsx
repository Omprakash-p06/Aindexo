const { FileCard } = window;

const FolderCard = ({ category }) => {
    return (
        <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📁</span>
                <h3 className="font-semibold">{category.Name}</h3>
                <span className="text-xs text-gray-400 ml-auto">{category.Files.length} files</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
                {category.Files.map((file, i) => (
                    <FileCard key={i} file={file} />
                ))}
            </div>
        </div>
    );
};

window.FolderCard = FolderCard;
