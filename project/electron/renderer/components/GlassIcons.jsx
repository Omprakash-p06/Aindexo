const GlassIcons = ({ items, className, onSelect, activeTab }) => {
    const getBackgroundStyle = () => {
        return {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        };
    };

    return (
        <div className={`flex gap-6 items-center justify-center mx-auto py-2 overflow-visible ${className || ''}`}>
            {items.map((item, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onSelect && onSelect(item.id)}
                    aria-label={item.label}
                    className={`relative bg-transparent outline-none border-none cursor-pointer w-[4.5em] h-[4.5em] [perspective:24em] [transform-style:preserve-3d] [-webkit-tap-highlight-color:transparent] group cursor-target ${item.customClass || ''
                        } ${activeTab === item.id ? 'scale-110' : ''}`}
                >
                    <span
                        className={`absolute top-0 left-0 w-full h-full rounded-[1.25em] block transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] origin-[100%_100%] rotate-[15deg] [will-change:transform] group-hover:[transform:rotate(25deg)_translate3d(-0.5em,-0.5em,0.5em)] ${activeTab === item.id ? '[transform:rotate(25deg)_translate3d(-0.5em,-0.5em,0.5em)]' : ''}`}
                        style={{
                            ...getBackgroundStyle(),
                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                        }}
                    ></span>

                    <span
                        className={`absolute top-0 left-0 w-full h-full rounded-[1.25em] bg-[hsla(0,0%,100%,0.15)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] origin-[80%_50%] flex backdrop-blur-[0.75em] [-webkit-backdrop-filter:blur(0.75em)] [-moz-backdrop-filter:blur(0.75em)] [will-change:transform] transform group-hover:[transform:translate3d(0,0,2em)] ${activeTab === item.id ? '[transform:translate3d(0,0,2em)]' : ''}`}
                        style={{
                            boxShadow: '0 0 0 0.1em hsla(0, 0%, 100%, 0.3) inset'
                        }}
                    >
                        <span className="m-auto w-[1.5em] h-[1.5em] flex items-center justify-center text-white" aria-hidden="true">
                            {item.icon}
                        </span>
                    </span>

                    <span className={`absolute top-full left-0 right-0 text-center whitespace-nowrap leading-[2] text-base opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.83,0,0.17,1)] translate-y-0 group-hover:opacity-100 group-hover:[transform:translateY(20%)] ${activeTab === item.id ? 'opacity-100 [transform:translateY(20%)]' : ''}`}>
                        {item.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

window.GlassIcons = GlassIcons;
