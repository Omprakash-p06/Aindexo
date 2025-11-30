const { useState, useEffect } = React;

const Settings = () => {
    const ProfileCard = window.ProfileCard;
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        image: null
    });
    const [savedData, setSavedData] = useState(null);
    const [isEditing, setIsEditing] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const storedData = localStorage.getItem('userProfile');
        if (storedData) {
            const parsed = JSON.parse(storedData);
            setFormData(parsed);
            setSavedData(parsed);
            setIsEditing(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setSavedData(formData);
        localStorage.setItem('userProfile', JSON.stringify(formData));
        setIsEditing(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleViewDetails = () => {
        setShowDetails(true);
    };

    const closeDetails = () => {
        setShowDetails(false);
    };

    return (
        <div className="h-full grid grid-cols-12 gap-8 relative">
            {/* Details Modal */}
            {showDetails && savedData && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                    <div className="glass-panel p-8 rounded-2xl max-w-md w-full relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={closeDetails}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mb-4">
                                <img src={savedData.image} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">{savedData.name}</h3>
                            <p className="text-blue-400 mb-6">{savedData.email}</p>

                            <div className="w-full space-y-3 text-left">
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-green-400 font-medium flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                        Authorized User
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</div>
                                    <div className="text-white font-medium">{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="col-span-4 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">User Profile</h2>
                        {!isEditing && savedData && (
                            <button
                                onClick={handleEdit}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-target"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-target"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Profile Picture</label>
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 cursor-target"
                                    />
                                    <div className="w-full aspect-square bg-black/30 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center group-hover:border-blue-500 transition-colors overflow-hidden">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                <span className="text-sm text-gray-500">Upload Image</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors mt-4 cursor-target"
                            >
                                Save & Generate Card
                            </button>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-sm">
                            <p>Profile saved. Click "Edit" to make changes.</p>
                        </div>
                    )}
                </div>

                {/* Data Management Section */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">Data Management</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        Clear all indexed file data. This will trigger a full deep scan next time you scan.
                    </p>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to clear all indexed data? This cannot be undone.')) {
                                window.api.sendCommand({ action: 'clear_data', payload: {} });
                            }
                        }}
                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-semibold py-3 rounded-lg transition-colors cursor-target"
                    >
                        Clear Indexed Data
                    </button>
                </div>
            </div>

            <div className="col-span-8 h-full relative">
                <div className="glass-panel rounded-2xl h-full overflow-hidden relative flex items-center justify-center bg-black/50">
                    {savedData ? (
                        <div className="w-full h-full flex items-center justify-center p-8">
                            {ProfileCard && (
                                <ProfileCard
                                    name={savedData.name}
                                    handle={savedData.email.split('@')[0]}
                                    title={savedData.email}
                                    avatarUrl={savedData.image}
                                    status="Authorized"
                                    contactText="View Details"
                                    onContactClick={handleViewDetails}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3 3 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <p className="text-lg">Enter your details to generate your ID card</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.Settings = Settings;
