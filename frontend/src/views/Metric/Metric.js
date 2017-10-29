import React, { Component } from 'react';

class Members extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projectId: props.project,
            measurements: []
        };
    }

    componentDidMount() {
      fetch('/measurements/?project=' + this.state.projectId, { credentials: "same-origin" })
          .then(results => {
              return results.json();
          })
          .then(data => {
              this.setState({
                  measurements: data.measurements,
              });
          });
    }

    render() {
        return (
            <div className="">
                <table className="table table-striped">
                  <thead>
                    <TableHeaders measurement={this.state.measurements[0]}/>
                  </thead>
                  <tbody>
                    {this.state.measurements.map((measurement, idx) => (
                      <tr>
                        <th scope="row">{idx+1}</th>
                        {Object.keys(measurement).map((key, index) => (
                            <td>{measurement[key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        )
    }
}

function TableHeaders(props) {
    if (props.measurement) {
        return (
            <tr>
                <th>#</th>
                {Object.keys(props.measurement).map((field, idx) => (
                <th>{field}</th>
                ))}
            </tr>
        );
    }
    return (<tr><th>#</th></tr>);
}

export default Members;
