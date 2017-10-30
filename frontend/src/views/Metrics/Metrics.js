import React, { Component } from 'react';

class Metrics extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projectId: props.project,
            metrics: [
                {
                    id: 1,
                    type: 'raw',
                    name: 'Browser apps time',
                    filters: ['group=1'],
                    field: ['int', 'time'],
                    aggregate: 'sum',
                    groupby: ['connect time', 'day'],
                },
                {
                    id: 2,
                    name: 'Apps time',
                    type: 'raw',
                    filters: [],
                    field: ['int', 'time'],
                    aggregate: 'sum',
                    groupby: ['connect time', 'day'],
                },
                // {
                //     id: 3,
                //     name: 'Linux apps time percentage',
                //     type: 'composite',
                //     components: [1, 2],
                //     aggregate: 'div',
                //     // groupby: ['connect time', 'day']
                // },
            ],
            measurements: [],
            value: undefined,
        };
        this.metricComponents = this.state.metrics.map((metric, idx) => (
            <Metric project={this.state.projectId} key={metric.id} metricInfo={metric}/>
        ));
    }

    // componentDidMount() {
    //   fetch('/measurements/?project=' + this.state.projectId, { credentials: "same-origin" })
    //       .then(results => {
    //           return results.json();
    //       })
    //       .then(data => {
    //           this.setState({
    //               measurements: data.measurements,
    //           });
    //       });
    // }

    render() {
        return (
            <div>
            {this.metricComponents}
            </div>
        );
    }

}

class Metric extends Component {

    constructor(props) {
        super(props);
        this.state = {
            projectId: props.project,
            metricInfo: props.metricInfo,
            value: undefined,
            measurements: []
        };
    }

    componentDidMount() {
        let url = '/measurements/joined/?project=' + this.state.projectId;
        this.state.metricInfo.filters.map((filter) => {
            url += '&' + filter;
        });
      fetch(url, { credentials: "same-origin" })
          .then(results => {
              return results.json();
          })
          .then(data => {
              if (this.state.metricInfo.type === 'raw') {
                  let newState = {
                      measurements: data.measurements,
                  };
                  if (this.state.metricInfo.field) {
                      let fieldName = this.state.metricInfo.field[1];
                      let dataWithField = data.measurements.filter((m) => m.name === fieldName);
                      newState['measurements'] = dataWithField;
                      let aggr = this.state.metricInfo.aggregate;
                      if (aggr) {
                          let for_aggregation = dataWithField.map((m) => {
                              if (this.state.metricInfo.field[0] === 'int') {
                                  return Number(m.value)
                              }
                              return m.value;
                          });
                          switch (aggr) {
                              case 'sum':
                                  newState['value'] = for_aggregation.reduce((a, b) => a + b, 0);
                                  break;
                          }
                      }
                  }
                  this.setState(newState);
              }
          });
    }

    render() {
        return (
            <div className="">
                {this.state.value}
                <table className="table table-striped">
                  <thead>
                    <TableHeaders measurement={this.state.measurements[0]}/>
                  </thead>
                  <tbody>
                    {this.state.measurements.map((measurement, idx) => (
                      <tr key={idx}>
                        <th scope="row">{idx+1}</th>
                        {Object.keys(measurement).map((key, index) => (
                        <td key={index}>{measurement[key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    return (<tr><th>#</th></tr>);
}

export default Metrics;
