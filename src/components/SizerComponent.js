import { useState, useEffect } from "react";

function getWindowDimensions() {
    let { innerWidth: width, innerHeight: height } = window;
    if (width < 950) {
        width = 900
    }
    else { width = width * 0.7 }
    return {
        width,
        height
    };
}

export default function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}