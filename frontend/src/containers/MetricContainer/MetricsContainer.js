import React, {Component} from 'react';
import MetricsList from "../../views/Metrics/MetricsList";
import MetricContainer from "./MetricContainer";
import {Link, Route, Switch} from "react-router-dom";
import cookie from "react-cookie";
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";


class MetricsContainer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            modalDelete: false,
            metricToDelete: undefined,
        };

        this.deleteMetricConfirm = this.deleteMetricConfirm.bind(this);
        this.modalDeleteToggle = this.modalDeleteToggle.bind(this);
        this.deleteMetric = this.deleteMetric.bind(this);

        this.links = {
            metricDelete: "/projects/metrics/"
        };
        this.routes = {
            metric: "/project/" + props.projId + "/metric/"
        }
    }

    deleteMetric() {
        this.modalDeleteToggle();
        let metricId = this.state.metricToDelete.id;
        let url = this.links.metricDelete + metricId;
        let headers = {
            credentials: "same-origin",
            method: "DELETE",
            headers: {
                Accept: "application/json",
                'Content-Type': "application/json",
                'X-CSRFToken': cookie.load('csrftoken'),
            }
        };
        fetch(url, headers).then(response => {
            if (response && response.status === 200) {
                this.props.deleteAction(metricId);
            } else {
                window.alert("Bad response from server: " + response.status);
                console.log(response);
            }
        });
    }

    deleteMetricConfirm(metricId) {
        this.setState({
            metricToDelete: this.props.metrics.find(m => m.id === metricId),
        });
        this.modalDeleteToggle();
    }

    modalDeleteToggle() {
        this.setState({
            modalDelete: !this.state.modalDelete
        });
    }

    render() {
        let metricContainers = this.props.metrics.map(metric => (
          <Route key={"metric_" + metric.id} path={this.routes.metric + metric.id}>
            <div className="animated fadeIn">
              <MetricContainer metric={metric} metrics={this.props.metrics} projId={this.props.projId}/>
            </div>
          </Route>
        ));

        let modalDelete = null;
        if (this.state.metricToDelete) {
            modalDelete = (
              <Modal isOpen={this.state.modalDelete} toggle={this.modalDeleteToggle}>
                <ModalHeader toggle={this.modalDeleteToggle}>Delete metric</ModalHeader>
                <ModalBody>
                    Do you want delete metric
                    <code><Link to={this.routes.metric + this.state.metricToDelete.id}>
                    {this.state.metricToDelete.name}</Link></code>?
                    This action cannot be undone.
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" onClick={this.deleteMetric}>Delete</Button>{' '}
                  <Button color="secondary" onClick={this.modalDeleteToggle}>Cancel</Button>
                </ModalFooter>
              </Modal>
            )
        }

        return (
          <div className="tab-margin">
            {modalDelete}

            <Switch>
              {metricContainers}
              <Route exact path="">
                <div className="animated fadeIn">
                  <MetricsList name="Metrics" projId={this.props.projId} loading={this.props.loading}
                               metrics={this.props.metrics} deleteAction={this.deleteMetricConfirm}/>
                </div>
              </Route>
            </Switch>
          </div>
        );
    }
}

export default MetricsContainer;
