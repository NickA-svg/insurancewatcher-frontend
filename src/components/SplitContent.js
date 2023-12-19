import React from 'react';
import "../assets/app.css"

export function SplitContent({ leftColumm, rightColumn, sideMenu }) {
    return (
        <div className="SplitContent">
            <div className="SplitContentLeft">
                {leftColumm}
            </div>
            <div className="SplitContentRight">
                {rightColumn}
            </div>
            <div className="SplitContentSideMenu">
                {sideMenu}
            </div>
        </div>
    );
}

export default SplitContent;