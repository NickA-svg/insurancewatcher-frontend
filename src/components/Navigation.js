import * as React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import logo from '../assets/IWLogo.png';

export default function NavigationBar() {
    return (
        <AppBar position="static" color="primary" elevation={0}>
            <Toolbar sx={{ maxWidth: 952, width: '100%', mx: 'auto', gap: 2, minHeight: { xs: 60, sm: 68 } }}>
                <Box component="img" src={logo} alt="InsuranceWatcher" sx={{ height: 36 }} />
                <Typography
                    variant="body2"
                    sx={{ flexGrow: 1, color: 'rgba(255,255,255,0.72)', display: { xs: 'none', sm: 'block' } }}
                >
                    Re/insurance news from across the market, tagged by line of business
                </Typography>
                <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />
                <Button
                    variant="outlined"
                    color="inherit"
                    size="small"
                    startIcon={<MailOutlineIcon />}
                    href="mailto:insurancewatcher@outlook.com"
                    sx={{ borderColor: 'rgba(255,255,255,0.4)' }}
                >
                    Contact
                </Button>
            </Toolbar>
        </AppBar>
    );
}
