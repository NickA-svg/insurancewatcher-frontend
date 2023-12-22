import { OutlinedInput } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function SearchBar({ setSearchQuery }) {
    return (
        <form className="search-id">
            <OutlinedInput
                id="search-bar"
                className="search-bar"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        if (e.target.value === "") {
                            setSearchQuery("All")
                        }
                        else {
                            setSearchQuery(e.target.value)
                        }
                        e.preventDefault();
                    }
                }}
                variant="outlined"
                placeholder="Search articles for..."
                size="small"
                sx={{
                    width: "98%",
                    marginLeft: 1,
                    "--Input-radius": "10px",
                    "--Input-gap": "15px",
                }}
                startAdornment={<SearchIcon style={{ fill: "#00ffd1", paddingRight: '5px', borderRadius: '20px' }} />}
            />
        </form>
    );
}