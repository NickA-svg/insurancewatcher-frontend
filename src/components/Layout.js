import NavigationBar from "./Navigation"
import { tagGroups } from "./TitleTags";
import { linkProps, tagSlug } from "../router";

const Layout = ({ children, path }) => {
    return (
        <>
            <NavigationBar path={path} />
            <main>{children}</main>
            <footer className="site-footer">
                <nav className="footer-links" aria-label="Browse news by line of business">
                    {tagGroups.flatMap((g) => g.tags).map((t) => (
                        <a key={t} {...linkProps(`/news/${tagSlug(t)}/`)}>{t} news</a>
                    ))}
                    <a {...linkProps('/cat-monitor/')}>Cat Monitor</a>
                    <a {...linkProps('/market-performance/')}>Market performance</a>
                    <a {...linkProps('/securities-class-actions/')}>Securities class action tracker</a>
                </nav>
                <p>InsuranceWatcher collects headlines from public RSS feeds and links every article to its original publisher. Event data from GDACS and USGS. Litigation data from public law-firm announcements. Not financial advice.</p>
                <p><a href="mailto:insurancewatcher@outlook.com">Contact</a></p>
            </footer>
        </>
    )
}

export default Layout
