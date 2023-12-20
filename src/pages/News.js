import React from 'react';
import NewsCard from '../components/NewsCard';
import { CircularProgress, Alert } from '@mui/material';
import InfiniteScroll from "react-infinite-scroller";
import { useInfiniteQuery } from "react-query";
import SplitContent from "../components/SplitContent"
import Tags from '../components/TitleTags';
import "../assets/app.css"

export default function Home() {
    const [tagWord, setTag] = React.useState("All")

    function handleTag(event) {
        let tagText = event.target.firstChild.data
        if (tagText === undefined) {
            tagText = event.target.id
        }
        setTag(tagText)
    }
    const fetchArticles = async ({ pageParam = 0 }) => {
        const response = await fetch(process.env.REACT_APP_API_KEY.concat("articles/" + pageParam + "/" + tagWord));
        const results = await response.json();
        return { results, nextPage: pageParam + 1, totalPages: 100 };
    }

    const {
        data,
        isLoading,
        isError,
        hasNextPage,
        fetchNextPage
    } = useInfiniteQuery(["articles", tagWord], fetchArticles, {
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.nextPage < lastPage.totalPages) return lastPage.nextPage;
            return undefined;
        }
    });

    return (<>
        <SplitContent
            leftColumm={<br></br>}
            rightColumn={
                <>
                    <Tags handleTag={handleTag} tag={tagWord} />
                    {isLoading ? (
                        <div class='loader-div'><CircularProgress color='secondary' /></div>
                    ) : isError ? (
                        <Alert severity="warning">There was an error</Alert>
                    ) : (
                        <InfiniteScroll style={{ height: '120%' }} hasMore={hasNextPage} loadMore={fetchNextPage}>
                            {data.pages.map((page) =>
                                page.results.map((card, index) => <NewsCard
                                    title={card.Title}
                                    date={card.YearMonthDay}
                                    summary={card.Summary}
                                    url={card.Link}
                                    tags={card.Tags}
                                    searchTag={tagWord}
                                    key={index}
                                />)
                            )}
                        </InfiniteScroll>
                    )}
                </>
            }
            sideMenu={<br></br>}
        />
    </>)
}