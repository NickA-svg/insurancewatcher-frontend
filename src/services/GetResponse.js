import React, { useState, useEffect } from 'react';
import AxisWithComposition from '../components/ChartComponent';

const ResponseContext = React.createContext({
    repsonse: [], fetchResponse: () => { }
})

export default function Responses(props) {
    const [responses, setResponses] = useState({
        'xAxis': [''],
        'sentiment': [],
        'trend': [],
        'stock': [],
    })
    const [isLoading, setLoading] = useState(true)

    const fetchResponse = async () => {
        setLoading(true)
        const response = await fetch(process.env.REACT_APP_API_KEY.concat(props.root + "/" + props.tag + "/" + props.search))
        const message = await response.json()
        setResponses(message)
        setLoading(false)
    }
    useEffect(() => {
        fetchResponse()
        // eslint-disable-next-line
    }, [props.tag, props.search])
    return (
        <ResponseContext.Provider value={{ responses, fetchResponse }}>
            {<AxisWithComposition isLoading={isLoading} tagSearch={props.tag} xAxis={responses.xAxis} Sentiment={responses.sentiment} Trend={responses.trend} Stock={responses.stock} />}
        </ResponseContext.Provider>
    )
}