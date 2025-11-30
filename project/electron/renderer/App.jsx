const { useState, useEffect } = React;
const { TargetCursor, StarBorder, FolderCard, OrganizeButton, WindowControls, ScrambledText, GlassSurface, GlassIcons, FileManager, Settings } = window;

const App = () => {
  console.log("App: Component rendering...");
  const [status, setStatus] = useState('idle');
  const [foldersScanned, setFoldersScanned] = useState(0);
  const [preview, setPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [scanStats, setScanStats] = useState({
    totalFiles: 0,
    newFiles: 0,
    updatedFiles: 0,
    deletedFiles: 0,
    lastScanTime: null
  });
  const [scanProgress, setScanProgress] = useState({
    isScanning: false,
    percentage: 0,
    current: 0,
    estimated: 0
  });

  const dockItems = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: 'blue'
    },
    {
      id: 'organize',
      label: 'Organize',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      id: 'manage',
      label: 'Manage',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      color: 'green'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'gray'
    }
  ];

  useEffect(() => {
    window.api.onResponse((data) => {
      if (data.event !== 'progress') {
        console.log("Frontend received event:", data.event, data);
      }
      if (data.event === 'progress') {
        setFoldersScanned(data.data.foldersScanned);
      } else if (data.event === 'indexStatus') {
        console.log(`Database contains ${data.data.totalFiles} files`);
        setScanStats(prev => ({ ...prev, totalFiles: data.data.totalFiles }));
      } else if (data.event === 'status') {
        console.log("Setting status to:", data.data.state);
        setStatus(data.data.state);
      } else if (data.event === 'organizePreview') {
        console.log("Setting preview data:", data.data);
        if (data.data && data.data.Categories) {
          setPreview(data.data);
          setActiveTab('organize'); // Switch to organize tab on preview
        } else {
          console.error("Invalid preview data format:", data.data);
        }
      } else if (data.event === 'searchResults') {
        setSearchResults(data.data.results);
      } else if (data.event === 'scanComplete') {
        console.log("Scan complete");
      } else if (data.event === 'scanSummary') {
        const { newFiles, updatedFiles, deletedFiles, totalChecked, totalInDb } = data.data;
        console.log(`Scan Summary: ${newFiles} new, ${updatedFiles} updated, ${deletedFiles} deleted`);
        setScanStats({
          totalFiles: totalInDb,
          newFiles,
          updatedFiles,
          deletedFiles,
          lastScanTime: new Date().toLocaleTimeString()
        });
      } else if (data.event === 'error') {
        console.error("Backend error:", data.data.message);
        alert("Error: " + data.data.message);
        setStatus('idle');
      } else if (data.event === 'dataCleared') {
        setScanStats({
          totalFiles: 0,
          newFiles: 0,
          updatedFiles: 0,
          deletedFiles: 0,
          lastScanTime: null
        });
        setFoldersScanned(0);
        setSearchResults([]);
        alert("All data cleared successfully. Please run a scan to re-index.");
      } else if (data.event === 'scanProgress') {
        setScanProgress({
          isScanning: true,
          percentage: data.data.percentage || 0,
          current: data.data.current || 0,
          estimated: data.data.estimated || 0
        });
      }
    });

    return () => window.api.removeResponseListener();
  }, []);

  const handleScan = () => {
    setScanProgress({ isScanning: true, percentage: 0, current: 0, estimated: 0 });
    window.api.sendCommand({ action: 'scan', payload: {} });
  };

  const handleOrganize = async () => {
    const userProfile = await window.api.getHomeDir();
    const targetDir = `${userProfile}\\Downloads`;
    console.log("Organizing target:", targetDir);
    window.api.sendCommand({ action: 'organize', payload: { targetDir } });
  };

  const handleConfirmOrganize = async () => {
    if (!preview) return;
    const userProfile = await window.api.getHomeDir();
    const targetDir = `${userProfile}\\Downloads`;
    window.api.sendCommand({ action: 'executeOrganize', payload: { ...preview, targetDir } });
    setPreview(null);
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    if (e.target.value.length > 2) {
      window.api.sendCommand({ action: 'query', payload: { query: e.target.value } });
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="h-screen text-white p-8 relative bg-black flex flex-col">
      <TargetCursor />

      <header className="flex justify-between items-center mb-8 relative z-10 drag-region shrink-0">
        <div className="flex items-center gap-4">
          <ScrambledText
            text="AIndexo"
            className="text-4xl font-bold text-white no-drag"
          />
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex gap-4 no-drag">
            <StarBorder onClick={handleScan} disabled={status !== 'idle'}>
              <span className="px-6 py-2">{status === 'scanning' ? 'Scanning...' : 'Scan Files'}</span>
            </StarBorder>
            <OrganizeButton onClick={handleOrganize} disabled={status !== 'idle'} />
          </div>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <WindowControls />
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-y-auto pb-32 pr-2">
        {activeTab === 'home' && (
          <div className="grid grid-cols-12 gap-8 h-full">
            <div className="col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h2 className="text-xl font-semibold mb-4">Status</h2>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Activity</span>
                  <span className="text-blue-400 font-mono">{status.toUpperCase()}</span>
                </div>

                {/* Progress Bar - Integrated into Status Panel */}
                {scanProgress.isScanning && status === 'scanning' && (
                  <div className="mb-4 glass-panel p-4 rounded-lg bg-white/5">
                    <div className="relative h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${scanProgress.percentage}%` }}
                      />
                    </div>
                    <div className="text-center text-sm text-gray-400">
                      Scanned {scanProgress.current.toLocaleString()} files
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Total Indexed</div>
                    <div className="text-2xl font-bold text-white">{scanStats.totalFiles.toLocaleString()}</div>
                  </div>

                  {scanStats.lastScanTime && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
                        <span>Last Scan</span>
                        <span>{scanStats.lastScanTime}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-green-400 font-bold">{scanStats.newFiles}</div>
                          <div className="text-[10px] text-gray-400">New</div>
                        </div>
                        <div>
                          <div className="text-yellow-400 font-bold">{scanStats.updatedFiles}</div>
                          <div className="text-[10px] text-gray-400">Updated</div>
                        </div>
                        <div>
                          <div className="text-red-400 font-bold">{scanStats.deletedFiles}</div>
                          <div className="text-[10px] text-gray-400">Deleted</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-8 flex flex-col items-center justify-center">
              <div className="glass-panel p-8 rounded-2xl w-full max-w-3xl">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Semantic Search</h2>
                <input
                  type="text"
                  value={query}
                  onChange={handleSearch}
                  placeholder="Find files by meaning..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-6 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors cursor-target mb-4"
                />
                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {searchResults.map((res, i) => (
                      <div key={i} className="p-4 hover:bg-white/5 rounded-lg transition-colors group flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="text-sm truncate text-gray-300 group-hover:text-white">{res.Path}</div>
                          <div className="text-xs text-blue-400 mt-1">Score: {(res.Score * 100).toFixed(1)}%</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => window.api.openInExplorer(res.Path)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-target"
                            title="Open in Explorer"
                          >
                            <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => window.api.openFile(res.Path)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-target"
                            title="Open File"
                          >
                            <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : query.length > 0 ? (
                  <div className="text-center text-gray-500 py-8">No results found for "{query}"</div>
                ) : (
                  <div className="text-center text-gray-500 py-8">Type at least 3 characters to search</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organize' && (
          <div className="h-full">
            {!preview ? (
              <div className="h-full flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-6">Select a folder to organize</h2>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  {[
                    { name: 'Downloads', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10' },
                    { name: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { name: 'Desktop', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                    { name: 'Pictures', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { name: 'Videos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                    { name: 'Music', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' }
                  ].map((folder) => (
                    <button
                      key={folder.name}
                      onClick={async () => {
                        const userProfile = await window.api.getHomeDir();
                        const targetDir = `${userProfile}\\${folder.name}`;
                        window.api.sendCommand({ action: 'organize', payload: { targetDir } });
                      }}
                      className="glass-panel p-6 rounded-2xl hover:bg-white/10 transition-all cursor-target group"
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <svg className="w-16 h-16 text-blue-400 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={folder.icon} />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">{folder.name}</h3>
                        <p className="text-sm text-gray-400">Click to organize</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Organization Preview</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreview(null)}
                      className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 py-2 rounded-lg border border-gray-500/30 transition-all cursor-target"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmOrganize}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg border border-green-500/30 transition-all cursor-target"
                    >
                      Confirm Move
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
                  {preview.Categories.map((cat, i) => (
                    <FolderCard key={i} category={cat} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <FileManager />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <GlassSurface
          width="auto"
          height="auto"
          borderRadius={24}
          className="px-8"
        >
          <GlassIcons items={dockItems} activeTab={activeTab} onSelect={setActiveTab} />
        </GlassSurface>
      </div>
    </div>
  );
};

window.App = App;
