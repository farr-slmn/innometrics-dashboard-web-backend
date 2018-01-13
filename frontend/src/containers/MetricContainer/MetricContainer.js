import React, {Component} from 'react';
import MetricTable from "../../views/Metrics/MetricTable";
import MetricChart from "../../views/Metrics/MetricChart";
import MetricTile from "../../views/Metrics/MetricTile";
import {SyncLoader} from "react-spinners";


class MetricContainer extends Component {
    constructor(props) {
        super(props);
        this.projId = props.projId;
        this.state = props.metric;
        this.state['loading'] = true;
    }

    componentDidMount() {
        if (!this.state.x_values && !this.state.measurements) {
            let url = '/projects/metrics/' + this.state.id + '/data/';
            if (Number.isInteger(this.projId)) {
                url += '?project=' + this.projId;
            }
            this.setState({loading: true});
            fetch(url, {credentials: "same-origin"})
                .then(results => results.json())
                .then(data => {
                    this.setState({
                        measurements: data.measurements,
                        x_values: data.x_values,
                        y_values: data.y_values,
                        loading: false,
                    });
                    this.props.metric.measurements = data.measurements;
                    this.props.metric.x_values = data.x_values;
                    this.props.metric.y_values = data.y_values;
                });
        } else {
            this.setState({loading: false});
        }
    }

    render() {
        if (this.state.type === 'C') {
            return (
                <div>
                    <div className="row">
                        <div className="col-12 col-sm-3 col-md-2" key={"first_" + this.state.components[0].id}>
                            <MetricTile trend="neutral"
                                        projectId={this.projId}
                                        id={this.state.components[0].id}
                                        name={this.state.components[0].name}
                                        value={this.state.components[0].value}/>
                        </div>
                        <div className="col-12 col-sm-3 col-md-2" key={"second_" + this.state.components[1].id}>
                            <MetricTile trend="neutral"
                                        projectId={this.projId}
                                        id={this.state.components[1].id}
                                        name={this.state.components[1].name}
                                        value={this.state.components[1].value}/>
                        </div>
                    </div>
                    {this.state.loading ?
                        (<div className="text-center">
                            <SyncLoader loading={this.props.loading} color="#36D7B7" size={20} margin="10px"/>
                        </div>) :
                        (<MetricChart name={this.state.name}
                                      xValues={this.state.x_values}
                                      yValues={this.state.y_values}/>)
                    }
                </div>
            );
        } else {
            return (
                <MetricTable name={this.state.name}
                             measurements={this.state.measurements}
                             loading={this.state.loading}/>
            );
        }
    }
}

export default MetricContainer;
