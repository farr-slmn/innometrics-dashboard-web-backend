import React, {Component} from 'react';
import MetricTable from "../../views/Metrics/MetricTable";
import MetricChart from "../../views/Metrics/MetricChart";
import MetricTile from "../../views/Metrics/MetricTile";


class MetricContainer extends Component {
    constructor(props) {
        super(props);
        this.projId = props.projId;
        this.state = props.metric;
    }

    render() {
        if (this.state.type === 'C') {
            return (
                <div>
                    <div className="row">
                        <div className="col-12 col-sm-3 col-md-2" key={this.state.components[0].id}>
                            <MetricTile trend="neutral"
                                        projectId={this.projId}
                                        id={this.state.components[0].id}
                                        name={this.state.components[0].name}
                                        value={this.state.components[0].value}/>
                        </div>
                        <div className="col-12 col-sm-3 col-md-2" key={this.state.components[1].id}>
                            <MetricTile trend="neutral"
                                        projectId={this.projId}
                                        id={this.state.components[1].id}
                                        name={this.state.components[1].name}
                                        value={this.state.components[1].value}/>
                        </div>
                    </div>
                    <MetricChart name={this.state.name} xValues={this.state.x_values} yValues={this.state.y_values}/>
                </div>
            );
        } else {
            return (
                <MetricTable name={this.state.name} measurements={this.state.measurements}/>
            );
        }
    }
}

export default MetricContainer;
