import React from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import InfiniteScroll from "react-infinite-scroller";
import { useInfiniteQuery } from "react-query";
import NewsCard from '../components/NewsCard';
import Tags from '../components/TitleTags';
import SearchBar from '../components/SearchBar';
import ScrollButton from '../components/ScrollComponent';
import Responses from '../services/GetResponse';
import { navigate, setPageMeta, tagSlug } from '../router';
import "../assets/app.css"

const PAGE_SIZE = 10;
const GENERIC = /^(hurricane|storm|winter|typhoon|cyclone|the|russia|us|uk|european|global)$/i;

// The word to search headlines for when an event chip is clicked, e.g. "Hurricane Ian" -> "Ian".
function eventKeyword(label) {
    const words = label.replace(/[()/–-]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
    return words.find((w) => !GENERIC.test(w)) || words[0];
}

export default function Home({ tag = "All" }) {
    const [searchQuery, setSearchQuery] = React.useState("All");
    const listRef = React.useRef(null);

    React.useEffect(() => {
        if (tag === "All") setPageMeta("InsuranceWatcher · Re/insurance and London market news", "The latest re/insurance and London market news from leading publications, tagged by line of business, with a market-cycle tracker and Cat Monitor.");
        else setPageMeta(`${tag} insurance news & market cycle · InsuranceWatcher`, `Latest ${tag.toLowerCase()} insurance and reinsurance news, rate momentum and market-moving events, updated through the day.`);
    }, [tag]);

    const selectTag = (t) => navigate(t === "All" ? "/" : `/news/${tagSlug(t)}/`, { scroll: false });

    const onEventClick = (e) => {
        setSearchQuery(eventKeyword(e.label));
        setTimeout(() => listRef.current && listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const fetchArticles = async ({ pageParam = 0 }) => {
        const url = process.env.REACT_APP_API_KEY.concat(
            `articles/${pageParam}/${encodeURIComponent(tag)}/${encodeURIComponent(searchQuery)}`
        );
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const results = await response.json();
        return { results, nextPage: pageParam + 1 };
    }

    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useInfiniteQuery(
        ["articles", tag, searchQuery],
        fetchArticles,
        {
            getNextPageParam: (lastPage) => (lastPage.results.length === PAGE_SIZE ? lastPage.nextPage : undefined),
            staleTime: 5 * 60 * 1000,
        }
    );

    const articles = data ? data.pages.flatMap((p) => p.results) : [];
    const searching = searchQuery !== "All";

    return (
        <div className="page">
            <Box sx={{ pt: { xs: 3, sm: 4 }, pb: 1 }}>
                <Typography component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {tag === "All" ? "Latest re/insurance news" : `${tag} insurance news`}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    {tag === "All" ? "Headlines from leading market publications, with the market cycle and the events behind it." : `${tag} headlines, rate momentum and the events moving the market.`}
                </Typography>
            </Box>

            <div className="filters">
                <Tags tag={tag} onSelect={selectTag} />
                <SearchBar key={searchQuery === "All" ? "empty" : searchQuery} initial={searchQuery === "All" ? "" : searchQuery.replaceAll("+", " ")} setSearchQuery={setSearchQuery} />
            </div>

            <Responses root="market" tag={tag} search="All" onEventClick={onEventClick} />

            <div ref={listRef} style={{ scrollMarginTop: 120 }} />
            {searching && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Showing results for “{searchQuery.replaceAll("+", " ")}”{tag !== "All" ? ` in ${tag}` : ""} ·{' '}
                    <Button size="small" onClick={() => setSearchQuery("All")} sx={{ p: 0, minWidth: 0 }}>clear</Button>
                </Typography>
            )}

            {isLoading ? (
                <div className="loader-div"><CircularProgress color="secondary" /></div>
            ) : isError ? (
                <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
                    Articles couldn't load. Please try again.
                </Alert>
            ) : articles.length === 0 ? (
                <Alert severity="info">No articles match this filter. Try another line of business or a broader search.</Alert>
            ) : (
                <InfiniteScroll
                    hasMore={!!hasNextPage}
                    loadMore={() => { if (!isFetchingNextPage) fetchNextPage(); }}
                    threshold={600}
                    loader={<div className="loader-div" key="loader"><CircularProgress size={28} color="secondary" /></div>}
                >
                    {articles.map((card) => (
                        <NewsCard key={card.Link} title={card.Title} date={card.YearMonthDay} summary={card.Summary}
                            url={card.Link} tags={card.Tags} searchTag={tag} />
                    ))}
                </InfiniteScroll>
            )}
            <ScrollButton />
        </div>
    )
}
