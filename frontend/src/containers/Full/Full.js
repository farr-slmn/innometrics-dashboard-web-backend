import React, {Component} from 'react';
import {Route, Switch} from 'react-router-dom';
import Dashboard from "../../views/Dashboard";


class Full extends Component {

  render() {
    return (
      <div>
        <Switch>
          <Route path="/" name="Dashboard" component={Dashboard}/>
        </Switch>
      </div>
    );
  }
}

export default Full;
