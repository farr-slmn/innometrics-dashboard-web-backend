import React, { Component } from 'react';
import DashboardItem from '../DashboardItem/DashboardItem';
import { Line } from 'react-chartjs-2';
import {Link, NavLink, Redirect, Route, Switch} from "react-router-dom";

const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
        {
            label: 'Story points',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(75,192,192,1)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(75,192,192,1)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [63, 62, 58, 50, 32, 32, 32, 25, 11, 4, 0, 0]
        }
    ]
};

class Project extends Component {
  constructor(props) {
      super(props);
      this.proj = props.proj;
  }

  render() {
      const pr_bar_style = {
          width: '25%'
      };

    return (
        <div>
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <NavLink to={"/project/" + this.proj.id + "/general/"} className="nav-link" activeClassName="active">General</NavLink>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">Development</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">Testing</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">History</a>
                </li>
                <li className="nav-item">
                    <NavLink to={"/project/" + this.proj.id + "/preferences/"} className="nav-link" activeClassName="active">Preferences</NavLink>
                </li>
            </ul>
            <Switch>
                <Redirect from="/" to={this.proj.id + "/general/"}/>
            </Switch>
            <Switch>
                <Route path={"/project/" + this.proj.id + "/preferences/"}>
                    <div>
                        <div>
                            Project name: {this.proj.name}
                        </div>
                        <div>
                            Warnings: {this.proj.warnings}
                        </div>
                    </div>
                </Route>
            </Switch>
            <Switch>
              <Route path={"/project/" + this.proj.id + "/general/"} name="General">
                <div className="container">
                  <div className="row card-group animated fadeIn">
                    <div className="card">
                      <div className="card-block">
                        <div className="h1 text-muted text-right mb-2">
                          <i className="icon-people"/>
                        </div>
                        <div className="h4 mb-0">87.500</div>
                        <small className="text-muted text-uppercase font-weight-bold">Metric 1</small>
                        <div className="progress progress-xs mt-1 mb-0">
                          <div className="progress-bar bg-info" role="progressbar" style={pr_bar_style} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"/>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-block">
                        <div className="h1 text-muted text-right mb-2">
                          <i className="icon-user-follow"></i>
                        </div>
                        <div className="h4 mb-0">385</div>
                        <small className="text-muted text-uppercase font-weight-bold">Metric 2</small>
                        <div className="progress progress-xs mt-1 mb-0">
                          <div className="progress-bar bg-success" role="progressbar" style={pr_bar_style} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-block">
                        <div className="h1 text-muted text-right mb-2">
                          <i className="icon-basket-loaded"></i>
                        </div>
                        <div className="h4 mb-0">1238</div>
                        <small className="text-muted text-uppercase font-weight-bold">Metric 3</small>
                        <div className="progress progress-xs mt-1 mb-0">
                          <div className="progress-bar bg-warning" role="progressbar" style={pr_bar_style} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-block">
                        <div className="h1 text-muted text-right mb-2">
                          <i className="icon-pie-chart"></i>
                        </div>
                        <div className="h4 mb-0">28%</div>
                        <small className="text-muted text-uppercase font-weight-bold">Metric 4</small>
                        <div className="progress progress-xs mt-1 mb-0">
                          <div className="progress-bar" role="progressbar" style={pr_bar_style} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </div>
                    </div>
                    <div className="card">
                      <div className="card-block">
                        <div className="h1 text-muted text-right mb-2">
                          <i className="icon-speedometer"></i>
                        </div>
                          <span className="text-nowrap">
                              <small className="text-muted text-uppercase font-weight-bold">Time Spent:</small> <span className="h4 mb-0 text-right">72:34</span><br/>
                              <small className="text-muted text-uppercase font-weight-bold">Time Left:</small> <span className="h4 mb-0 text-right">216:26</span>
                          </span>

                        {/*<small className="text-muted text-uppercase font-weight-bold">Avg. Time</small>*/}
                        <div className="progress progress-xs mt-1 mb-0">
                          <div className="progress-bar bg-danger" role="progressbar" style={pr_bar_style} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row animated fadeIn">
                    <div className="card d-inline-block">
                      <div className="card-header h7">
                        Story Points Remaining: <span className="h5 font-weight-bold">&ensp;&ensp;0</span>
                      </div>
                      <div className="card-body">
                        <Line data={data}/>
                      </div>
                    </div>
                    <DashboardItem/>
                    {/*<div className="card">Column</div>
                    <div className="card">Column</div>*/}
                  </div>
                </div>
              </Route>
            </Switch>
        </div>
    )
  }
}

export default Project;
