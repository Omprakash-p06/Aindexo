const { useState, useEffect, useRef } = React;

const ScrambledText = ({
    text,
    duration = 1,
    speed = 0.05,
    className = "",
    scrambleChars = "!<>-_\\/[]{}—=+*^?#________"
}) => {
    const [displayText, setDisplayText] = useState(text);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef(null);

    const scramble = () => {
        let iteration = 0;
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(prev =>
                text
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(intervalRef.current);
            }

            iteration += 1 / 3; // Controls the speed of revealing characters
        }, 30);
    };

    useEffect(() => {
        scramble();
        return () => clearInterval(intervalRef.current);
    }, [text]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        scramble();
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <h1
            className={`font-mono cursor-default ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ fontFamily: "'Space Grotesk', monospace" }} // Fallback to monospace if font isn't loaded yet
        >
            {displayText}
        </h1>
    );
};

window.ScrambledText = ScrambledText;
