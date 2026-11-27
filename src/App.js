import Layout from "./components/Layout";
import { ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import theme from './Theme'
import Home from "./pages/News";
import CatMonitor from "./pages/CatMonitor";
import Litigation from "./pages/Litigation";
import Performance from "./pages/Performance";
import CyberMonitor from "./pages/CyberMonitor";
import MarineMonitor from "./pages/MarineMonitor";
import { usePath, tagSlug } from "./router";
import { tagWords } from "./components/TitleTags";

function App() {
    const path = usePath();
    let page;
    if (path.startsWith('/marine-monitor')) {
        page = <MarineMonitor />;
    } else if (path.startsWith('/cyber-monitor')) {
        page = <CyberMonitor />;
    } else if (path.startsWith('/market-performance')) {
        page = <Performance />;
    } else if (path.startsWith('/securities-class-actions')) {
        page = <Litigation />;
    } else if (path.startsWith('/cat-monitor')) {
        const slug = path.split('/')[2] || null;
        page = <CatMonitor slug={slug} />;
    } else {
        const slug = path.startsWith('/news/') ? path.split('/')[2] : null;
        const tag = (slug && tagWords.find((t) => tagSlug(t) === slug)) || 'All';
        page = <Home key="news" tag={tag} />;
    }
    return (
        <ThemeProvider theme={responsiveFontSizes(theme)}>
            <Layout path={path}>{page}</Layout>
        </ThemeProvider>
    );
}

export default App;
