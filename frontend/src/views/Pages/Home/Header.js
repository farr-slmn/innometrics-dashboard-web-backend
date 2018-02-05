import React, {Component} from 'react';
import {Button, Nav, Navbar, NavbarBrand, NavItem, NavLink} from "reactstrap";

class Header extends Component {

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.state = {
            activeTab: 'Home',
        };

        this.routes = {
            home: "/",
            installation: "/installation",
            dashboard: "/dashboard",
            login: "/login",
        }
    }

    toggle(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }

    render() {
        return (
            <div>
                <Navbar color="faded" light>
                    <NavbarBrand href={"#" + this.routes.home} className="mr-1">
                        <span className="icon-chart text-primary"/>
                        <span style={{fontFamily: 'Roboto, sans-serif'}}> Innometrics </span>
                    </NavbarBrand>
                    <Nav className="ml-auto">
                        <NavItem className="mr-md-3">
                            <NavLink tag={Button}
                                     outline color="primary"
                                     active={this.state.activeTab === 'Home'}
                                     onClick={this.toggle.bind(this, 'Home')}
                                     href={"#" + this.routes.home}>Home</NavLink>
                        </NavItem>
                        <NavItem className="mr-md-3">
                            <NavLink tag={Button}
                                     outline color="primary"
                                     active={this.state.activeTab === 'Installation'}
                                     onClick={this.toggle.bind(this, 'Installation')}
                                     href={"#" + this.routes.installation}>Installation</NavLink>
                        </NavItem>
                        <NavItem className="mr-3">
                            <NavLink tag={Button}
                                     outline color="primary"
                                     active={this.state.activeTab === 'Dashboard'}
                                     onClick={this.toggle.bind(this, 'Dashboard')}
                                     href={"#" + this.routes.dashboard}>Dashboard</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href={"#" + this.routes.login} tag={Button}>Log in</NavLink>
                        </NavItem>
                    </Nav>
                </Navbar>
            </div>
        )
    }
}

export default Header;
