import React from "react";
import { OutlinedInput } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton } from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBar({ setSearchQuery, searchQuery }) {
    const [value, setValue] = React.useState()

    function handleChange(search) {
        setValue(search.target.value)
    }

    function handleClear() {
        setValue("")
        setSearchQuery("All")
    }

    return (
        <form className="search-id">
            <OutlinedInput
                id="search-bar"
                className="search-bar"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        if (e.target.value === "") {
                            setSearchQuery("All")
                            setValue("")
                        }
                        else {
                            const search = e.target.value.replaceAll(" ", "+")
                            setValue(e.target.value)
                            setSearchQuery(search)
                        }
                        e.preventDefault();
                    }
                }}
                onChange={handleChange}
                variant="outlined"
                value={value}
                placeholder="Search articles for..."
                size="small"
                sx={{
                    width: "98%",
                    marginLeft: 1,
                    "--Input-radius": "10px",
                    "--Input-gap": "15px",
                }}
                startAdornment={<SearchIcon style={{ fill: "#00ffd1", paddingRight: '5px', borderRadius: '20px' }} />}
                endAdornment={
                    <IconButton onClick={handleClear}>
                        <ClearIcon />
                    </IconButton>
                }
            />
        </form>
    );
}