import Layout from "./components/Layout";
import { ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import theme from './Theme'
import Home from "./pages/News";
import CatMonitor from "./pages/CatMonitor";
import { usePath, tagSlug } from "./router";
import { tagWords } from "./components/TitleTags";

function App() {
    const path = usePath();
    let page;
    if (path.startsWith('/cat-monitor')) {
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
