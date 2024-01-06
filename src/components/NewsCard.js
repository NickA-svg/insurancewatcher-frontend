import * as React from 'react';
import { Avatar, Link, Card, CardHeader, CardContent, IconButton, Typography, Chip, Stack } from '@mui/material';
// import Share from '@mui/icons-material/Share';
import { Tooltip } from '@mui/material';
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

const links = {
    "www.insurancejournal.com": { "name": "IJ", "color": "#af231c", "source": IJ },
    "www.insuranceage.co.uk": { "name": "IA", "color": "#44b8ae", "source": IA },
    "www.reinsurancene.ws": { "name": "Re", "color": "#007aff", "source": RN },
    "www.insuranceinsider.com": { "name": "II", "color": "#e30513", "source": II },
    "www.postonline.co.uk": { "name": "PO", "color": "#335fc8", "source": IP },
    "www.theinsurer.com": { "name": "TI", "color": "#3b3b53", "source": TI },
    "www.artemis.bm": { "name": "Ar", "color": "#121942", "source": AR },
    "www.ft.com": { "name": "FT", "color": "#fcd0b1", "source": FT },
    "www.claimsjournal.com": { "name": "CJ", "color": "#172a7c", "source": CJ },
    "www.atlas-mag.net": { "name": "AT", "color": "#de201e", "source": AT },
    "www.insurancebusinessmag.com": { "name": "IB", "color": "#012d6b", "source": IB }
}

export default function NewsCard(props) {
    const base_url = props.url.split("/")[2]
    const av_color = links[base_url]["color"]
    const source = links[base_url]["source"]

    return (
        <div className="card-div">
            <Link href={props.url} target="_blank" style={{ textDecoration: 'none' }}>
                <Card sx={{ minWidth: 275, padding: '5px', margin: "10px" }} >
                    <CardHeader
                        avatar={
                            <IconButton aria-label="settings" href={"https://" + base_url} target="_blank">
                                <Tooltip title={base_url}>
                                    <Avatar srcSet={source} sx={{ width: 80, height: 80, bgcolor: av_color }} aria-label="recipe" />
                                </Tooltip>
                            </IconButton>
                        }
                        title={<Typography variant='h5'>{props.title}</Typography>}
                        subheader={props.date}
                    />
                    <CardContent orientation="horizontal">
                        <div>
                            <Typography level="body-sm">
                                {props.summary}...
                            </Typography>
                        </div>
                        <br></br>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {/* <Tooltip title="Continue reading...">
                            <IconButton aria-label="settings" href={props.url} target="_blank">
                                <Share />
                            </IconButton>
                        </Tooltip> */}
                            {props.tags.split(', ').filter(item => item !== "").map((tag, index) =>
                                <Chip
                                    key={index}
                                    label={tag}
                                    color={tag === props.searchTag ? "secondary" : "primary"}
                                    variant={tag === props.searchTag ? "filled" : 'filled'}
                                    size='small' />)}
                        </Stack>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}