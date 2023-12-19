import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Share from '@mui/icons-material/Share';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { Tooltip } from '@mui/material';


const links = {
    "www.insurancejournal.com": { "name": "IJ", "color": "#af231c" },
    "www.insuranceage.co.uk": { "name": "IA", "color": "#44b8ae" },
    "www.reinsurancene.ws": { "name": "Re", "color": "#007aff" },
    "www.insuranceinsider.com": { "name": "II", "color": "#e30513" },
    "www.postonline.co.uk": { "name": "PO", "color": "#335fc8" },
    "www.theinsurer.com": { "name": "TI", "color": "#3b3b53" },
    "www.artemis.bm": { "name": "Ar", "color": "#121942" },
}

export default function NewsCard(props) {
    const base_url = props.url.split("/")[2]
    const name = links[base_url]["name"]
    const av_color = links[base_url]["color"]

    return (
        <div className="card-div">
            <Card sx={{ minWidth: 275, padding: '5px', margin: "10px" }} >
                <CardHeader
                    avatar={
                        <IconButton aria-label="settings" href={"https://" + base_url} target="_blank">
                            <Tooltip title={base_url}>
                                <Avatar sx={{ width: 56, height: 56, bgcolor: av_color }} aria-label="recipe">
                                    {name}
                                </Avatar>
                            </Tooltip>
                        </IconButton>
                    }
                    title={<Typography variant='h5'>{props.title}</Typography>}
                    subheader={props.date}
                />
                <CardContent orientation="horizontal">
                    <div>
                        <Typography level="body-sm">{props.summary}...</Typography>
                    </div>
                    <br></br>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Tooltip title="Continue reading...">
                            <IconButton aria-label="settings" href={props.url} target="_blank">
                                <Share />
                            </IconButton>
                        </Tooltip>
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
        </div>
    );
}