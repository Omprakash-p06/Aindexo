const FileManager = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4">
                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h2 className="text-2xl font-bold">File Manager</h2>
                <p className="text-gray-400">Manage your local files here.</p>
                <div className="mt-4 p-4 bg-white/5 rounded-lg w-64 text-center text-sm text-gray-500">
                    Coming Soon
                </div>
            </div>
        </div>
    );
};

window.FileManager = FileManager;
