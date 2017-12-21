import React, {Component} from 'react';
import MetricsList from "../../views/Metrics/MetricsList";
import MetricContainer from "./MetricContainer";
import {Route, Switch} from "react-router-dom";


class MetricsContainer extends Component {

    render() {
        return (
            <div>
                <Switch>
                    {this.props.metrics.map(metric => (
                        <Route key={"metric_" + metric.id}
                               path={"/project/" + this.props.projId + "/metric/" + metric.id}>
                            <div className="animated fadeIn">
                                <MetricContainer metric={metric} projId={this.props.projId}/>
                            </div>
                        </Route>
                    ))}
                    <Route exact path="">
                        <div className="animated fadeIn">
                            <MetricsList name="Metrics" projId={this.props.projId} loading={this.props.loading} metrics={
                                this.props.metrics.map(m => ({
                                    id: m.id,
                                    name: m.name,
                                    type: m.type === "C" ? "Composite" : "Raw",
                                    info: JSON.stringify(m.info),
                                }))
                            }/>
                        </div>
                    </Route>
                </Switch>

            </div>
        );
    }
}

export default MetricsContainer;
