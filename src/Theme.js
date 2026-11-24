import { createTheme } from '@mui/material/styles';

const navy = "#122d42";
const teal = "#22b8b1";

export default createTheme({
    palette: {
        primary: { main: navy },
        secondary: { main: teal, contrastText: "#ffffff" },
        background: { default: "#f4f6f8", paper: "#ffffff" },
        text: { primary: "#14212b", secondary: "#5b6b78" },
        divider: "#e3e8ec",
    },
    shape: { borderRadius: 10 },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        h1: { fontWeight: 700, letterSpacing: "-0.02em" },
        h6: { fontWeight: 600, letterSpacing: "-0.01em" },
        subtitle1: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { border: "1px solid #e3e8ec" } },
        },
        MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    },
});
