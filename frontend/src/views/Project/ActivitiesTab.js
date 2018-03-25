import React, {Component} from 'react';
import {Collapse, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText} from "reactstrap";

class ActivitiesTab extends Component {

    constructor(props) {
        super(props);
        this.state = {
            activitiesToggle: [].fill(false, 0, props.activities.length),
        };
    }

    toggle(idx) {
        this.state.activitiesToggle[idx] = !this.state.activitiesToggle[idx];
        this.setState({
            activitiesToggle: this.state.activitiesToggle,
        });
    }

    render() {

        return (
          <ListGroup className="animated fadeIn tab-margin">
            {this.props.activities.map((a, i) => (
              <ListGroupItem key={i} tag="button" action onClick={this.toggle.bind(this, i)}>

                <ListGroupItemHeading>{a.name}</ListGroupItemHeading>

                <Collapse isOpen={this.state.activitiesToggle[i]}>
                  <ListGroupItemText style={{marginLeft: "1em"}} className="tab-margin">
                      {a.properties.map((p, i) => (
                        <span key={i}><code>[{p.type}]</code> {p.name}<br/></span>
                      ))}
                  </ListGroupItemText>
                </Collapse>

              </ListGroupItem>
            ))}
          </ListGroup>
        )
    }
}

export default ActivitiesTab;
