import React, {Component} from 'react';
import {Link} from "react-router-dom";


class MetricsList extends Component {
    render() {

        return (
            <div className="card">
                <div className="card-header">
                    {this.props.name}
                </div>
                <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                        <TableHeaders metric={this.props.metrics[0]}/>
                        </thead>
                        <tbody>
                        {this.props.metrics.map((metric, idx) => (
                            <tr key={idx}>
                                <th scope="row">{idx + 1}</th>
                                {Object.keys(metric)
                                    .filter(m => m !== "measurements")
                                    .map((key, index) => {
                                        let value = metric[key];
                                        if (key === "name") {
                                            value = (
                                                <Link to={{
                                                    pathname: "/project/" + this.props.projId + "/metric/" + metric.id,
                                                }}>{value}</Link>
                                            );
                                        }
                                        return (<td key={index}>{value}</td>)
                                    })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

function TableHeaders(props) {
    if (props.metric) {
        return (
            <tr>
                <th>#</th>
                {Object.keys(props.metric).map((field, idx) => (
                    <th key={idx}>{field}</th>
                ))}
            </tr>
        );
    }
    return (null);
}

export default MetricsList;
