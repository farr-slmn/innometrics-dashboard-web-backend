import React, {Component} from 'react';
import {Link} from "react-router-dom";
import {Card} from "reactstrap";

class MetricTile extends Component {

    constructor(props) {
        super(props);
        this.id = props.metric.id;
        this.projectId = props.projectId;
        this.name = props.metric.name;
        this.trend = "neutral";
        this.state = {
            focused: false,
        };

        this.getMetricValue = this.getMetricValue.bind(this);
        this.mouseOut = this.mouseOut.bind(this);
        this.mouseOver = this.mouseOver.bind(this);
        this.truncate = this.truncate.bind(this);
    }

    mouseOut() {
        this.setState({focused: false});
    }

    mouseOver() {
        this.setState({focused: true});
    }

    getMetricValue() {
        this.trend = "neutral";
        if (this.props.metric.type === "R") {
            return null;
        }

        let val = this.props.metric.value;
        if (Number.isFinite(val)) {
            let lo = this.props.metric.info.bounds.lower;
            let up = this.props.metric.info.bounds.upper;

            if (Number.isFinite(lo) || Number.isFinite(up)) {
                if (Number.isFinite(lo) && Number.isFinite(up)) {
                    this.trend = (val >= lo && val <= up) ? "good" : "bad";
                } else if (Number.isFinite(lo) && !Number.isFinite(up)) {
                    this.trend = (val >= lo) ? "good" : "bad";
                } else {
                    this.trend = (val <= up) ? "good" : "bad";
                }
            }
            return String(val);
        }
        return "-";
    }

    truncate(string, symbols) {
        if (!this.state.focused && string.length > symbols) {
            return string.substring(0, symbols) + '...';
        }
        return string;
    };

    render() {
        let metricValue = this.getMetricValue();
        let trendClass = this.trend === "good" ? "bg-success" : this.trend === "bad" ? "bg-danger" : "bg-info";

        return (
            <Card className={"metric-tile " + trendClass}
                  onMouseOut={() => this.mouseOut()}
                  onMouseOver={() => this.mouseOver()}>
                <Link to={"/project/" + this.projectId + "/metric/" + this.id}
                      style={{color: 'white', textDecoration: 'none'}}>
                    <div className="card-body">
                        {this.truncate(this.name, 14)}
                        <h3>{this.truncate(metricValue, 6)}</h3>
                    </div>
                </Link>
            </Card>
        )
    }
}

export default MetricTile;
