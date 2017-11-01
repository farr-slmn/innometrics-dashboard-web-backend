import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import {Link, Redirect, Route, Router, Switch} from "react-router-dom";

class Metrics extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projectId: props.project,
            metrics: [
                /*{
                    id: 1,
                    type: 'raw',
                    name: 'Win browser apps connect time',
                    filters: ['group=2'],
                    displayFields: ['from'],
                    field: ['datetime', 'from'],
                    groupby: 'day',
                },
                {
                    id: 2,
                    type: 'raw',
                    name: 'Win browser apps disconnect time',
                    filters: ['group=2'],
                    displayFields: ['until'],
                    field: ['datetime', 'until'],
                    groupby: 'day',
                },
                {
                    id: 3,
                    name: 'Win browser apps time',
                    type: 'composite',
                    components: [
                        {
                            id: 2,
                            type: 'raw',
                            name: 'Win browser apps disconnect time',
                            filters: ['group=2'],
                            displayFields: ['until'],
                            field: ['datetime', 'until'],
                        },
                        {
                            id: 1,
                            type: 'raw',
                            name: 'Win browser apps connect time',
                            filters: ['group=2'],
                            displayFields: ['from'],
                            field: ['datetime', 'from'],
                        },
                    ],
                    aggregate: 'timeinter',
                    groupby: ['day', 'sum'],
                },
                {
                    id: 6,
                    name: 'All apps time',
                    type: 'composite',
                    components: [
                        {
                            id: 5,
                            type: 'raw',
                            name: 'All apps disconnect time',
                            displayFields: ['until'],
                            field: ['datetime', 'until'],
                        },
                        {
                            id: 4,
                            type: 'raw',
                            name: 'All apps connect time',
                            displayFields: ['from'],
                            field: ['datetime', 'from'],
                        },
                    ],
                    aggregate: 'timeinter',
                    groupby: ['day', 'sum'],
                },*/
                {
                    id: 7,
                    name: 'Win browser apps / All apps time fraction',
                    type: 'composite',
                    components: [
                        {
                            id: 3,
                            name: 'Win browser apps time',
                            type: 'composite',
                            components: [
                                {
                                    id: 2,
                                    type: 'raw',
                                    name: 'Win browser apps disconnect time',
                                    filters: ['group=2'],
                                    displayFields: ['until'],
                                    field: ['datetime', 'until'],
                                },
                                {
                                    id: 1,
                                    type: 'raw',
                                    name: 'Win browser apps connect time',
                                    filters: ['group=2'],
                                    displayFields: ['from'],
                                    field: ['datetime', 'from'],
                                },
                            ],
                            aggregate: 'timeinter',
                            groupby: ['day', 'sum'],
                        },
                        {
                            id: 6,
                            name: 'All apps time',
                            type: 'composite',
                            components: [
                                {
                                    id: 5,
                                    type: 'raw',
                                    name: 'All apps disconnect time',
                                    displayFields: ['until'],
                                    field: ['datetime', 'until'],
                                },
                                {
                                    id: 4,
                                    type: 'raw',
                                    name: 'All apps connect time',
                                    displayFields: ['from'],
                                    field: ['datetime', 'from'],
                                },
                            ],
                            aggregate: 'timeinter',
                            groupby: ['day', 'sum'],
                        },
                    ],
                    aggregate: 'div',
                    groupby: ['day', 'sum'],
                },
            ],
            measurements: [],
            value: undefined,
        };
        this.metricComponents = this.state.metrics.map((metric, idx) => (
            <Metric project={this.state.projectId} key={metric.id} metricInfo={metric}/>
        ));
    }

    render() {
        return (
            <div>
                <Redirect from={"/project/" + this.state.projectId + "/metric/"} to={"/project/" + this.state.projectId + "/metric/" + this.state.metrics[0].id}/>
                {this.metricComponents}
            </div>
        );
    }

}

class Metric extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projectId: props.project,
            metricInfo: props.metricInfo,
            value: undefined,
            chartData: {},
            xValues: [],
            yValues: [],
            measurements: []
        };
        this.redirects = [];
        this.views = [];
        if (this.state.metricInfo.components) {
            this.state.metricInfo.components.map((compMet, idx) => {
                this.redirects.push(
                    <Link to={"/project/" + this.state.projectId + "/metric/" + compMet.id}>
                        <button type="button" className="btn btn-primary">{compMet.name}</button>

                    </Link>
                );
                this.views.push(
                    <Route path={"/project/" + this.state.projectId + "/metric/" + compMet.id} key={idx}>
                        <Metric project={this.state.projectId} metricInfo={compMet}/>
                    </Route>
                );
                if (compMet.components) {
                    compMet.components.map(met => {
                        this.views.push(
                            <Route path={"/project/" + this.state.projectId + "/metric/" + met.id} key={idx}>
                                <Metric project={this.state.projectId} metricInfo={met}/>
                            </Route>
                        );
                    });
                }

            });

        }
    }

    groupday(value, index, array) {
        d = new Date(value['date']);
        d = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
        byday[d] = byday[d] || [];
        byday[d].push(value);
    }

    groupweek(value, index, array) {
        d = new Date(value['date']);
        d = Math.floor(d.getTime() / (1000 * 60 * 60 * 24 * 7));
        byweek[d] = byweek[d] || [];
        byweek[d].push(value);
    }

    groupmonth(value, index, array) {
        d = new Date(value['date']);
        d = (d.getFullYear() - 1970) * 12 + d.getMonth();
        bymonth[d] = bymonth[d] || [];
        bymonth[d].push(value);
    }

    componentDidMount() {
        if (this.state.metricInfo.type === 'raw') {
            let url = '/measurements/joined/?project=' + this.state.projectId;
            if (this.state.metricInfo.filters) {
                this.state.metricInfo.filters.map((filter) => {
                    url += '&' + filter;
                });
            }
            fetch(url, {credentials: "same-origin"})
                .then(results => results.json())
                .then(data => {
                    let newState = {
                        measurements: data.measurements,
                    };
                    if (this.state.metricInfo.field) {
                        // let fieldName = this.state.metricInfo.field[1];
                        let dataWithField = data.measurements.filter((m) => this.state.metricInfo.displayFields.includes(m.name));
                        newState['measurements'] = dataWithField;
                        let aggr = this.state.metricInfo.aggregate;
                        if (aggr) {
                            let for_aggregation = dataWithField.map((m) => {
                                switch (this.state.metricInfo.field[0]) {
                                    case 'int':
                                    case 'long':
                                        return Number(m.value);
                                        break;
                                    case 'datetime':
                                        return Date.parse(m.value.toUpperCase());
                                        break;
                                }
                                return m.value;
                            });
                            switch (aggr) {
                                case 'sum':
                                    newState['value'] = for_aggregation.reduce((a, b) => a + b, 0);
                                    break;
                            }
                        }
                    }

                    this.setState(newState);

                });
        } else {
            let ms = [];

            let requests = [];
            let fetchMeasurements = function (metric, idx, projId) {
                let url = '/measurements/joined/?project=' + projId;
                if (metric.filters) {
                    metric.filters.map((filter) => {
                        url += '&' + filter;
                    });
                }
                requests.push(
                    fetch(url, {credentials: "same-origin"})
                        .then(results => results.json())
                        .then(data => {
                            ms[idx] = data.measurements;
                        })
                );
            };
            this.state.metricInfo.components.map((metric, idx) => {
                if (metric.type === 'raw') {
                    fetchMeasurements(metric, idx, this.state.projectId);
                } else {
                    metric.components.map((m, i) => {
                        fetchMeasurements(m, 2 * idx + i, this.state.projectId);
                    });
                }
            });

            Promise.all(requests)
                .then(() => {
                    // console.log('Metrics', ms);
                    let compositeStates = [];

                    let compositeMetrics = [];
                    if (this.state.metricInfo.components[0].type === 'raw') {
                        compositeMetrics.push([this.state.metricInfo, ms]);
                    } else {
                        compositeMetrics.push([this.state.metricInfo.components[0], ms.slice(0, 2)]);
                        compositeMetrics.push([this.state.metricInfo.components[1], ms.slice(2, 4)]);
                    }
                    compositeMetrics.map(compMet => {
                        // console.log('compMet', compMet);
                        let name = compMet[0].name;
                        let components = compMet[0].components;
                        let aggregate = compMet[0].aggregate;
                        let groupby = compMet[0].groupby;

                        let activityMeasurements = {};
                        components.map((metric, idx) => {
                            // if (metric.field) {
                            let dataWithField = compMet[1][idx].filter(m => metric.field.includes(m.name));

                            dataWithField.map(m => {
                                activityMeasurements[m.activity_id] = activityMeasurements[m.activity_id] || [];
                                activityMeasurements[m.activity_id].push(m);
                            });
                        });
                        // console.log('activityMeasurements', activityMeasurements);
                        let activityValues = [];
                        Object.keys(activityMeasurements).map((key, idx) => {
                            switch (aggregate) {
                                case 'minus':
                                    let a = activityMeasurements[key][0].value;
                                    let b = activityMeasurements[key][1].value;
                                    activityValues.push({
                                        value: (a - b),
                                        source: [activityMeasurements[key][0], activityMeasurements[key][1]]
                                    });
                                    break;
                                case 'timeinter':
                                    let c = Date.parse(activityMeasurements[key][0].value.toUpperCase());
                                    let d = Date.parse(activityMeasurements[key][1].value.toUpperCase());
                                    activityValues.push({
                                        value: (c - d),
                                        source: [activityMeasurements[key][0], activityMeasurements[key][1]]
                                    });
                                    break;
                            }
                        });

                        // console.log('activityValues', activityValues);
                        function groupByDay(activityValues, key_func, agg_func) {
                            let byDay = {};
                            // console.log(byDay);
                            activityValues.map(av => {
                                let d = new Date(key_func(av));
                                let day = Math.floor(d.getTime() / (1000 * 60 * 60 * 24)) * (1000 * 60 * 60 * 24);
                                if (day) {
                                    day = String(day);
                                    byDay[day] = byDay[day] || 0;
                                    byDay[day] = agg_func(byDay[day], av.value);
                                }
                            });
                            return byDay;
                        }

                        // console.log('Values', activityValues);
                        if (groupby) {
                            switch (groupby[0]) {
                                case 'day':
                                    let agg_func = (a, b) => a + b;
                                    if (groupby[1] === 'sum') {

                                    }
                                    // console.log('Gr', activityValues);
                                    let grouped = groupByDay(activityValues,
                                        (actVal) => {
                                            let timestamp = 0;
                                            actVal.source.map((m) => {
                                                if (m.name === 'connect time') {
                                                    timestamp = m.value;
                                                }
                                                if (m.name === 'from') {
                                                    timestamp = Date.parse(m.value.toUpperCase());
                                                }
                                            });
                                            return Number(timestamp);
                                        }, agg_func);
                                    let xVal = [];
                                    let yVal = [];
                                    console.log('grouped', grouped);
                                    Object.keys(grouped).map((key, idx) => {
                                        yVal.push(new Date(Number(key)).toDateString());
                                        xVal.push(grouped[key]);
                                    });
                                    // console.log(yVal);
                                    // console.log(xVal);
                                    let chartData = {
                                        labels: yVal,
                                        datasets: [
                                            {
                                                label: name,
                                                fill: true,
                                                lineTension: 0.1,
                                                backgroundColor: 'rgba(75,192,192,0.4)',
                                                borderColor: 'rgba(75,192,192,1)',
                                                borderCapStyle: 'butt',
                                                borderDash: [],
                                                borderDashOffset: 0.0,
                                                borderJoinStyle: 'miter',
                                                pointBorderColor: 'rgba(75,192,192,1)',
                                                pointBackgroundColor: '#fff',
                                                pointBorderWidth: 1,
                                                pointHoverRadius: 5,
                                                pointHoverBackgroundColor: 'rgba(75,192,192,1)',
                                                pointHoverBorderColor: 'rgba(220,220,220,1)',
                                                pointHoverBorderWidth: 2,
                                                pointRadius: 1,
                                                pointHitRadius: 10,
                                                data: xVal
                                            }
                                        ]
                                    };
                                    compositeStates.push({
                                        chartData: chartData,
                                        yValues: yVal,
                                        xValues: xVal,
                                        value: xVal ? xVal[xVal.length - 1] : undefined,
                                    });
                                    break;
                                case 'week':
                                    break;
                            }
                        }
                    });
                    if (this.state.metricInfo.components[0].type === 'raw') {
                        this.setState(compositeStates[0]);

                    } else {
                        let chartData = compositeStates[0].chartData;
                        let xVal0 = compositeStates[0].xValues;
                        let xVal1 = compositeStates[1].xValues;

                        // TODO map according to date
                        let xVal = xVal0.map((x, i) => {
                            switch (this.state.metricInfo.aggregate) {
                                case 'div':
                                    return x / xVal1[i];
                                case 'mult':
                                    return x * xVal1[i];
                                case 'sum':
                                    return x + xVal1[i];
                                case 'minus':
                                    return x - xVal1[i];
                                case 'avg':
                                    return (x + xVal1[i]) / 2;
                            }
                        });
                        chartData.datasets[0].data = xVal;
                        chartData.datasets[0].label = this.state.metricInfo.name;

                        this.setState({
                            chartData: chartData,
                            yValues: compositeStates[0].yValues,
                            xValues: xVal,
                            value: xVal ? xVal[xVal.length - 1] : undefined,
                        });
                    }
                });
        }
    }

    render() {
        return (
            <div className="">


                <Switch>
                    <Route exact path={"/project/" + this.state.projectId + "/metric/" + this.state.metricInfo.id}>
                        <div>
                        {this.redirects}
                        {this.state.value}
                        <MetricChart type={this.state.metricInfo.type} data={this.state.chartData}/>

                        <table className="table table-striped">
                            <thead>
                            <TableHeaders measurement={this.state.measurements[0]}/>
                            </thead>
                            <tbody>
                            {this.state.measurements.map((measurement, idx) => (
                                <tr key={idx}>
                                    <th scope="row">{idx + 1}</th>
                                    {Object.keys(measurement).map((key, index) => (
                                        <td key={index}>{measurement[key]}</td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    </Route>
                    {/*<Redirect from={"/project/" + this.state.projectId + "/metrics/"}*/}
                    {/*to={"/project/" + this.state.projectId + "/metrics/" + this.state.metricInfo.id}/>*/}

                    {/*<MetricRoutes projectId={this.state.projectId} components={this.state.metricInfo.components}/>*/}

                    {this.views}



                </Switch>
            </div>
        );
    }
}

function TableHeaders(props) {
    if (props.measurement) {
        return (
            <tr>
                <th>#</th>
                {Object.keys(props.measurement).map((field, idx) => (
                    <th key={idx}>{field}</th>
                ))}
            </tr>
        );
    }
    return (null);
}

function MetricChart(props) {
    if (props.type !== 'raw') {
        return (
            <Line data={props.data}/>
        );
    }
    return (null);
}

/*function MetricRoutes(props) {
    if (props.components) {
        return (
            <div>
                <button type="button" className="btn btn-primary">
                    {props.components[0].name}
                    <Link to={"/project/" + props.projectId + "/metric/" + props.components[0].id}/>
                </button>
                <button type="button" className="btn btn-primary">
                    {props.components[1].name}
                    <Link to={"/project/" + props.projectId + "/metric/" + props.components[1].id}/>
                </button>
                <Switch>
                    <Route path={"/project/" + props.projectId + "/metric/" + props.components[0].id}>
                        <Metrics project={props.projectId}/>
                    </Route>
                </Switch>
                <Switch>
                    <Route path={"/project/" + props.projectId + "/metric/" + props.components[1].id}>
                        <Metrics project={props.projectId}/>
                    </Route>
                </Switch>
            </div>
        );
    } else {
        return (null);
    }
}*/

export default Metrics;
