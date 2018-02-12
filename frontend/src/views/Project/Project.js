import React, {Component} from 'react';
import Members from '../Members/Members'
import {NavLink, Redirect, Route, Switch} from "react-router-dom";
import MetricTile from "../Metrics/MetricTile";
import {Button, Col, Container, Row} from 'reactstrap';
import NewMetricModal from "./NewMetricModal";
import MetricsContainer from "../../containers/MetricContainer/MetricsContainer";
import {SyncLoader} from "react-spinners";
import ActivitiesTab from "./ActivitiesTab";

class Project extends Component {
    constructor(props) {
        super(props);
        this.proj = props.proj;
        this.state = {
            activities: [],
            metrics: [],
            newMetricModal: false,
            loading: false,
            redirect: false,
        };

        this.toggle = this.toggle.bind(this);
        this.newMetric = this.newMetric.bind(this);
        this.loadMetricValues = this.loadMetricValues.bind(this);

        let project = Number.isInteger(this.proj.id) ? '?project=' + this.proj.id : '';
        this.links = {
            activities: '/projects/metrics/activities/' + project,
            metrics: '/projects/metrics/' + project,
            metricsValues: '/projects/metrics/values/' + project,
        };

        this.routes = {
            login: "/login",
            project: "/dashboard/project/" + this.proj.id,
            tabGeneral: "/dashboard/project/" + this.proj.id + "/general/",
            tabMembers: "/dashboard/project/" + this.proj.id + "/members/",
            tabActivities: "/dashboard/project/" + this.proj.id + "/activities/",
            tabMetrics: "/dashboard/project/" + this.proj.id + "/metric/",
            tabPreferences: "/dashboard/project/" + this.proj.id + "/preferences/",
        };
    }

    componentDidMount() {
        let url = this.links.metrics;
        this.setState({loading: true});
        fetch(url, {credentials: "same-origin"})
            .then(response => {
                if (response && response.status === 401) {
                    this.setState({redirect: true});
                } else if (!response || response.status !== 200) {
                    window.alert("Bad response from server: " + response.status);
                    console.log(response);
                }
                return response.json();
            })
            .then(data => {
                this.setState({
                    metrics: data.metrics,
                    loading: false,
                });
                this.loadMetricValues();
            });

        // retrieve activities and activities properties for autocomplete
        url = this.links.activities;
        fetch(url, {credentials: "same-origin"})
            .then(response => {
                if (response && response.status === 401) {
                    this.setState({redirect: true});
                } else if (!response || response.status !== 200) {
                    window.alert("Bad response from server: " + response.status);
                    console.log(response);
                }
                return response.json();
            })
            .then(data => {
                this.setState({
                    activities: data.activities,
                });
            });
    }

    loadMetricValues() {
        let url = this.links.metricsValues;
        fetch(url, {credentials: "same-origin"})
            .then(response => {
                if (response && response.status === 401) {
                    this.setState({redirect: true});
                } else if (!response || response.status !== 200) {
                    window.alert("Bad response from server: " + response.status);
                    console.log(response);
                }
                return response.json();
            })
            .then(data => {
                this.setState({
                    metrics: data.metrics,
                });
            });
    }

    toggle() {
        this.setState({
            newMetricModal: !this.state.newMetricModal
        });
    }

    newMetric(metric) {
        let mergedMetrics = this.state.metrics;
        mergedMetrics.push(metric);
        this.setState({
            metrics: mergedMetrics,
        });
    }

    deleteMetric(metricId) {
        let mergedMetrics = this.state.metrics.filter(m => m.id !== metricId);
        this.setState({
            metrics: mergedMetrics,
        });
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={this.routes.login}/>;
        }

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
                        <NavLink to={this.routes.tabGeneral} className="nav-link"
                                 activeClassName="active">General</NavLink>
                    </li>
                    <li className="nav-item">
                        {/* disable link for default project */}
                        {Number.isInteger(this.proj.id) ? (
                            <NavLink to={this.routes.tabMembers} className="nav-link"
                                 activeClassName="active">Project members</NavLink>
                        ): null}
                    </li>
                    <li className="nav-item">
                        <NavLink to={this.routes.tabActivities} className="nav-link"
                                 activeClassName="active">Activities</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to={this.routes.tabMetrics} className="nav-link"
                                 activeClassName="active">Metrics</NavLink>
                    </li>
                    <li className="nav-item">
                        <NavLink to={this.routes.tabPreferences} className="nav-link"
                                 activeClassName="active">Preferences</NavLink>
                    </li>
                </ul>
                <Switch>
                    <Redirect exact from={this.routes.project} to={this.routes.tabGeneral}/>
                </Switch>
                <Switch>
                    <Route path={this.routes.tabPreferences}>
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
                    <Route path={this.routes.tabMembers}>
                        <Members participants={this.proj.participants}/>
                    </Route>
                </Switch>
                <Switch>
                    <Route path={this.routes.tabActivities}>
                        <ActivitiesTab activities={this.state.activities}/>
                    </Route>
                </Switch>
                <Switch>
                    <Route path={this.routes.tabGeneral} name="General">
                        <div className="container tab-margin">
                            {/*<div className="row card-group animated fadeIn">*/}
                                {/*<div className="card">*/}
                                    {/*<div className="card-block">*/}
                                        {/*<div className="h1 text-muted text-right mb-2">*/}
                                            {/*<i className="icon-people"/>*/}
                                        {/*</div>*/}
                                        {/*<div className="h4 mb-0">87.500</div>*/}
                                        {/*<small className="text-muted text-uppercase font-weight-bold">Metric 1</small>*/}
                                        {/*<div className="progress progress-xs mt-1 mb-0">*/}
                                            {/*<div className="progress-bar bg-info" role="progressbar"*/}
                                                 {/*style={pr_bar_style} aria-valuenow="25" aria-valuemin="0"*/}
                                                 {/*aria-valuemax="100"/>*/}
                                        {/*</div>*/}
                                    {/*</div>*/}
                                {/*</div>*/}
                            {/*</div>*/}

                            <div className="text-center">
                                <SyncLoader loading={this.state.loading} color="#36D7B7" size={20} margin="10px"/>
                            </div>

                            <Row>
                                {this.state.metrics.filter(metric => metric.type === 'C')
                                    .map(metric => (
                                        <Col xs={12} sm={3} md={2} className="animated fadeIn" key={metric.id}>
                                            <MetricTile projectId={this.proj.id} metric={metric}/>
                                        </Col>
                                    ))
                                }
                            </Row>
                        </div>
                    </Route>
                </Switch>

                <Switch>
                    <Route path={this.routes.tabMetrics}>
                        <MetricsContainer projId={this.proj.id} loading={this.state.loading}
                                          metrics={this.state.metrics} deleteAction={this.deleteMetric.bind(this)}/>
                    </Route>
                </Switch>

                <NewMetricModal newMetricModal={this.state.newMetricModal} toggle={this.toggle} callbk={this.newMetric}
                                projId={this.proj.id} metrics={this.state.metrics} activities={this.state.activities}/>

                </Container>
            </div>
        )
    }
}

export default Project;
