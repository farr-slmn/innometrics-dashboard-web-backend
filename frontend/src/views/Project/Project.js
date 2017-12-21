import React, {Component} from 'react';
import Members from '../Members/Members'
import {NavLink, Redirect, Route, Switch} from "react-router-dom";
import MetricTile from "../Metrics/MetricTile";
import {Button, Container} from 'reactstrap';
import NewMetricModal from "./NewMetricModal";
import MetricsContainer from "../../containers/MetricContainer/MetricsContainer";
import {SyncLoader} from "react-spinners";

class Project extends Component {
    constructor(props) {
        super(props);
        this.proj = props.proj;
        this.state = {
            metrics: [],
            newMetricModal: true,
            loading: false,
        };

        this.toggle = this.toggle.bind(this);
        this.newMetric = this.newMetric.bind(this);
    }

    componentDidMount() {
        let url = '/projects/metrics/';
        if (Number.isInteger(this.proj.id)) {
            url += '?project=' + this.proj.id;
        }
        this.setState({loading: true});
        fetch(url, {credentials: "same-origin"})
            .then(results => results.json())
            .then(data => {
                this.setState({
                    metrics: data.metrics,
                    loading: false,
                });
            });
    }

    toggle() {
        this.setState({
            newMetricModal: !this.state.newMetricModal
        });
    }

    newMetric(metrics) {
        let mergedMetrics = this.state.metrics;
        for (let i = 0; i < metrics.length; i++) {
            let idx = mergedMetrics.findIndex(el => metrics[i].id === el.id);
            if (idx >= 0) {
                mergedMetrics[idx] = metrics[i];
            } else {
                mergedMetrics.push(metrics[i]);
            }
        }
        this.setState({
            metrics: mergedMetrics,
        });
    }

    render() {
        const pr_bar_style = {
            width: '25%'
        };

        return (
            <div>
                <div className="breadcrumb">
                    <h5>{this.proj.name}</h5>
                    <div className="breadcrumb-menu d-md-down-none">
                        <Button onClick={this.toggle} color="link"><i className="icon-plus"/> New metric</Button>
                    </div>
                </div>
                <Container fluid>
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <NavLink to={"/project/" + this.proj.id + "/general/"} className="nav-link"
                                 activeClassName="active">General</NavLink>
                    </li>
                    <li className="nav-item">
                        {/* disable link for default project */}
                        <NavLink to={"/project/" + this.proj.id + "/members/"} className="nav-link"
                                 style={Number.isInteger(this.proj.id) ? {} : {pointerEvents: 'none'}}
                                 activeClassName="active">Project members</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to={"/project/" + this.proj.id + "/metric/"} className="nav-link"
                                 activeClassName="active">Metrics</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to={"/project/" + this.proj.id + "/preferences/"} className="nav-link"
                                 activeClassName="active">Preferences</NavLink>
                    </li>
                </ul>
                <Switch>
                    <Redirect exact from={"/project/" + this.proj.id} to={"/project/" + this.proj.id + "/general/"}/>
                </Switch>
                <Switch>
                    <Route path={"/project/" + this.proj.id + "/preferences/"}>
                        <div>
                            <div>
                                Project name: {this.proj.name}
                            </div>
                            <div>
                                Warnings: {this.proj.warnings}
                            </div>
                        </div>
                    </Route>
                </Switch>
                <Switch>
                    <Route path={"/project/" + this.proj.id + "/members/"}>
                        <Members participants={this.proj.participants}/>
                    </Route>
                </Switch>
                <Switch>
                    <Route path={"/project/" + this.proj.id + "/general/"} name="General">
                        <div className="container">
                            <div className="row card-group animated fadeIn">
                                <div className="card">
                                    <div className="card-block">
                                        <div className="h1 text-muted text-right mb-2">
                                            <i className="icon-people"/>
                                        </div>
                                        <div className="h4 mb-0">87.500</div>
                                        <small className="text-muted text-uppercase font-weight-bold">Metric 1</small>
                                        <div className="progress progress-xs mt-1 mb-0">
                                            <div className="progress-bar bg-info" role="progressbar"
                                                 style={pr_bar_style} aria-valuenow="25" aria-valuemin="0"
                                                 aria-valuemax="100"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-block">
                                        <div className="h1 text-muted text-right mb-2">
                                            <i className="icon-user-follow"></i>
                                        </div>
                                        <div className="h4 mb-0">385</div>
                                        <small className="text-muted text-uppercase font-weight-bold">Metric 2</small>
                                        <div className="progress progress-xs mt-1 mb-0">
                                            <div className="progress-bar bg-success" role="progressbar"
                                                 style={pr_bar_style} aria-valuenow="25" aria-valuemin="0"
                                                 aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-block">
                                        <div className="h1 text-muted text-right mb-2">
                                            <i className="icon-basket-loaded"></i>
                                        </div>
                                        <div className="h4 mb-0">1238</div>
                                        <small className="text-muted text-uppercase font-weight-bold">Metric 3</small>
                                        <div className="progress progress-xs mt-1 mb-0">
                                            <div className="progress-bar bg-warning" role="progressbar"
                                                 style={pr_bar_style} aria-valuenow="25" aria-valuemin="0"
                                                 aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-block">
                                        <div className="h1 text-muted text-right mb-2">
                                            <i className="icon-pie-chart"></i>
                                        </div>
                                        <div className="h4 mb-0">28%</div>
                                        <small className="text-muted text-uppercase font-weight-bold">Metric 4</small>
                                        <div className="progress progress-xs mt-1 mb-0">
                                            <div className="progress-bar" role="progressbar" style={pr_bar_style}
                                                 aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-block">
                                        <div className="h1 text-muted text-right mb-2">
                                            <i className="icon-speedometer"></i>
                                        </div>
                                        <span className="text-nowrap">
                              <small className="text-muted text-uppercase font-weight-bold">Time Spent:</small> <span
                                            className="h4 mb-0 text-right">72:34</span><br/>
                              <small className="text-muted text-uppercase font-weight-bold">Time Left:</small> <span
                                            className="h4 mb-0 text-right">216:26</span>
                          </span>
                                        <div className="progress progress-xs mt-1 mb-0">
                                            <div className="progress-bar bg-danger" role="progressbar"
                                                 style={pr_bar_style} aria-valuenow="25" aria-valuemin="0"
                                                 aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <SyncLoader loading={this.state.loading} color="#36D7B7" size={20} margin="10px"/>
                            </div>

                            <div className="row">
                                {this.state.metrics.filter(metric => metric.type === 'C')
                                    .map(metric => (
                                        <div className="col-12 col-sm-3 col-md-2 animated fadeIn" key={metric.id}>
                                            <MetricTile trend="neutral"
                                                        projectId={this.proj.id}
                                                        id={metric.id}
                                                        name={metric.name}
                                                        value={metric.value}/>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </Route>
                </Switch>

                <Switch>
                    <Route path={"/project/" + this.proj.id + "/metric/"}>
                        <MetricsContainer projId={this.proj.id} metrics={this.state.metrics} loading={this.state.loading}/>
                    </Route>
                </Switch>

                <NewMetricModal newMetricModal={this.state.newMetricModal} toggle={this.toggle} callbk={this.newMetric}
                                projId={this.proj.id} metrics={this.state.metrics}/>

                </Container>
            </div>
        )
    }
}

export default Project;
