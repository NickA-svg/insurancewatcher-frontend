import React from 'react';
import { Box } from '@mui/material';

// The InsuranceWatcher mark: an eye whose iris is a radar sweep, as on the Instagram profile picture.
export function BrandMark({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
            <defs>
                <radialGradient id="iw-sweep" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#3dd2cc" stopOpacity=".7" />
                    <stop offset="1" stopColor="#3dd2cc" stopOpacity="0" />
                </radialGradient>
                <clipPath id="iw-iris"><circle cx="32" cy="32" r="11" /></clipPath>
            </defs>
            <rect width="64" height="64" rx="14" fill="#0f1f2b" />
            <path d="M7 32 Q32 8 57 32 Q32 56 7 32 Z" fill="none" stroke="#ffffff" strokeWidth="3.6" strokeLinejoin="round" />
            <circle cx="32" cy="32" r="11" fill="#13303f" />
            <g clipPath="url(#iw-iris)">
                <path d="M32 32 L30 21 A11 11 0 0 1 40.4 24.9 Z" fill="url(#iw-sweep)" />
            </g>
            <circle cx="32" cy="32" r="11" fill="none" stroke="#3dd2cc" strokeWidth="2.6" />
            <circle cx="32" cy="32" r="2.6" fill="#3dd2cc" />
            <circle cx="35.6" cy="26" r="1.9" fill="#f0a35b" />
        </svg>
    );
}

// Mark plus wordmark for the dark header: "Insurance" in white, "Watcher" in teal, as on the social posts.
export default function BrandLogo({ compact = false }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.9, sm: 1.2 } }}>
            <Box sx={{ width: { xs: 30, sm: 36 }, height: { xs: 30, sm: 36 } }}><BrandMark size="100%" /></Box>
            {!compact && (
                <Box sx={{ lineHeight: 1 }}>
                    <Box component="span" sx={{ display: 'block', fontWeight: 800, letterSpacing: '-0.025em', fontSize: { xs: 17, sm: 21 }, color: '#fff', whiteSpace: 'nowrap' }}>
                        Insurance<Box component="span" sx={{ color: '#3dd2cc' }}>Watcher</Box>
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, mt: '3px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                        Market intelligence
                    </Box>
                </Box>
            )}
        </Box>
    );
}
