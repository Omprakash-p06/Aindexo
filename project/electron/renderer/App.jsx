const { useState, useEffect } = React;
const { TargetCursor, StarBorder, FolderCard, OrganizeButton } = window;

const App = () => {
  const [status, setStatus] = useState('idle');
  const [foldersScanned, setFoldersScanned] = useState(0);
  const [preview, setPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (data.data && data.data.Categories) {
      setPreview(data.data);
    } else {
      console.error("Invalid preview data format:", data.data);
    }
  } else if (data.event === 'searchResults') {
    setSearchResults(data.data.results);
  } else if (data.event === 'scanComplete') {
    const handleSearch = (e) => {
      setQuery(e.target.value);
      if (e.target.value.length > 2) {
        window.api.sendCommand({ action: 'query', payload: { query: e.target.value } });
      } else {
        setSearchResults([]);
      }
    };

    return (
      <div className="min-h-screen text-white p-8 relative overflow-hidden">
        <TargetCursor />

        {/* Header */}
        <header className="flex justify-between items-center mb-12 relative z-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            AIndexo
          </h1>
          <div className="flex gap-4">
            <StarBorder onClick={handleScan} disabled={status !== 'idle'}>
              <span className="px-6 py-2">{status === 'scanning' ? 'Scanning...' : 'Scan Files'}</span>
            </StarBorder>
            <OrganizeButton onClick={handleOrganize} disabled={status !== 'idle'} />
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-12 gap-8 relative z-10">

          {/* Left Panel: Status & Search */}
          <div className="col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Status</h2>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Activity</span>
                <span className="text-blue-400 font-mono">{status.toUpperCase()}</span>
              </div>
              <div className="mt-4">
                <span className="text-gray-400">Files Scanned</span>
                <div className="text-3xl font-bold mt-1">{foldersScanned}</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4">Semantic Search</h2>
              <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Find files by meaning..."
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-target"
              />
              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
                {searchResults.map((res, i) => (
                  <div key={i} className="p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                    <div className="text-sm truncate text-gray-300 group-hover:text-white">{res.Path}</div>
                    <div className="text-xs text-blue-400 mt-1">Score: {(res.Score * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Organization Preview - WITH SCROLLING */}
          <div className="col-span-8">
            <div className="glass-panel p-6 rounded-2xl h-[calc(100vh-200px)] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Organization Preview</h2>
                {preview && (
                  <button
                    onClick={handleConfirmOrganize}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg border border-green-500/30 transition-all cursor-target"
                  >
                    Confirm Move
                  </button>
                )}
              </div>

              {!preview ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                  <p>Click "Organize" to see AI suggestions</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
                  {preview.Categories.map((cat, i) => (
                    <FolderCard key={i} category={cat} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  };

  window.App = App;
