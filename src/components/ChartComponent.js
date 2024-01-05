import * as React from 'react';
import { ResponsiveChartContainer } from '@mui/x-charts/ResponsiveChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsLegend } from '@mui/x-charts/ChartsLegend';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { Card } from '@mui/material';
import { CircularProgress, Box, Typography } from '@mui/material';

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
}).format;

function getWindowDimensions() {
    let { innerWidth: width, innerHeight: height } = window;
    if (width < 950) {
        width = 900
    }
    else { width = width * 0.7 }
    return {
        width,
        height
    };
}

function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = React.useState(getWindowDimensions());

    React.useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

export default function AxisWithComposition(props) {
    // eslint-disable-next-line no-unused-vars
    const { width, height } = useWindowDimensions()
    // props.xAxis.slice(Math.max(props.xAxis.length - dataLength, 0))
    return (
        <div className='card-div'>
            <Card sx={{ minWidth: 275, padding: '5px', margin: "10px", backgroundColor: "#fff", overflowX: 'scroll' }}>
                {props.isLoading ?
                    <div className='loader-div'>
                        <Box display='flex' justifyContent='center'>
                            <Typography position='absolute' sx={{ marginTop: 5, paddingTop: 7 }}>Loading Sentiment Tracker...</Typography>
                            <CircularProgress sx={{ margin: 5 }} color='secondary' />
                        </Box>
                    </div> :
                    <ResponsiveChartContainer
                        width={width}
                        xAxis={[
                            {
                                scaleType: 'band',
                                data: props.xAxis,
                                id: 'quarters',
                                hideTooltip: false,
                                tickLabelStyle: {
                                    angle: 45,
                                    textAnchor: 'start',
                                },
                                tickLabelInterval: (value, index) => index % 2 === 0
                            },
                        ]}
                        yAxis={[{ id: 'sentiment' }, { id: 'stock' }]}
                        series={[
                            {
                                type: 'line',
                                id: 'stock',
                                yAxisKey: 'stock',
                                data: props.Stock,
                                label: "S&P 500 Insurance",
                                curve: 'linear',
                                color: '#d100ff',
                                valueFormatter: currencyFormatter
                            },
                            {
                                type: 'line',
                                id: 'sentiment',
                                yAxisKey: 'sentiment',
                                data: props.Sentiment,
                                connectNulls: true,
                                color: '#00ffd1',
                                label: `${props.tagSearch} Market Sentiment`,
                            },
                            {
                                type: 'line',
                                id: 'trend',
                                yAxisKey: 'sentiment',
                                data: props.Trend,
                                connectNulls: true,
                                showMark: false,
                                color: '#ff002e',
                                label: 'Sentiment Trend'
                            },
                        ]}
                        height={500}
                        margin={{ left: 70, right: 70, bottom: 140 }}
                        sx={{
                            [`.${axisClasses.left} .${axisClasses.label}`]: {
                                transform: 'translate(-25px, 0)',
                            },
                            [`.${axisClasses.right} .${axisClasses.tickLabel}`]: {
                                display: 'None'
                            },
                            [`.${axisClasses.right} .${axisClasses.label}`]: {
                                transform: 'translate(5px, 0)',
                            },
                        }}
                    >
                        <LinePlot slotProps={{
                            legend: {
                                direction: 'row',
                            },
                        }} />
                        <MarkPlot />
                        <ChartsXAxis axisId="quarters" />
                        <ChartsYAxis axisId="sentiment" label="Sentiment Index" position="right" />
                        <ChartsYAxis axisId="stock" label="Stock Price ($USD)" />
                        <ChartsLegend direction="row" position={{ vertical: 'bottom', horizontal: 'middle' }} />
                        <ChartsTooltip scaleType={'band'} />
                    </ResponsiveChartContainer>
                }
            </Card>
        </div >
    );
}