import React, { useState, useEffect } from 'react';
import SentimentChart from '../components/ChartComponent';

export default function Responses({ root, tag, search }) {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let cancelled = false;
        setStatus('loading')
        fetch(process.env.REACT_APP_API_KEY.concat(`${root}/${encodeURIComponent(tag)}/${encodeURIComponent(search)}`))
            .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then((message) => { if (!cancelled) { setData(message); setStatus('ready'); } })
            .catch(() => { if (!cancelled) setStatus('error'); });
        return () => { cancelled = true; };
    }, [root, tag, search])

    return <SentimentChart status={status} tag={tag} data={data} />
}
