import React, {Component} from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import {Container} from 'reactstrap';
import Header from '../../components/Header/';
import Sidebar from '../../components/Sidebar/';
// import Breadcrumb from '../../components/Breadcrumb/';
// import Aside from '../../components/Aside/';
import Footer from '../../components/Footer/';

import Project from '../../views/Project/Project';


class Full extends Component {
    constructor(props) {
        super(props);

        this.state = {
            sidebar_items: [],
            projectComponents: [],
            default_project: undefined,
        };
    }

    componentDidMount() {
        fetch('/projects/?format=json', {credentials: "same-origin"})
            .then(results => {
                return results.json();
            })
            .then(data => {
                const projects = data.results;
                this.setState({
                    sidebar_items: projects.map((project) => {
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
                    }),
                    projectComponents: projects.map((project, idx) => (
                        <Project proj={project}/>
                    )),
                    default_project: projects ? projects[0].id : undefined,
                });
            });
    }

    render() {

        return (
            <div className="app">
                <Header/>
                <div className="app-body">
                    <Sidebar {...this.props} items={this.state.sidebar_items}/>
                    <main className="main">
                        {/*<Breadcrumb />*/}
                        <Container fluid>
                            {this.state.projectComponents.map((project, idx) => (
                                <Switch key={project.props.proj.id}>
                                    <Route path={"/project/" + project.props.proj.id} name={project.props.proj.name}>
                                        {project}
                                    </Route>
                                </Switch>
                            ))}
                            <DefaultProjectRedirect id={this.state.default_project}/>
                        </Container>
                    </main>
                    {/*<Aside />*/}
                </div>
                <Footer/>
            </div>
        );
    }
}

function DefaultProjectRedirect(props) {
    if (props.id >= 0) {
        return (
            <Switch>
                <Redirect exact from="/" to={"/project/" + props.id}/>
            </Switch>
        );
    }
    return (null);
}

export default Full;
