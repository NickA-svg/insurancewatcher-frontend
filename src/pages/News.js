import React from 'react';
import NewsCard from '../components/NewsCard';
import { CircularProgress, Alert } from '@mui/material';
import InfiniteScroll from "react-infinite-scroller";
import { useInfiniteQuery } from "react-query";
import SplitContent from "../components/SplitContent"
import Tags from '../components/TitleTags';
import AdsComponent from '../components/AdComponent';
import SearchBar from '../components/SearchBar';
import ScrollButton from '../components/ScrollComponent';
import "../assets/app.css"

export default function Home() {
    const [tagWord, setTag] = React.useState("All")
    const [searchQuery, setSearchQuery] = React.useState("All");

    function handleTag(event) {
        let tagText = event.target.firstChild.data
        if (tagText === undefined) {
            tagText = event.target.id
        }
        setTag(tagText)
    }

    const fetchArticles = async ({ pageParam = 0 }) => {
        const response = await fetch(process.env.REACT_APP_API_KEY.concat("articles/" + pageParam + "/" + tagWord + "/" + searchQuery));
        const results = await response.json();
        return { results, nextPage: pageParam + 1, totalPages: 100 };
    }

    const {
        data,
        isLoading,
        isError,
        hasNextPage,
        fetchNextPage
    } = useInfiniteQuery(["articles", tagWord, searchQuery], fetchArticles, {
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
                    <div id="target2"></div>
                    <Tags handleTag={handleTag} tag={tagWord} />
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                    {isLoading ? (
                        <div class='loader-div'><CircularProgress color='secondary' /></div>
                    ) : isError ? (
                        <Alert severity="warning">Loading error, please try again or amed search query!</Alert>
                    ) : (
                        <>
                            <InfiniteScroll id="target" useWindow={false} hasMore={hasNextPage} loadMore={fetchNextPage}>
                                {data.pages.map((page) =>
                                    page.results.map((card, index) => <NewsCard
                                        title={card.Title}
                                        date={card.YearMonthDay}
                                        summary={card.Summary}
                                        url={card.Link}
                                        tags={card.Tags}
                                        searchTag={tagWord}
                                        key={index}
                                    />))}
                            </InfiniteScroll>
                            <ScrollButton id="target" />
                        </>
                    )}
                    <AdsComponent />
                </>
            }
            sideMenu={<></>}
        />
    </>)
}