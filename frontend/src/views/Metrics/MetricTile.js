import React, {Component} from 'react';
import {Link} from "react-router-dom";
import {Card} from "reactstrap";

class MetricTile extends Component {

    constructor(props) {
        super(props);
        this.id = props.id;
        this.projectId = props.projectId;
        this.name = props.name;
        this.value = props.value;
        this.trend = props.trend;
    }


    render() {
        return (
            <Card className={this.trend === "good" ? "bg-success" : this.trend === "bad" ? "bg-danger" : "bg-info"}>
                <Link to={"/project/" + this.projectId + "/metric/" + this.id}
                      style={{color: 'white', textDecoration: 'none'}}>
                    <div className="card-body">
                        {this.name}
                        <h3>{this.value}</h3>
                    </div>
                </Link>
            </Card>
        )
    }
}

export default MetricTile;
