const FileCard = ({ file }) => {
    return (
        <div className="text-sm p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
            <div className="truncate">{typeof file === 'string' ? file.split('\\').pop() : file.Path.split('\\').pop()}</div>
        </div>
    );
};

window.FileCard = FileCard;
