import React from "react";
import { IconButton, InputAdornment, OutlinedInput } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBar({ setSearchQuery }) {
    const [value, setValue] = React.useState("")

    function submit(e) {
        e.preventDefault();
        const trimmed = value.trim();
        setSearchQuery(trimmed === "" ? "All" : trimmed.replaceAll("/", " ").replaceAll(" ", "+"));
    }

    function handleClear() {
        setValue("")
        setSearchQuery("All")
    }

    return (
        <form onSubmit={submit} role="search">
            <OutlinedInput
                fullWidth
                size="small"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search headlines, e.g. Lloyd's, hurricane, D&O…"
                inputProps={{ 'aria-label': 'Search articles' }}
                sx={{ bgcolor: '#fff' }}
                startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>}
                endAdornment={value ? (
                    <InputAdornment position="end">
                        <IconButton aria-label="Clear search" onClick={handleClear} edge="end" size="small"><ClearIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                ) : null}
            />
        </form>
    );
}
