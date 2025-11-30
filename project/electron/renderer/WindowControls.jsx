const WindowControls = () => {
    const handleMinimize = () => window.api.windowControl.minimize();
    const handleMaximize = () => window.api.windowControl.toggleMaximize();
    const handleClose = () => window.api.windowControl.close();

    return (
        <div className="flex gap-2 items-center z-50 no-drag">
            <button
                onClick={handleMinimize}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all group cursor-pointer cursor-target"
                title="Minimize"
            >
                <svg width="10" height="2" viewBox="0 0 10 2" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 group-hover:text-white">
                    <path d="M0 1H10" stroke="currentColor" strokeWidth="2" />
                </svg>
            </button>

            <button
                onClick={handleMaximize}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all group cursor-pointer cursor-target"
                title="Maximize"
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 group-hover:text-white">
                    <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="2" />
                </svg>
            </button>

            <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/80 transition-all group cursor-pointer cursor-target"
                title="Close"
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-400 group-hover:text-white">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};

window.WindowControls = WindowControls;
