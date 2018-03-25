import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';
import {createBrowserHistory} from 'history';
// Styles
// Import Font Awesome Icons Set
import 'font-awesome/css/font-awesome.min.css';
// Import Simple Line Icons Set
import 'simple-line-icons/css/simple-line-icons.css';
// Import Main styles for this application
import '../scss/style.scss'
// Containers
import Register from "./views/Pages/Register";
import Login from "./views/Pages/Login";
import Dashboard from "./views/Dashboard/Dashboard";
import Home from "./views/Pages/Home/Home";

const history = createBrowserHistory();

ReactDOM.render((
  <HashRouter history={history}>
    <Switch>
      <Route path="/login" name="Login" component={Login}/>
      <Route path="/register" name="Register" component={Register}/>
      <Route path="/dashboard" name="Dashboard" component={Dashboard}/>
      <Route path="/" name="Home" component={Home}/>
    </Switch>
  </HashRouter>
), document.getElementById('root'));
