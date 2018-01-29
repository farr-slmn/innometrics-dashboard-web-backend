import React, {Component} from 'react';
import {SyncLoader} from "react-spinners";


class MetricTable extends Component {
    render() {
        let labels = ['Id', 'Name', 'Value', 'Type', 'Activity id', 'Activity'];
        let fields = ['id', 'name', 'value', 'type', 'activity_id', 'entity'];

        return (
          <div className="card">
            <div className="card-header">
              {this.props.name}
            </div>
            <div className="card-body">
              <table className="table table-striped">

                <thead>
                  <tr>
                    <th>#</th>
                    {labels.map((l, i) => (
                        <th key={i}>{l}</th>
                    ))}
                  </tr>
                </thead>

                {this.props.measurements ? (
                    <tbody className="animated fadeIn">
                      {this.props.measurements.map((measurement, idx) => (
                        <tr key={idx}>
                          <th scope="row">{idx + 1}</th>
                          {fields.map((f, i) => (
                            <td key={i}>{measurement[f]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                ) : null}

              </table>

              <div className="text-center">
                <SyncLoader loading={this.props.loading} color="#36D7B7" size={20} margin="10px"/>
              </div>
            </div>
          </div>
        );
    }
}

export default MetricTable;
