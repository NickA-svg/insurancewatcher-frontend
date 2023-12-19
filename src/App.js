import Layout from "./components/Layout";
import { ThemeProvider } from '@mui/material/styles';
import './App.css';
import theme from './Theme'
import Home from "./pages/News";

function App() {

  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Home />
      </Layout >
    </ThemeProvider>
  );
}

export default App;
