import * as React from 'react';
import { Avatar, Box, Card, Chip, Stack, Typography } from '@mui/material';
import IJ from "../assets/insurancejournal.png"
import IA from "../assets/ia.jpeg"
import II from "../assets/theinsuranceinsider.jpeg"
import CJ from "../assets/claimsjournal.png"
import RN from "../assets/ReNews.png"
import IP from "../assets/insurancepost.jpeg"
import TI from "../assets/TheInsurer.png"
import AR from "../assets/artemis.jpeg"
import FT from "../assets/ft.png"
import AT from "../assets/atlas.png"
import IB from "../assets/InsBiz.gif"

const sources = {
    "www.insurancejournal.com": { name: "Insurance Journal", color: "#af231c", logo: IJ },
    "www.insuranceage.co.uk": { name: "Insurance Age", color: "#44b8ae", logo: IA },
    "www.reinsurancene.ws": { name: "Reinsurance News", color: "#007aff", logo: RN },
    "www.insuranceinsider.com": { name: "Insurance Insider", color: "#e30513", logo: II },
    "www.postonline.co.uk": { name: "Insurance Post", color: "#335fc8", logo: IP },
    "www.theinsurer.com": { name: "The Insurer", color: "#3b3b53", logo: TI },
    "www.artemis.bm": { name: "Artemis", color: "#121942", logo: AR },
    "www.ft.com": { name: "Financial Times", color: "#fcd0b1", logo: FT },
    "www.claimsjournal.com": { name: "Claims Journal", color: "#172a7c", logo: CJ },
    "www.atlas-mag.net": { name: "Atlas Magazine", color: "#de201e", logo: AT },
    "www.insurancebusinessmag.com": { name: "Insurance Business", color: "#012d6b", logo: IB },
}

function sourceFor(url) {
    let host = "";
    try { host = new URL(url).hostname; } catch (e) { host = ""; }
    return sources[host] || { name: host.replace(/^www\./, "") || "Source", color: "#5b6b78", logo: null };
}

function formatDate(ymd) {
    if (!ymd) return "";
    const d = new Date(`${ymd}T00:00:00`);
    if (isNaN(d)) return ymd;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NewsCard({ title, date, summary, url, tags, searchTag }) {
    const source = sourceFor(url);
    const tagList = (tags || "").split(', ').filter(Boolean);
    const cleanSummary = (summary || "").trim();
    const showSummary = cleanSummary && cleanSummary.toLowerCase() !== (title || "").trim().toLowerCase();

    return (
        <a className="article-card" href={url} target="_blank" rel="noopener noreferrer">
            <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar
                        src={source.logo || undefined}
                        alt=""
                        sx={{ width: 28, height: 28, bgcolor: source.color, fontSize: 12 }}
                    >
                        {source.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{source.name}</Typography>
                    <Typography variant="body2" color="text.secondary">· {formatDate(date)}</Typography>
                </Stack>
                <Typography component="h2" sx={{ fontSize: { xs: '1.05rem', sm: '1.15rem' }, fontWeight: 600, lineHeight: 1.35, mb: showSummary ? 0.75 : 0 }}>
                    {title}
                </Typography>
                {showSummary && (
                    <Typography variant="body2" color="text.secondary" className="clamp-3" sx={{ lineHeight: 1.6 }}>
                        {cleanSummary}
                    </Typography>
                )}
                {tagList.length > 0 && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {tagList.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                color={tag === searchTag ? "secondary" : "default"}
                                variant={tag === searchTag ? "filled" : "outlined"}
                            />
                        ))}
                    </Box>
                )}
            </Card>
        </a>
    );
}
