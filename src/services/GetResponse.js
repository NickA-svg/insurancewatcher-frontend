import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard'
// import http from "../http-common";

const ResponseContext = React.createContext({
    repsonse: [], fetchResponse: () => { }
})

export default function Responses(props) {
    const [responses, setResponses] = useState([])
    const fetchResponse = async () => {
        const response = await fetch(process.env.REACT_APP_API_KEY.concat(props.root + "/" + props.page + "/" + props.tag))
        const message = await response.json()
        setResponses(message)
    }
    useEffect(() => {
        fetchResponse()
        // eslint-disable-next-line
    }, [props.page, props.tag])
    return (
        <ResponseContext.Provider value={{ responses, fetchResponse }}>
            {responses.map((card, index) =>
                <NewsCard
                    title={card.Title}
                    date={card.YearMonthDay}
                    summary={card.Summary}
                    url={card.Link}
                    tags={card.Tags}
                    searchTag={props.tag}
                    key={index}
                />
            )}
        </ResponseContext.Provider>
    )
}