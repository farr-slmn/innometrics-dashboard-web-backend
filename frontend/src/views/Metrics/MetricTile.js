import React, {Component} from 'react';
import {Link} from "react-router-dom";
import {Card} from "reactstrap";

class MetricTile extends Component {

    constructor(props) {
        super(props);
        this.id = props.metric.id;
        this.projectId = props.projectId;
        this.name = props.metric.name;
        this.trend = props.trend;

        this.getMetricValue = this.getMetricValue.bind(this);
    }

    getMetricValue() {
        if (!Number.isFinite(this.props.metric.value) && (this.props.metric.type === "C")) {
            return "-";
        } else {
            return this.props.metric.value;
        }
    }

    render() {
        return (
            <Card className={this.trend === "good" ? "bg-success" : this.trend === "bad" ? "bg-danger" : "bg-info"}>
                <Link to={"/project/" + this.projectId + "/metric/" + this.id}
                      style={{color: 'white', textDecoration: 'none'}}>
                    <div className="card-body">
                        {this.name}
                        <h3>{this.getMetricValue()}</h3>
                    </div>
                </Link>
            </Card>
        )
    }
}

export default MetricTile;
