import React, {Component} from 'react';
import {Link, Switch, Route, Redirect} from 'react-router-dom';
import {Container} from 'reactstrap';
import Header from '../../components/Header/';
import Sidebar from '../../components/Sidebar/';
import Breadcrumb from '../../components/Breadcrumb/';
import Aside from '../../components/Aside/';
import Footer from '../../components/Footer/';

import Project from '../../views/Project/Project';


class Full extends Component {
  constructor(props) {
      super(props);
      const test_projects = [
        {
            id: 0,
            name: "Project 0",
            warnings: 0,
            participants: [
                {
                    id: 0,
                    fullName: "User 1",
                    role: "Developer"
                },
                {
                    id: 1,
                    fullName: "User 2",
                    role: "Developer"
                },
                {
                    id: 3,
                    fullName: "User 3",
                    role: "Project Manager"
                },
            ],
        },
        {
            id: 1,
            name: "Project 1",
            warnings: 0,
            participants: [
                {
                    id: 0,
                    fullName: "User 1",
                    role: "Developer"
                },
                {
                    id: 1,
                    fullName: "User 2",
                    role: "QA"
                },
                {
                    id: 3,
                    fullName: "User 3",
                    role: "Project Manager"
                },
            ],
        },
        {
            id: 2,
            name: "Project 2",
            warnings: 3,
            participants: [
                {
                    id: 0,
                    fullName: "User 1",
                    role: "Developer"
                },
                {
                    id: 3,
                    fullName: "User 3",
                    role: "Project Manager"
                },
            ],
        }
      ];

      this.sidebar_items = test_projects.map((project) => {
          return {
              id: project.id,
              name: project.name,
              url: "/project/" + project.id,
              icon: 'icon-folder-alt',
              badge: project.warnings ? {
                variant: 'warning',
                text: '3'
              } : 0,
          };
      });

      this.default_project = 1;
      this.projects = test_projects.map((project, idx) => (
        <Project proj={project}/>
      ));
  }

  render() {


    return (
      <div className="app">
        <Header />
        <div className="app-body">
          <Sidebar {...this.props} items={this.sidebar_items}/>
          <main className="main">
            {/*<Breadcrumb />*/}
            <Container fluid>
              {this.projects.map((project, idx) => (
                <Switch key={project.props.proj.id}>
                  <Route path={"/project/" + project.props.proj.id}  name={project.props.proj.name}>
                    {project}
                  </Route>
                </Switch>
              ))}
                <Switch>
                    <Redirect exact from="/" to={"/project/" + this.default_project}/>
                </Switch>
            </Container>
          </main>
          <Aside />
        </div>
        <Footer />
      </div>
    );
  }
}

export default Full;
