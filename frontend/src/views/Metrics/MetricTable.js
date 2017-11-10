import React, {Component} from 'react';


class MetricTable extends Component {
    render() {

        return (
            <div className="card">
                <div className="card-header">
                    {this.props.name}
                </div>
                <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                        <TableHeaders measurement={this.props.measurements[0]}/>
                        </thead>
                        <tbody>
                        {this.props.measurements.map((measurement, idx) => (
                            <tr key={idx}>
                                <th scope="row">{idx + 1}</th>
                                {Object.keys(measurement).map((key, index) => (
                                    <td key={index}>{measurement[key]}</td>
                                ))}
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
    if (props.measurement) {
        return (
            <tr>
                <th>#</th>
                {Object.keys(props.measurement).map((field, idx) => (
                    <th key={idx}>{field}</th>
                ))}
            </tr>
        );
    }
    return (null);
}

export default MetricTable;
