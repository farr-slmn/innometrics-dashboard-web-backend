import React, {Component} from 'react';
import {SyncLoader} from "react-spinners";


class MetricTable extends Component {
    render() {

        return (
            <div className="card">
                <div className="card-header">
                    {this.props.name}
                </div>
                <div className="card-body">
                    <div className="text-center">
                        <SyncLoader loading={this.props.loading} color="#36D7B7" size={20} margin="10px"/>
                    </div>
                    {this.props.measurements ?
                        (<table className="table table-striped animated fadeIn">
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
                        </table>) : null
                    }
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
