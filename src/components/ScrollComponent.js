import React from 'react';
import IconButton from '@mui/material/IconButton';
import NorthIcon from '@mui/icons-material/North';

export default function ScrollButton(props) {
    const [visible, setVisible] = React.useState(false);

    const toggleVisible = () => {
        if (
            document.getElementById("SplitContentRight").scrollTop > 500 ||
            document.documentElement.scrollTop > 500
        ) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    };

    React.useEffect(() => {
        // Listen for Scrolling Event
        document.getElementById("SplitContentRight").addEventListener("scroll", toggleVisible, false);
        return () => {
            document.getElementById("SplitContentRight").removeEventListener("scroll", toggleVisible, false);
        }
    }, []);



    function scrollToTop() {
        const div = document.getElementById(props.id);
        const div2 = document.getElementById("target2")
        div.scrollIntoView();
        div2.scrollIntoView();
    }

    return (
        <footer>
            <IconButton id="scroller" className={visible ? "scroller" : null} onClick={scrollToTop}>
                <NorthIcon sx={{ border: 'solid', bgcolor: '#00ffd1', borderColor: '#00ffd1', borderRadius: '100px', opacity: '70%' }} color='#000' />
            </IconButton>
        </footer>
    )

};