import Layout from "./components/Layout";
import { ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import './App.css';
import theme from './Theme'
import Home from "./pages/News";

function App() {

  return (
    <ThemeProvider theme={responsiveFontSizes(theme)}>
      <Layout>
        <Home />
      </Layout >
    </ThemeProvider>
  );
}

export default App;
