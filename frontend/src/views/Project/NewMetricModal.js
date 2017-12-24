import React, {Component} from 'react';
import {Button, Col, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import cookie from 'react-cookie';

class NewMetricModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "default",
            type: "C",
            filters: [],
            activities: [],
            fields: [],
            groupbyOptions: [],
        };

        this.addFilter = this.addFilter.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
        this.cancel = this.cancel.bind(this);
        this.changeActivity = this.changeActivity.bind(this);
        this.changeGrouping = this.changeGrouping.bind(this);
    }

    componentDidMount() {
        // retrieve activities and activities fields for autocomplete
        let url = '/projects/metrics/activities/';
        if (Number.isInteger(this.props.projId)) {
            url += '?project=' + this.props.projId;
        }
        fetch(url, {credentials: "same-origin"})
            .then(results => results.json())
            .then(data => {
                this.setState({activities: data.activities})
            });
    }

    addFilter() {
        let filters = this.state.filters;
        let newId = filters.length;
        filters.push((
            <FormGroup row key={"f_" + newId}>
                <Label for={"filter" + newId} sm={3}>Filter {newId + 1}</Label>
                <Col sm={4}>
                    <Input type="select" name="filterType" id={"filter" + newId + "type"} onChange={this.changeFilter}>
                        <option value="group">Group</option>
                        <option value="field_from">Value >= than</option>
                        <option value="field_to">Value {"<="} than</option>
                    </Input>
                </Col>
                <Col sm={5}>
                    <Input type="text" name="filter" id={"filter" + newId} onChange={this.changeField}/>
                </Col>
            </FormGroup>
        ));
        this.setState({filters: filters});
    }

    changeActivity(activity) {
        let activityName = activity.target.value;
        let fields = [];
        if (activityName) {
            fields = this.state.activities.find(a => a.name === activityName).fields;
        }
        this.setState({fields: fields});
    }

    changeGrouping(grouby) {
        let groubyType = grouby.target.value;
        let newState = {
            groupbyOptions: []
        };
        if (groubyType) {
            newState.groupbyOptions = [
                {
                    name: "Sum",
                    value: "sum"
                },
                {
                    name: "Count",
                    value: "count"
                },
            ];
        }
        this.setState(newState);

    }

    getSubmitObj(type, e) {
        if (type === "R") {
            return this.rawMetricSubmitObj(e);
        }
        return this.compositeMetricSubmitObj(e);
    }

    rawMetricSubmitObj(e) {
        // raw metric structure
        let submitObj = {
            name: undefined, // string
            type: undefined, // 'R' for raw
            info: {
                field: undefined, // string
                filters: undefined, // dict of filters: 'group', 'field_from', 'field_to'
                //activity: undefined, // string, optional
            }
        };
        let fType;
        let filters = {};
        // build POST body object
        for (let i = 0; i < e.target.length; i++) {
            if (e.target[i].name && e.target[i].value) {
                if (e.target[i].name === "filterType") {
                    fType = e.target[i].value;
                } else if (e.target[i].name === "filter") {
                    filters[fType] = e.target[i].value;
                } else if (e.target[i].name === "field" || e.target[i].name === "activity") {
                    submitObj.info[e.target[i].name] = e.target[i].value;
                } else {
                    submitObj[e.target[i].name] = e.target[i].value;
                }
            }
        }
        submitObj.info.filters = filters;
        return submitObj;
    }

    compositeMetricSubmitObj(e) {
        // composite metric structure
        let submitObj = {
            name: undefined, // string
            type: undefined, // 'C' for raw
            info: {
                components: [], // list of metrics ids
                aggregate: undefined, // operation for aggregation: 'minus', 'timeinter'
                groupby: [], // string, optional
            }
        };
        // build POST body object
        for (let i = 0; i < e.target.length; i++) {
            if (e.target[i].name && e.target[i].value) {
                if (e.target[i].name === "metric") {
                    submitObj.info.components.push(Number.parseInt(e.target[i].value));
                } else if (e.target[i].name === "aggregate") {
                    submitObj.info[e.target[i].name] = e.target[i].value;
                } else if (e.target[i].name === "groupby") {
                    submitObj.info.groupby.push(e.target[i].value);
                } else {
                    submitObj[e.target[i].name] = e.target[i].value;
                }
            }
        }
        let type1 = this.props.metrics.find(m => m.id === submitObj.info.components[0]).type;
        let type2 = this.props.metrics.find(m => m.id === submitObj.info.components[1]).type;
        if (type1 !== type2) {
            // TODO inform user - verification failed
            return null;
        }
        return submitObj;
    }

    formSubmit(e) {
        e.preventDefault();
        let submitObj = this.getSubmitObj(this.state.type, e);
        console.log(submitObj);

        // create metric request
        let url = '/projects/metrics/';
        if (Number.isInteger(this.props.projId)) {
            url += '?project=' + this.props.projId;
        }
        fetch(url, {
            credentials: "same-origin",
            method: "PUT",
            headers: {
                Accept: "application/json",
                'Content-Type': "application/json",
                'X-CSRFToken': cookie.load('csrftoken'),
            },
            body: JSON.stringify(submitObj)
        })
            .then(results => results.json())
            .then(data => {
                console.log(data);
                this.props.callbk(data['metrics']);
            });

        this.props.toggle();
    }

    cancel() {
        this.setState({
            filters: [],
            fields: [],
        });
        this.props.toggle();
    }

    render() {
        let formInputs;
        if (this.state.type === "R") {
            formInputs = [
                (<FormGroup row key="activity">
                    <Label for="activity" sm={3}>Activity</Label>
                    <Col sm={9}>
                        <Input type="select" name="activity" id="activity"
                               onChange={this.changeActivity} defaultValue="">
                            <option value="">-- Select an activity (optional) --</option>
                            {this.state.activities.map((a, i) => (
                                <option key={i} value={a.name}>{a.name}</option>))}
                        </Input>
                    </Col>
                </FormGroup>),

                (<FormGroup row key="field">
                    <Label for="field" sm={3}>Activity field</Label>
                    <Col sm={9}>
                        {this.state.fields.length ?
                            (<Input type="select" name="field" id="metricField" defaultValue="" required>
                                <option value="" disabled>Please select an item</option>
                                {this.state.fields.map((a, i) => (<option key={i} value={a}>{a}</option>))}
                            </Input>) :
                            // TODO add autocomplete
                            (<Input type="text" name="field" id="metricField" onChange={this.changeField}
                                    required/>)
                        }
                    </Col>
                </FormGroup>),

                (<FormGroup key="filters">
                    <h5>Filters</h5>
                    {this.state.filters}
                </FormGroup>),

                (<Button key="addFilter" color="link" onClick={this.addFilter}>
                    <i className="icon-plus"/> Add filter
                </Button>),
            ];
        } else {
            formInputs = [
                (<FormGroup row key="metric1">
                    <Label for="metric1" sm={3}>Metric 1</Label>
                    <Col sm={9}>
                        <Input type="select" name="metric" id="metric1"
                               required defaultValue="">
                            <option value="">-- Select a metric --</option>
                            {this.props.metrics.map((m, i) => (
                                <option key={i} value={m.id}>
                                    {m.name + " (Type: " + (m.type === "R" ? "Raw" : "Composite") + ")"}
                                </option>
                            ))}
                        </Input>
                    </Col>
                </FormGroup>),
                (<FormGroup row key="metric2">
                    <Label for="metric2" sm={3}>Metric 2</Label>
                    <Col sm={9}>
                        <Input type="select" name="metric" id="metric2"
                               required defaultValue="">
                            <option value="">-- Select a metric --</option>
                            {this.props.metrics.map((m, i) => (
                                <option key={i} value={m.id}>
                                    {m.name + " (Type: " + (m.type === "R" ? "Raw" : "Composite") + ")"}
                                </option>
                            ))}
                        </Input>
                    </Col>
                </FormGroup>),
                (<FormGroup row key="aggregate">
                    <Label for="aggregate" sm={3}>Operation</Label>
                    <Col sm={9}>
                        <Input type="select" name="aggregate" id="aggregate"
                               required defaultValue="">
                            <option value="">-- Select an operation --</option>
                            <option value="minus">"-" - Subtraction</option>
                            <option value="timeinter">Time interval between UTC time values</option>
                        </Input>
                    </Col>
                </FormGroup>),
                (<FormGroup row key="groupby">
                    <Label for="groupby" sm={3}>Group by</Label>
                    <Col sm={5}>
                        <Input type="select" name="groupby" id="groupbyType" onChange={this.changeGrouping}
                               defaultValue="" required>
                            <option value="">-- No grouping --</option>
                            <option value="day">Day</option>
                            <option value="3_days">3 days</option>
                            <option value="7_days">7 days</option>
                            <option value="30_days">30 days</option>
                        </Input>
                    </Col>
                    {this.state.groupbyOptions.length ?
                        (<Col sm={4}>
                            <Input type="select" name="groupby" id="groupbyValue">
                                {this.state.groupbyOptions.map((o, i) => (
                                    <option value={o.value} key={i}>{o.name}</option>
                                ))}
                            </Input>
                        </Col>) : null
                    }

                </FormGroup>),
            ];
        }

        return (
            <div>
                <Modal isOpen={this.props.newMetricModal} toggle={this.cancel} backdrop="static">
                    <Form onSubmit={this.formSubmit}>
                        <ModalHeader toggle={this.cancel}>New Metric</ModalHeader>
                        <ModalBody>
                            <FormGroup row>
                                <Label for="metricName" sm={3}>Name</Label>
                                <Col sm={9}>
                                    <Input type="text" name="name" id="metricName" onChange={this.changeName} required
                                           placeholder="Please enter a metric name"/>
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label for="metricType" sm={3}>Metric type</Label>
                                <Col sm={9}>
                                    <Input type="select" name="type" id="metricType"
                                           onChange={e => this.setState({type: e.target.value})}
                                           defaultValue={this.state.type}>
                                        <option value="R">Raw</option>
                                        <option value="C">Composite</option>
                                    </Input>
                                </Col>
                            </FormGroup>
                            <h4>Settings</h4>
                            {formInputs}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" type="submit">Create</Button>{' '}
                            <Button color="secondary" onClick={this.cancel}>Cancel</Button>
                        </ModalFooter>
                    </Form>
                </Modal>
            </div>
        )
    }
}

export default NewMetricModal;