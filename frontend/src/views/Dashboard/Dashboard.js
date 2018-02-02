import React, {Component} from 'react';
import Project from "../Project";
import {Redirect, Route, Switch} from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

class Dashboard extends Component {

    constructor(props) {
        super(props);

        this.state = {
            projects: [],
            defaultProjectId: undefined,
            redirect: !Boolean(window.user_name),
        };

        this.defaultProjectRedirect = this.defaultProjectRedirect.bind(this);

        this.links = {
            projects: "/projects/?format=json",
        };
        this.routes = {
            login: "/login",
            project: "/project/",
        };
    }

    componentWillMount() {
        if (this.state.redirect) {
            return;
        }
        fetch(this.links.projects, {credentials: "same-origin"})
            .then(response => {
                if (response && response.status === 401) {
                    this.setState({ redirect:true});
                } else if (!response || response.status !== 200) {
                    window.alert("Bad response from server: " + response.status);
                    console.log(response);
                }
                return response.json();
            })
            .then(data => {
                data.results.unshift({
                    id: "all",
                    name: "(Default)",
                });
                this.setState({
                    projects: data.results,
                    defaultProjectId: data.results[0].id,
                });
            });
    }

    defaultProjectRedirect(id) {
        if (id || id === 0) {
            return (
                <Switch>
                  <Redirect exact from="/" to={this.routes.project + id}/>
                </Switch>
            );
        }
        return null;
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={this.routes.login}/>;
        }

        let sidebar_items = this.state.projects.map(project => ({
            id: project.id,
            name: project.name,
            url: this.routes.project + project.id,
            icon: 'icon-folder-alt',
            badge: project.warnings ? {
                variant: 'warning',
                text: '3'
            } : 0,
        }));

        let projectComponents = this.state.projects.map((project, i) => (
            <Project proj={project}/>
        ));

        return (
          <div className="app">
            <Header/>
            <div className="app-body">
              <Sidebar {...this.props} items={sidebar_items}/>
              <main className="main">
                {projectComponents.map(p => (
                    <Switch key={p.props.proj.id}>
                      <Route path={this.routes.project + p.props.proj.id} name={p.props.proj.name}>
                        {p}
                      </Route>
                    </Switch>
                ))}
                {this.defaultProjectRedirect(this.state.defaultProjectId)}
              </main>
            </div>
            <Footer/>
          </div>
        )
    }
}

export default Dashboard;
