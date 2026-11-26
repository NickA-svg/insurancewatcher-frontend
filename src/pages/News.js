import React from 'react';
import { Alert, Box, Button, Card, CircularProgress, Link, Stack, Typography } from '@mui/material';
import InfiniteScroll from "react-infinite-scroller";
import { useInfiniteQuery } from "react-query";
import NewsCard from '../components/NewsCard';
import Tags from '../components/TitleTags';
import SearchBar from '../components/SearchBar';
import ScrollButton from '../components/ScrollComponent';
import Responses from '../services/GetResponse';
import EventMap from '../components/EventMap';
import { linkProps, navigate, setPageMeta, tagSlug } from '../router';
import "../assets/app.css"

const PAGE_SIZE = 10;
const fmtMonth = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

const MAP_TAGS = ["All", "Property", "Reinsurance", "Climate"];
const MAP_DAYS = 120;

// Compact world map of recent catastrophes on the news pages; the full, filterable map is on Cat Monitor.
function RecentCatMap() {
    const [events, setEvents] = React.useState(null);
    React.useEffect(() => {
        let cancelled = false;
        fetch(process.env.REACT_APP_API_KEY.concat("events?limit=80"))
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => { if (!cancelled) setEvents(d); })
            .catch(() => { if (!cancelled) setEvents([]); });
        return () => { cancelled = true; };
    }, []);
    const cutoff = new Date(Date.now() - MAP_DAYS * 864e5).toISOString().slice(0, 10);
    const recent = (events || []).filter((e) => String(e.start_date).slice(0, 10) >= cutoff && e.lat !== null && e.lat !== undefined);
    if (!recent.length) return null;
    return (
        <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                <Box>
                    <Typography variant="subtitle1">Catastrophes in the last four months</Typography>
                    <Typography variant="body2" color="text.secondary">Click an event for its loss estimates and market coverage.</Typography>
                </Box>
                <Link {...linkProps('/cat-monitor/')} underline="hover" sx={{ flexShrink: 0, fontSize: 14 }}>Cat Monitor →</Link>
            </Stack>
            <EventMap events={recent} onSelect={(s) => navigate(`/cat-monitor/${s}/`)} />
        </Card>
    );
}

// On Financial Lines: the newest filed securities class actions, from the litigation tracker.
function LatestSuits() {
    const [cases, setCases] = React.useState([]);
    React.useEffect(() => {
        let cancelled = false;
        fetch(process.env.REACT_APP_API_KEY.concat("securities-cases?kind=sca&limit=5"))
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => { if (!cancelled) setCases(d.cases || []); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);
    if (!cases.length) return null;
    return (
        <Card sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1">New securities class actions</Typography>
                <Link {...linkProps('/securities-class-actions/')} underline="hover" sx={{ flexShrink: 0, fontSize: 14 }}>Tracker →</Link>
            </Stack>
            {cases.map((c) => (
                <Typography key={c.case_key} variant="body2" sx={{ py: 0.3 }}>
                    <b>{c.company || c.ticker}</b> ({c.ticker}){c.sector ? ` · ${c.sector}` : ''}
                    <Typography component="span" variant="caption" color="text.secondary"> · announced {new Date(String(c.first_seen) + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Typography>
                </Typography>
            ))}
        </Card>
    );
}

export default function Home({ tag = "All" }) {
    const [searchQuery, setSearchQueryRaw] = React.useState("All");
    // a market event picked on the chart: its coverage comes from the event's own search phrases and dates
    const [event, setEvent] = React.useState(null);
    const setSearchQuery = (q) => { setEvent(null); setSearchQueryRaw(q); };
    const listRef = React.useRef(null);

    React.useEffect(() => {
        if (tag === "All") setPageMeta("InsuranceWatcher · Re/insurance and London market news", "The latest re/insurance and London market news from leading publications, tagged by line of business, with a market-cycle tracker and Cat Monitor.");
        else setPageMeta(`${tag} insurance news & market cycle · InsuranceWatcher`, `Latest ${tag.toLowerCase()} insurance and reinsurance news, rate momentum and market-moving events, updated through the day.`);
    }, [tag]);

    const selectTag = (t) => navigate(t === "All" ? "/" : `/news/${tagSlug(t)}/`, { scroll: false });

    const onEventClick = (e) => {
        setSearchQueryRaw("All");
        setEvent(e.key ? e : null);
        setTimeout(() => listRef.current && listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const fetchArticles = async ({ pageParam = 0 }) => {
        const url = process.env.REACT_APP_API_KEY.concat(
            `articles/${pageParam}/${event ? 'All' : encodeURIComponent(tag)}/${encodeURIComponent(searchQuery)}`
            + (event ? `?event=${encodeURIComponent(event.key)}` : '')
        );
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const results = await response.json();
        return { results, nextPage: pageParam + 1 };
    }

    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useInfiniteQuery(
        ["articles", tag, searchQuery, event && event.key],
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
            {MAP_TAGS.includes(tag) && <RecentCatMap />}
            {tag === "Financial Lines" && <LatestSuits />}

            <div ref={listRef} style={{ scrollMarginTop: 120 }} />
            {event && (
                <Box sx={{ mb: 1.5, p: 1.25, px: 1.5, borderRadius: 2, bgcolor: '#f3f6f8', border: '1px solid #e3e9ee' }}>
                    <Typography variant="body2">
                        Coverage of <b>{event.label}</b> since {fmtMonth(event.date)} ·{' '}
                        <Button size="small" onClick={() => setEvent(null)} sx={{ p: 0, minWidth: 0 }}>show all news</Button>
                    </Typography>
                </Box>
            )}
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
                <Alert severity="info">{event ? "No stored headlines for this event yet." : "No articles match this filter. Try another line of business or a broader search."}</Alert>
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
