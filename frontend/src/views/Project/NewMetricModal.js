import React, {Component} from 'react';
import {Button, Col, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";
import DjangoCSRFToken from 'django-react-csrftoken'

class NewMetricModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "default",
            type: "R",
            filters: [],
        };

        this.addFilter = this.addFilter.bind(this);
        this.formSubmit = this.formSubmit.bind(this);
        this.cancel = this.cancel.bind(this);
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
        this.setState({
            filters: filters
        });
    }

    formSubmit(e) {
        e.preventDefault();
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
        let csrf = "";
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
                } else if (e.target[i].name === "csrfmiddlewaretoken") {
                    csrf = e.target[i].value;
                } else {
                    submitObj[e.target[i].name] = e.target[i].value;
                }
            }
        }
        submitObj.info.filters = filters;
        console.log(submitObj);

        // create metric request
        let url = '/projects/metrics/?project=' + this.props.projId;
        fetch(url, {
            credentials: "same-origin",
            method: "PUT",
            headers: {
                Accept: "application/json",
                'Content-Type': "application/json",
                'X-CSRFToken': csrf,
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
        });
        this.props.toggle();
    }

    render() {
        return (
            <div>
                <Modal isOpen={this.props.newMetricModal} toggle={this.cancel} backdrop="static">
                    <Form onSubmit={this.formSubmit}>
                        <ModalHeader toggle={this.cancel}>New Metric</ModalHeader>
                        <ModalBody>
                            <DjangoCSRFToken/>
                            <FormGroup row>
                                <Label for="metricName" sm={3}>Name</Label>
                                <Col sm={9}>
                                    <Input type="text" name="name" id="metricName" onChange={this.changeName} required/>
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label for="metricType" sm={3}>Metric type</Label>
                                <Col sm={9}>
                                    <Input type="select" name="type" id="metricType" onChange={this.changeType}>
                                        <option value="R">Raw</option>
                                        <option value="C">Composite</option>
                                    </Input>
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label for="activity" sm={3}>Activity</Label>
                                <Col sm={9}>
                                    <Input type="select" name="activity" id="activity"
                                           onChange={this.changeActivity}/>
                                </Col>
                            </FormGroup>
                            <FormGroup row>
                                <Label for="field" sm={3}>Activity field</Label>
                                <Col sm={9}>
                                    <Input type="search" name="field" id="metricField"
                                           onChange={this.changeField}/>
                                </Col>
                            </FormGroup>
                            <FormGroup>
                                <h5>Filters</h5>
                                {this.state.filters}
                            </FormGroup>
                            <Button color="link" onClick={this.addFilter}><i className="icon-plus"/> Add filter</Button>
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