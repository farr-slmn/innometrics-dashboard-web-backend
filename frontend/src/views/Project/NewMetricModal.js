import React, {Component} from 'react';
import {
    Button,
    Col,
    Collapse,
    Form,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Row
} from "reactstrap";
import cookie from 'react-cookie';

class NewMetricModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "default",
            type: "R",
            filters: [],
            activities: [],
            properties: [],
            showGroupby: false,
            grouping: false,
            groupbyTimeFields: [[], []],
            groupbyFunctions: [
                {
                    name: "Sum",
                    value: "sum"
                },
                {
                    name: "Count",
                    value: "count"
                },
            ],
            toggle: {},
        };
        this.filterCounter = 0;

        this.addFilter = this.addFilter.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
        this.cancel = this.cancel.bind(this);
        this.changeActivity = this.changeActivity.bind(this);
        this.changeGrouping = this.changeGrouping.bind(this);
        this.findType = this.findType.bind(this);

        let project = Number.isInteger(props.projId) ? '?project=' + props.projId : '';
        this.links = {
            activities: '/projects/metrics/activities/' + project,
            metrics: '/projects/metrics/' + project,
        };
    }

    componentDidMount() {
        // retrieve activities and activities properties for autocomplete
        let url = this.links.activities;
        fetch(url, {credentials: "same-origin"})
            .then(results => results.json())
            .then(data => {
                this.setState({activities: data.activities});
            });
    }

    addFilter() {
        let filters = this.state.filters;
        let newId = "f_" + (this.filterCounter++);
        filters.push((
            <FormGroup row key={newId} id={newId} className="animated fadeIn">
                <Col sm={3}>
                    <Label for={"filter_" + newId}>Filter {this.filterCounter} </Label>
                    <Button color="link" onClick={this.removeFilter.bind(this, newId)}>
                        <i className="icon-close"/>
                    </Button>
                </Col>
                <Col sm={3}>
                    <Input type="select" name="filterType" id={"filter_" + newId + "type"} onChange={this.changeFilter}>
                        <option value="field_from">Value >= than</option>
                        <option value="field_to">Value {"<="} than</option>
                        <option value="group" disabled>Group</option>
                    </Input>
                </Col>
                <Col sm={5}>
                    <Input type="text" name="filter" id={"filter_" + newId} onChange={this.changeField}/>
                </Col>
                <Col sm={1}/>
            </FormGroup>
        ));
        this.setState({filters: filters});
    }

    removeFilter(id) {
        let filters = this.state.filters.filter(e => e.props.id !== id);
        this.setState({filters: filters});
    }

    changeActivity(activity) {
        let activityName = activity.target.value;
        let properties = [];
        if (activityName) {
            properties = this.state.activities.find(a => a.name === activityName).properties;
        }
        this.setState({properties: properties});
    }

    changeMetric(idx, metric) {
        let newState = {
            groupbyTimeFields: this.state.groupbyTimeFields,
        };
        newState.groupbyTimeFields[idx] = [];
        let metricId = metric.target.value;
        if (metricId || (metricId == 0)) {
            let m = this.props.metrics.find(m => m.id == metricId);
            if (m && (m.type === "R")) {
                newState.groupbyTimeFields[idx] = [].concat(m.fields);
            }
        }
        newState.showGroupby = Boolean(newState.groupbyTimeFields[0].length) && Boolean(newState.groupbyTimeFields[1].length);
        this.setState(newState);
    }

    changeGrouping(grouby) {
        this.setState({
            grouping: Boolean(grouby.target.value)
        });
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
                groupby: {}, // dict of groping properties: 'group_type', 'group_func', 'group_timefield' (can be empty)
            }
        };
        // build POST body object
        for (let i = 0; i < e.target.length; i++) {
            if (e.target[i].name && e.target[i].value) {
                if (e.target[i].name === "metric") {
                    submitObj.info.components.push(Number.parseInt(e.target[i].value));
                } else if (e.target[i].name === "aggregate") {
                    submitObj.info[e.target[i].name] = e.target[i].value;
                } else if (e.target[i].name.startsWith("group_")) {
                    submitObj.info.groupby[e.target[i].name] = e.target[i].value;
                } else {
                    submitObj[e.target[i].name] = e.target[i].value;
                }
            }
        }
        return submitObj;
    }

    formSubmit(e) {
        e.preventDefault();
        let submitObj = this.getSubmitObj(this.state.type, e);

        // create metric request
        let url = this.links.metrics;
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
            .then(data => this.props.callbk(data));

        this.cancel();
    }

    cancel() {
        this.setState({
            filters: [],
            properties: [],
            showGroupby: false,
            groupbyTimeFields: [[], []],
            toggle: {},
        });
        this.props.toggle();
        this.filterCounter = 0;
    }

    findType(metric) {
        if (metric.type === "R") {
            let act = this.state.activities.find(a => a.name === metric.info['activity']);
            if (act) {
                let property = act.properties.find(p => p.name === metric.info['field']);
                return property ? property.type : "";
            }
        }
        return "";
    }

    createDescriptionRow(contentComponent, toggleField, key) {
        return (
            <Row key={key}>
                <Col sm={3}/>
                <Col sm={8}>
                    <Collapse isOpen={this.state.toggle[toggleField]}>
                        {contentComponent}
                    </Collapse>
                </Col>
            </Row>
        );
    }

    createDescriptionButton(toggleField, id) {
        return (
            <Button id={id}
                    color="info"
                    onClick={() => {
                        let newToggle = this.state.toggle;
                        newToggle[toggleField] = !newToggle[toggleField];
                        this.setState({toggle: newToggle});
                    }}
                    active={this.state.toggle[toggleField]}>
                <i className="icon-info"/>
            </Button>
        );
    }

    render() {
        let formInputs;
        if (this.state.type === "R") {
            formInputs = [
                (<FormGroup row key="activity" className="animated fadeIn">
                    <Label for="activity" sm={3}>Activity</Label>
                    <Col sm={8}>
                        <Input type="select" name="activity" id="activity"
                               onChange={this.changeActivity} defaultValue="">
                            <option value="">-- Select an activity (optional) --</option>
                            {this.state.activities.map((a, i) => (
                                <option key={i} value={a.name}>{a.name}</option>))}
                        </Input>
                    </Col>
                    {this.createDescriptionButton("activity", "activityDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        Selecting an <code>Activity</code> you can filter collected measurements
                        according to specified activity name. All activities will be chosen by default.
                    </div>), "activity", "activityDescription"),

                (<FormGroup row key="field" className="animated fadeIn">
                    <Label for="field" sm={3}>Activity property</Label>
                    <Col sm={8}>
                        {this.state.properties.length ?
                            (<Input type="select" name="field" id="metricField" defaultValue="" required>
                                <option value="" disabled>Please select an item</option>
                                {this.state.properties.map((p, i) => (
                                    <option key={i} value={p.name}>{"[type: " + p.type + "] " + p.name}</option>
                                ))}
                            </Input>) :
                            // TODO add autocomplete
                            (<Input type="text" name="field" id="metricField" onChange={this.changeField}
                                    required/>)
                        }
                    </Col>
                    {this.createDescriptionButton("metricField", "metricFieldDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        Selecting or entering an <code>Activity property</code> you can filter collected measurements
                        according to specified activity property name.
                    </div>), "metricField", "metricFieldDescription"),

                (<FormGroup key="filters" className="animated fadeIn">
                    <Row>
                        <Col sm={3} tag="h5">Filters</Col>
                        <Col sm={8}/>
                        {this.createDescriptionButton("filters", "filtersDescriptionButton")}
                    </Row>
                    {this.createDescriptionRow((
                        <div style={{"marginBottom": "1em"}}>
                            Additional filters for measurements (e.g. top or bottom limits of a property value)
                        </div>), "filters", "filtersDescription")}
                    {this.state.filters}
                </FormGroup>),

                (<Button key="addFilter" color="link" onClick={this.addFilter} className="animated fadeIn">
                    <i className="icon-plus"/> Add filter
                </Button>),
            ];
        } else {
            formInputs = [
                (<FormGroup row key="metric1" className="animated fadeIn">
                    <Label for="metric1" sm={3}>Metric 1</Label>
                    <Col sm={5}>
                        <Input type="select" name="metric" id="metric1"
                               required defaultValue="" onChange={this.changeMetric.bind(this, 0)}>
                            <option value="">-- Select a metric --</option>
                            {this.props.metrics.map((m, i) => (
                                <option key={i} value={m.id}>
                                    {"[" + (m.type === "R" ? "Raw: " + this.findType(m) : "Composite") + "]: " + m.name}
                                </option>
                            ))}
                        </Input>
                    </Col>
                    <Col sm={3}/>
                    {/*{this.createDescriptionButton("metric", "metricDescriptionButton")}*/}
                </FormGroup>),

                (<FormGroup row key="metric2" className="animated fadeIn">
                    <Label for="metric2" sm={3}>Metric 2</Label>
                    <Col sm={5}>
                        <Input type="select" name="metric" id="metric2"
                               required defaultValue="" onChange={this.changeMetric.bind(this, 1)}>
                            <option value="">-- Select a metric --</option>
                            {this.props.metrics.map((m, i) => (
                                <option key={i} value={m.id}>
                                    {"[" + (m.type === "R" ? "Raw: " + this.findType(m) : "Composite") + "]: " + m.name}
                                </option>
                            ))}
                        </Input>
                    </Col>
                    <Col sm={3}/>
                    {this.createDescriptionButton("metric", "metricDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        You should select two metrics of <code>Raw</code> or <code>Composite</code> type. Extra
                        grouping operations will be available after selecting both metrics of type <code>Raw</code>.
                    </div>), "metric", "metricDescription"),

                (<FormGroup row key="aggregate" className="animated fadeIn">
                    <Label for="aggregate" sm={3}>Operation</Label>
                    <Col sm={8}>
                        <Input type="select" name="aggregate" id="aggregate"
                               required defaultValue="">
                            <option value="">-- Select an operation --</option>
                            <option value="minus">"-" - Subtraction</option>
                            <option value="timeinter">Time interval between UTC time values</option>
                        </Input>
                    </Col>
                    {this.createDescriptionButton("operation", "operationDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        Main aggregation operation to combine selected metrics. Extra
                        grouping operations will be available after selecting both metrics of type <code>Raw</code>.
                    </div>), "operation", "operationDescription"),
            ];
            if (this.state.showGroupby) {
                formInputs.push(
                    (<FormGroup row key="groupby" className="animated fadeIn">
                        <Label for="group_type" sm={3}>Group by</Label>
                        <Col sm={2}>
                            <Input type="select" name="group_type" id="groupbyType" onChange={this.changeGrouping}
                                   defaultValue="">
                                <option value="">-- No grouping --</option>
                                <option value="day">Day</option>
                                <option value="3_days">3 days</option>
                                <option value="7_days">7 days</option>
                                <option value="30_days">30 days</option>
                            </Input>
                        </Col>
                        {this.state.grouping ? [
                            (<Col sm={2} key="group_func" className="animated fadeIn">
                                <Input type="select" name="group_func" id="groupbyFunc" required>
                                    {this.state.groupbyFunctions.map((o, i) => (
                                        <option value={o.value} key={i}>{o.name}</option>
                                    ))}
                                </Input>
                            </Col>),
                            (<Col sm={4} key="group_timefield" className="animated fadeIn">
                                <Input type="select" name="group_timefield" id="groupbyTimeField" default="" required>
                                    <option value="">-- Choose time field --</option>
                                    {Array.from(
                                        new Set(this.state.groupbyTimeFields[0].concat(this.state.groupbyTimeFields[1]))
                                    ).map((f, i) => (
                                        <option key={i} value={f.name}>{"[type: " + f.type + "] " + f.name}</option>
                                    ))}
                                </Input>
                            </Col>)] : (<Col sm={6}/>)
                        }
                        {this.createDescriptionButton("grouping", "groupingDescriptionButton")}
                    </FormGroup>),

                    this.createDescriptionRow((
                        <div style={{"marginBottom": "1em"}}>
                            <code>Raw</code> metrics can be grouped by some time period obtained from selected
                            activity property. Selected property field should be one of the next field types:
                            <code>datetime</code>, <code>long</code> (if values represent timestamp)
                        </div>), "grouping", "groupingDescription"),
                );
            }
        }

        return (
            <div>
                <Modal isOpen={this.props.newMetricModal} toggle={this.cancel} backdrop="static" className="modal-lg">
                    <Form onSubmit={this.formSubmit}>
                        <ModalHeader toggle={this.cancel}>New Metric</ModalHeader>
                        <ModalBody>
                            <FormGroup row>
                                <Label for="metricName" sm={3}>Name</Label>
                                <Col sm={8}>
                                    <Input type="text" name="name" id="metricName" onChange={this.changeName} required
                                           placeholder="Please enter a metric name"/>
                                </Col>
                            </FormGroup>

                            <FormGroup row>
                                <Label for="metricType" sm={3}>Metric type</Label>
                                <Col sm={8}>
                                    <Input type="select" name="type" id="metricType"
                                           onChange={e => this.setState({type: e.target.value})}
                                           defaultValue={this.state.type}>
                                        <option value="R">Raw</option>
                                        <option value="C">Composite</option>
                                    </Input>
                                </Col>
                                {this.createDescriptionButton("metricType", "metricTypeDescriptionButton")}
                            </FormGroup>

                            {this.createDescriptionRow((
                                <div>
                                    <code>Raw</code> metric type is filtered measurements of
                                    collected data that can be represented in table view. <br/>
                                    <code>Composite</code> metric type consists of two metrics of Raw or Composite type
                                    aggregated by some operation and can be represented in chart view and as tiles.
                                </div>), "metricType", "metricTypeDescription")}

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