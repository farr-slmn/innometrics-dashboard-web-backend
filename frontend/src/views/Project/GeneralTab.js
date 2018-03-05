import React, {Component} from 'react';
import {Col, Collapse, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText, Row} from "reactstrap";
import {SyncLoader} from "react-spinners";
import MetricTile from "../Metrics/MetricTile";

class GeneralTab extends Component {

    constructor(props) {
        super(props);
        this.state = {
            goalsToggle: new Array(props.metrics.length).fill(true),
        };

        this.getGoals = this.getGoals.bind(this);
        this.getQuestions = this.getQuestions.bind(this);
    }

    toggle(idx) {
        this.state.goalsToggle[idx] = !this.state.goalsToggle[idx];
        this.setState({
            goalsToggle: this.state.goalsToggle,
        });
    }

    getGoals() {
        let goals = this.props.metrics.filter(m => (m.info.gqm)).map(m => m.info.gqm.gqm_goal);
        goals = Array.from(new Set(goals).values());
        goals.sort();
        return goals;
    }

    getQuestions(goal) {
        let questions = this.props.metrics
            .filter(m => (m.info.gqm && (m.info.gqm.gqm_goal === goal)))
            .map(m => m.info.gqm.gqm_question);
        questions = Array.from(new Set(questions).values());
        questions.sort();
        return questions
    }

    render() {
        let compositeMetrics = this.props.metrics.filter(metric => metric.type === 'C');
        let goals = this.getGoals();
        if (this.state.goalsToggle < goals.length) {
            this.state.goalsToggle = new Array(goals.length).fill(true);
        }

        return (
            <div className="container tab-margin">

                <div className="text-center">
                    <SyncLoader loading={this.props.loading} color="#36D7B7" size={20} margin="10px"/>
                </div>

                <Row>
                    {compositeMetrics.filter(m => !m.info.gqm || (Object.keys(m.info.gqm).length === 0))
                        .map(m => (
                            <Col xs={12} sm={3} md={2} className="animated fadeIn" key={m.id}>
                                <MetricTile projectId={this.props.proj.id} metric={m}/>
                            </Col>
                        ))
                    }
                </Row>

                <ListGroup>
                {goals.map((g, i) => (
                    <ListGroupItem key={i} onClick={this.toggle.bind(this, i)}>
                        <ListGroupItemHeading>Goal: <span className="font-weight-bold">{g}</span></ListGroupItemHeading>

                        <Collapse isOpen={this.state.goalsToggle[i]}>
                        <ListGroup>
                        {this.getQuestions(g).map((q, j) => (
                            <ListGroupItem key={j}>
                                <ListGroupItemHeading>Question: {q}</ListGroupItemHeading>
                                <Row key={i}>
                                    {compositeMetrics
                                        .filter(m => m.info.gqm
                                            && (m.info.gqm.gqm_goal === g)
                                            && (m.info.gqm.gqm_question === q))
                                        .map(m => (
                                            <Col xs={12} sm={3} md={2} className="animated fadeIn" key={m.id}>
                                                <MetricTile projectId={this.props.proj.id} metric={m}/>
                                            </Col>
                                        ))
                                    }
                                </Row>
                            </ListGroupItem>
                        ))}
                        </ListGroup>
                        </Collapse>

                    </ListGroupItem>
                ))}
                </ListGroup>
            </div>
        )
    }
}

export default GeneralTab;
