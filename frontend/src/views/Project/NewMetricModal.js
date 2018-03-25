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
import {Redirect} from "react-router-dom";

class NewMetricModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "default",
            type: "R",
            gqmGoal: "",
            gqmQuestion: "",
            gqmQuestions: null,
            filters: [],
            properties: [],
            showGroupby: false,
            grouping: false,
            metricsChosen: [null, null],
            groupingFixed: false,
            fixedDefaults: {group_type: "", group_func: "sum"},
            groupbyTypes: [null, null],
            groupbyTimeFields: [[], []],
            toggle: {},
        };
        this.filterCounter = 0;

        this.addFilter = this.addFilter.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
        this.cancel = this.cancel.bind(this);
        this.changeActivity = this.changeActivity.bind(this);
        this.changeGrouping = this.changeGrouping.bind(this);
        this.changeGoal = this.changeGoal.bind(this);
        this.changeQuestion = this.changeQuestion.bind(this);
        this.findType = this.findType.bind(this);

        let project = Number.isInteger(props.projId) ? '?project=' + props.projId : '';
        this.links = {
            metrics: '/projects/metrics/' + project,
        };
        this.routes = {
            login: "/login",
        };
    }

    getGoals() {
        let goals = this.props.metrics.filter(m => (m.info.gqm)).map(m => m.info.gqm.gqm_goal);
        goals = Array.from(new Set(goals).values());
        goals.sort();
        return goals;
    }

    changeGoal(goal) {
        let goalText = goal.target.value;
        let questions = null;
        if (goalText) {
            let ms = this.props.metrics.filter(m => (m.info.gqm) && (m.info.gqm.gqm_goal === goalText));
            questions = Array.from(new Set(ms.map(m => m.info.gqm.gqm_question)).values());
            questions.sort();
        }
        let question = (questions && questions.length) ? questions[0] : "";
        this.setState({gqmGoal: goalText, gqmQuestions: questions, gqmQuestion: question});
    }

    changeQuestion(question) {
        let questionText = question.target.value;
        this.setState({gqmQuestion: questionText});
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
            properties = this.props.activities.find(a => a.name === activityName).properties;
        }
        this.setState({properties: properties});
    }

    changeMetric(idx, metric) {
        this.setState({showGroupby: false});
        let newState = {
            groupbyTimeFields: this.state.groupbyTimeFields,
            groupbyTypes: this.state.groupbyTypes,
            metricsChosen: this.state.metricsChosen,
            fixedDefaults: {group_type: "", group_func: "sum"},
            grouping: false,
        };
        newState.groupbyTimeFields[idx] = [];
        newState.groupbyTypes[idx] = null;
        newState.metricsChosen[idx] = null;
        let metricId = metric.target.value;
        if (metricId || (metricId === "0")) {
            let m = this.props.metrics.find(m => m.id == metricId);
            newState.metricsChosen[idx] = m.id;
            newState.groupbyTypes[idx] = m.type;
            if (m && (m.type === "R")) {
                newState.groupbyTimeFields[idx] = [].concat(m.fields);
            }
        }

        let selected = Boolean(newState.groupbyTypes[0]) && Boolean(newState.groupbyTypes[1]);
        let allComposite = Boolean(newState.groupbyTypes[0] === "C") && Boolean(newState.groupbyTypes[1] === "C");
        let allRaw = Boolean(newState.groupbyTypes[0] === "R") && Boolean(newState.groupbyTypes[1] === "R");
        newState.showGroupby = selected && !allComposite;
        newState.groupingFixed = newState.showGroupby && !allRaw;

        if (newState.groupingFixed) {
            let m1 = this.props.metrics.find(m => m.id === newState.metricsChosen[0]);
            let m2 = this.props.metrics.find(m => m.id === newState.metricsChosen[1]);
            let mtr = m1;
            if (m2 && (m2.type === "C")) {
                mtr = m2;
            }
            if (mtr) {
                newState.grouping = Boolean(Object.keys(mtr.info.groupby).length);
                if (newState.grouping) {
                    newState.fixedDefaults.group_type = mtr.info.groupby.group_type;
                    newState.fixedDefaults.group_func = mtr.info.groupby.group_func;
                }
            }
        }

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
                gqm: {},
                bounds: {
                    lower: undefined,
                    upper: undefined,
                },
            }
        };
        // build POST body object
        for (let i = 0; i < e.target.length; i++) {
            if (e.target[i].name && e.target[i].value) {
                if (e.target[i].name === "metric") {
                    submitObj.info.components.push(Number.parseInt(e.target[i].value));
                } else if (e.target[i].name === "boundsLower") {
                    submitObj.info.bounds.lower = Number.parseFloat(e.target[i].value);
                } else if (e.target[i].name === "boundsUpper") {
                    submitObj.info.bounds.upper = Number.parseFloat(e.target[i].value);
                } else if (e.target[i].name === "aggregate") {
                    submitObj.info[e.target[i].name] = e.target[i].value;
                } else if (e.target[i].name.startsWith("group_")) {
                    submitObj.info.groupby[e.target[i].name] = e.target[i].value;
                } else if (e.target[i].name.startsWith("gqm_")) {
                    submitObj.info.gqm[e.target[i].name] = e.target[i].value;
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
            .then(response => {
                if (response && response.status === 401) {
                    this.setState({redirect: true});
                } else if (!response || (response.status !== 200 && response.status !== 201)) {
                    window.alert("Bad response from server: " + response.status);
                    console.log(response);
                }
                return response.json();
            })
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
            let act = this.props.activities.find(a => a.name === metric.info['activity']);
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
        if (this.state.redirect) {
            return <Redirect to={this.routes.login}/>;
        }

        let formInputs;
        if (this.state.type === "R") {
            // for Raw metrics
            formInputs = [
                (<h4 key="settings">Settings</h4>),

                (<FormGroup row key="activity" className="animated fadeIn">
                    <Label for="activity" sm={3}>Activity</Label>
                    <Col sm={8}>
                        <Input type="select" name="activity" id="activity"
                               onChange={this.changeActivity} defaultValue="">
                            <option value="">-- Select an activity (optional) --</option>
                            {this.props.activities.map((a, i) => (
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
                    <Label for="field" sm={3}>Activity property <span className="text-danger">*</span></Label>
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
            // for Composite metrics
            formInputs = [
                (<h4 key="gqm_title">GQM Category</h4>),

                (<FormGroup row key="gqm_goal" className="animated fadeIn">
                    <Label for="gqm_goal" sm={3}>Goal</Label>
                    <Col sm={8}>
                        <Input type="select" name="gqm_goal" id="gqm_goal" onChange={this.changeGoal}>
                            <option value="">-- Specify New Goal --</option>
                            {this.getGoals().map((g, i) => (
                                <option key={i} value={g}>{g}</option>
                            ))}
                        </Input>
                    </Col>
                    {this.createDescriptionButton("gqm_goal", "goalDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        You can select Goal and Question categories of GQM model or create new ones.
                    </div>), "gqm_goal", "goalDescription"),
            ];

            if (!this.state.gqmGoal) {
                formInputs.push([
                    (<FormGroup row key="gqm_goal_new" className="animated fadeIn">
                        <Label for="gqm_goal_new" sm={3}>New Goal <span className="text-danger">*</span></Label>
                        <Col sm={8}>
                            <Input type="text" name="gqm_goal" id="gqm_goal_new" required/>
                        </Col>
                    </FormGroup>),

                    (<FormGroup row key="gqm_question_new" className="animated fadeIn">
                        <Label for="gqm_question_new" sm={3}>New Question <span className="text-danger">*</span></Label>
                        <Col sm={8}>
                            <Input type="text" name="gqm_question" id="gqm_question_new" required/>
                        </Col>
                    </FormGroup>),
                ]);
            }

            if (this.state.gqmQuestions !== null) {
                formInputs.push(
                    (<FormGroup row key="gqm_question" className="animated fadeIn">
                        <Label for="gqm_question" sm={3}>Question</Label>
                        <Col sm={8}>
                            <Input type="select" name="gqm_question" id="gqm_question"
                                   required onChange={this.changeQuestion}>
                                <option value="">-- Specify New Question --</option>
                                {this.state.gqmQuestions.map((q, i) => (
                                    <option key={i} value={q}>{q}</option>
                                ))}
                            </Input>
                        </Col>
                    </FormGroup>)
                );

                if (!this.state.gqmQuestion) {
                    formInputs.push(
                        (<FormGroup row key="gqm_question_new" className="animated fadeIn">
                            <Label for="gqm_question_new" sm={3}>
                                New Question <span className="text-danger">*</span>
                            </Label>
                            <Col sm={8}>
                                <Input type="text" name="gqm_question" id="gqm_question_new" required/>
                            </Col>
                        </FormGroup>)
                    );
                }
            }

            formInputs.push([
                (<h4 key="settings">Settings</h4>),

                (<FormGroup row key="metric1" className="animated fadeIn">
                    <Label for="metric1" sm={3}>Metric 1 <span className="text-danger">*</span></Label>
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
                    <Label for="metric2" sm={3}>Metric 2 <span className="text-danger">*</span></Label>
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
                    <Label for="aggregate" sm={3}>Operation <span className="text-danger">*</span></Label>
                    <Col sm={8}>
                        <Input type="select" name="aggregate" id="aggregate"
                               required defaultValue="">
                            <option value="">-- Select an operation --</option>
                            <option value="sum">[+] Sum</option>
                            <option value="minus">[-] Subtract</option>
                            <option value="mult">[*] Multiply</option>
                            <option value="div">[/] Divide</option>
                            <option value="avg">[avg] Average</option>
                            <option value="min">[min] Minimum</option>
                            <option value="max">[max] Maximum</option>
                            <option value="timeinter" disabled={!this.state.showGroupby}>
                                Time interval between UTC time values
                            </option>
                        </Input>
                    </Col>
                    {this.createDescriptionButton("operation", "operationDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        Main aggregation operation to combine selected metrics. Extra
                        grouping operations will be available after selecting both metrics of type <code>Raw</code>.
                    </div>), "operation", "operationDescription"),
            ]);

            if (this.state.showGroupby) {
                let fixedGroupingType = {};
                let fixedGroupingFunc = {};
                if (this.state.groupingFixed) {
                    fixedGroupingType['value'] = this.state.fixedDefaults.group_type;
                    fixedGroupingFunc['value'] = this.state.fixedDefaults.group_func;
                    fixedGroupingType['disabled'] = true;
                    fixedGroupingFunc['disabled'] = true;
                }

                formInputs.push(
                    (<FormGroup row key="groupby" className="animated fadeIn">
                        <Label for="group_type" sm={3}>Group by</Label>
                        <Col sm={2}>
                            <Input type="select" name="group_type" id="groupbyType" onChange={this.changeGrouping}
                                   {...fixedGroupingType}>
                                <option value="">-- No grouping --</option>
                                <option value="day">Day</option>
                                <option value="3_days">3 days</option>
                                <option value="7_days">7 days</option>
                                <option value="30_days">30 days</option>
                            </Input>
                        </Col>
                        {this.state.grouping ? [
                            (<Col sm={2} key="group_func" className="animated fadeIn">
                                <Input type="select" name="group_func" id="groupbyFunc" required
                                       {...fixedGroupingFunc}>
                                    <option value="sum">Sum</option>
                                    <option value="count">Count</option>
                                    <option value="min">Min</option>
                                    <option value="max">Max</option>
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
            formInputs.push([
                (<h4>Notification</h4>),

                (<FormGroup row>
                    <Label for="metricBoundLower" sm={3}>Metric value bounds</Label>
                    <Label for="metricBoundLower" sm={2}>Lower bound: </Label>
                    <Col sm={2}>
                        <Input type="text" name="boundsLower" id="metricBoundLower"/>
                    </Col>
                    <Label for="metricBoundUpper" sm={2}>Upper bound: </Label>
                    <Col sm={2}>
                        <Input type="text" name="boundsUpper" id="metricBoundUpper"/>
                    </Col>
                    {this.createDescriptionButton("metricBounds", "metricBoundsDescriptionButton")}
                </FormGroup>),

                this.createDescriptionRow((
                    <div style={{"marginBottom": "1em"}}>
                        This option allows to define interval where the metric value
                        will be interpreted as <code>good</code> (green tile) if it
                        inside the interval, and <code>bad</code> (red tile) otherwise.
                        Metric values will be denoted as <code>neutral</code> by default.
                    </div>), "metricBounds", "metricBoundsDescription"),
            ]);
        }

        return (
            <div>
                <Modal isOpen={this.props.newMetricModal} toggle={this.cancel} backdrop="static" className="modal-lg">
                    <Form onSubmit={this.formSubmit}>
                        <ModalHeader toggle={this.cancel}>New Metric</ModalHeader>
                        <ModalBody>
                            <FormGroup row>
                                <Label for="metricName" sm={3}>Name <span className="text-danger">*</span></Label>
                                <Col sm={8}>
                                    <Input type="text" name="name" id="metricName" onChange={this.changeName} required
                                           placeholder="Please enter a metric name"/>
                                </Col>
                            </FormGroup>

                            <FormGroup row>
                                <Label for="metricType" sm={3}>Metric type <span
                                    className="text-danger">*</span></Label>
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