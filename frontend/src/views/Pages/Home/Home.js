import React, {Component} from 'react';
import {Route, Switch} from "react-router-dom";
import Header from "./Header";
import Installation from "./Installation";
import Main from "./Main";


class Home extends Component {

    constructor(props) {
        super(props);

        this.routes = {
            installation: "/installation"
        };
    }

    componentDidMount() {
        document.title = "Innometrcs - Home";
    }

    render() {

        return (
            <div className="app bg-white">
                <Header/>

                <div className="pt-1 mb-5 bg-white">
                    <Switch>
                        <Route path={this.routes.installation} component={Installation}/>
                        <Route path="" component={Main}/>
                    </Switch>
                </div>

                <footer className="p-2 bg-light fixed-bottom">
                    1 Universitetskaya, Innopolis, Tatarstan, 420500
                    <a href="mailto:university@innopolis.ru"> university@innopolis.ru</a>
                    <span className="float-right">&copy; Innometrics. All rights reserved.</span><br/>
                </footer>
            </div>
        );
    }
}

export default Home;