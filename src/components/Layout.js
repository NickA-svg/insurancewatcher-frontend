import NavigationBar from "./Navigation"

const Layout = ({ children }) => {
    return (
        <>
            <NavigationBar />
            <main>{children}</main>
            <footer className="site-footer">
                InsuranceWatcher collects headlines from public RSS feeds. Every article links to its original publisher.
            </footer>
        </>
    )
}

export default Layout
