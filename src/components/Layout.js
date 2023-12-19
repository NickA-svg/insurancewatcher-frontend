import NavigationBar from "./Navigation"

const Layout = ({ children }) => {
    return (
        <>
            <NavigationBar />
            <div > {children} </div>
        </>
    )
}

export default Layout