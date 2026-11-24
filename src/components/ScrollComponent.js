import React from 'react';
import { Fab, Zoom } from '@mui/material';
import NorthIcon from '@mui/icons-material/North';

export default function ScrollButton() {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 600);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <Zoom in={visible}>
            <Fab
                className="scroller"
                color="secondary"
                size="medium"
                aria-label="Back to top"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <NorthIcon />
            </Fab>
        </Zoom>
    )
}
