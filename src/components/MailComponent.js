import React from "react";
import { Button } from "@mui/material";

const ButtonMailto = ({ mailto, label }) => {
    return (
        <Button
            variant="contained"
            color="secondary"
            sx={{ margin: '10px' }}
            onClick={(e) => {
                window.location = 'mailto:' + mailto;
                e.preventDefault();
            }}
        >
            {label}
        </Button>
    );
};

export default ButtonMailto;