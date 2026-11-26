import * as React from 'react';
import { AppBar, Box, Button, Toolbar } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import logo from '../assets/IWLogo.png';
import { linkProps } from '../router';

function NavLink({ to, active, children }) {
    return (
        <Button {...linkProps(to)} color="inherit" size="small"
            sx={{ opacity: active ? 1 : 0.75, borderBottom: active ? '2px solid #3dd2cc' : '2px solid transparent', borderRadius: 0, px: 1 }}>
            {children}
        </Button>
    );
}

export default function NavigationBar({ path = '/' }) {
    const onCat = path.startsWith('/cat-monitor');
    return (
        <AppBar position="static" color="primary" elevation={0}>
            <Toolbar sx={{ maxWidth: 952, width: '100%', mx: 'auto', gap: { xs: 1, sm: 2 }, minHeight: { xs: 60, sm: 68 } }}>
                <Box component="a" {...linkProps('/')} sx={{ display: 'flex' }}>
                    <Box component="img" src={logo} alt="InsuranceWatcher" sx={{ height: { xs: 28, sm: 36 } }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, ml: { xs: 0.5, sm: 2 } }}>
                    <NavLink to="/" active={!onCat}>News</NavLink>
                    <NavLink to="/cat-monitor/" active={onCat}>Cat Monitor</NavLink>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" color="inherit" size="small" href="mailto:insurancewatcher@outlook.com"
                    startIcon={<MailOutlineIcon />} sx={{ borderColor: 'rgba(255,255,255,0.4)', display: { xs: 'none', sm: 'inline-flex' } }}>
                    Contact
                </Button>
            </Toolbar>
        </AppBar>
    );
}
