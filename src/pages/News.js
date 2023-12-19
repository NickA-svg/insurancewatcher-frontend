import React from 'react';
import Responses from '../services/GetResponse'
import SplitContent from "../components/SplitContent"
import Tags from '../components/TitleTags';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

export default function Home() {
    const [tagWord, setTag] = React.useState("All")
    const [page, setPage] = React.useState(0)

    function handleNext() {
        setPage(prevPage => prevPage + 1)
    }
    function handleBack() {
        setPage(prevPage => prevPage === 0 ? 0 : prevPage - 1)
    }

    function handleTag(event) {
        let tagText = event.target.firstChild.data
        if (tagText === undefined) {
            tagText = event.target.id
        }
        setTag(tagText)
        setPage(0)
    }

    return (<>
        <SplitContent
            leftColumm={<br></br>}
            rightColumn={
                <>
                    <Tags handleTag={handleTag} tag={tagWord} />
                    <Responses root="articles" page={page} tag={tagWord} value="response" />
                    <div className='article-nav'>
                        <Stack direction="row" spacing={1} >
                            <IconButton onClick={handleBack} disabled={page === 0 ? true : false}>
                                <ArrowBackIosIcon />
                                Back
                            </IconButton>
                            <IconButton onClick={handleNext}>
                                Next
                                <ArrowForwardIosIcon />
                            </IconButton>
                        </Stack>
                    </div>
                </>
            }
            sideMenu={<br></br>}
        />
    </>)
}