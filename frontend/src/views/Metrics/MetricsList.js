import React, {Component} from 'react';
import ReactJson from 'react-json-view'
import {Link} from "react-router-dom";
import {SyncLoader} from "react-spinners";
import {Button} from "reactstrap";


class MetricsList extends Component {

    constructor(props) {
        super(props);

        this.routes = {
            metric: "/dashboard/project/" + this.props.projId + "/metric/",
        };
    }

    static tableHeaders(metric) {
        if (metric) {
            let headFields = Object.keys(metric).map((field, idx) => (
              <th key={idx}>{field}</th>
            ));

            return (
              <tr className="animated fadeIn">
                <th>#</th>
                {headFields}
                <th>Delete</th>
              </tr>
            );
        }
        return (null);
    }

    dependent(metricId) {
        return this.props.metrics.filter(m => m.type === "C" && m.info.components.includes(metricId));
    }

    del(metricId) {
        this.props.deleteAction(metricId);
    }

    render() {

        let metricsDisplayInfo = this.props.metrics.map(m => ({
            id: m.id,
            name: m.name,
            type: m.type === "C" ? "Composite" : "Raw",
            info: m.info,
        }));

        let tableRows = metricsDisplayInfo.map((metric, idx) => (

          <tr key={idx} className="animated fadeIn">
            <th scope="row">{idx + 1}</th>
              {Object.keys(metric)
                  .map((key, index) => {
                      let value = metric[key];
                      if (key === "name") {
                          value = (
                            <Link to={this.routes.metric + metric.id}>{value}</Link>
                          );
                      }
                      if (key === "info") {
                          value = (<ReactJson src={value}
                                              name={false}
                                              collapsed={1}
                                              enableClipboard={false}
                                              displayDataTypes={false}/>);
                      }
                      return (<td key={index}>{value}</td>)
              })}
              <td>
                <Button color="link" onClick={this.del.bind(this, metric.id)}
                        disabled={this.dependent.bind(this)(metric.id).length > 0}>
                  <i className={"icon-close" + (this.dependent.bind(this)(metric.id).length === 0 ? " text-danger" : "")}/>
                </Button>
              </td>
          </tr>
        ));

        return (
          <div className="card">
            <div className="card-header">{this.props.name}</div>
            <div className="card-body">
              <div className="text-center">
                <SyncLoader loading={this.props.loading} color="#36D7B7" size={20} margin="10px"/>
              </div>
              <table className="table table-striped">
                <thead>{MetricsList.tableHeaders(metricsDisplayInfo[0])}</thead>
                <tbody>
                  {tableRows}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
}

export default MetricsList;
