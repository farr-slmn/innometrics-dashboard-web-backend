import React, {Component} from 'react';
import {
    Badge,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
} from 'reactstrap';

class Header extends Component {

  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      dropdownOpen: false
    };
  }

  toggle() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  sidebarToggle(e) {
    e.preventDefault();
    document.body.classList.toggle('sidebar-hidden');
  }

  sidebarMinimize(e) {
    e.preventDefault();
    document.body.classList.toggle('sidebar-minimized');
  }

  mobileSidebarToggle(e) {
    e.preventDefault();
    document.body.classList.toggle('sidebar-mobile-show');
  }

  asideToggle(e) {
    e.preventDefault();
    document.body.classList.toggle('aside-menu-hidden');
  }

  render() {
    return (
      <Navbar className="app-header" style={{listStyle: "none"}}>
        <NavbarToggler className="d-lg-none" onClick={this.mobileSidebarToggle}>
          <span className="icon-menu"/>
        </NavbarToggler>
        <NavbarBrand href="#" style={{marginRight: "1em"}}>
          <span className="icon-chart text-primary"/>
          <span style={{fontFamily: 'Roboto, sans-serif'}}> Innometrics </span>
        </NavbarBrand>
        <NavbarToggler className="d-md-down-none mr-auto" onClick={this.sidebarToggle}>
          <span className="icon-menu"/>
        </NavbarToggler>
        <NavItem>
          <Button color="warning" style={{paddingRight: "2em", marginRight: "1em"}}>
            Warnings <Badge color="light" style={{marginRight: "2em"}}>3</Badge>
          </Button>
        </NavItem>
        <NavItem>
          <Button outline color="danger" style={{paddingRight: "2em"}}>
            Critical <Badge color="light">0</Badge>
          </Button>
        </NavItem>
        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle nav caret>
            <img src={'/static/img/avatars/default.jpg'} className="img-avatar" alt={window.user_email}/>
              <span className="hidden-md-down">{window.user_name}</span>
          </DropdownToggle>
          <DropdownMenu right>
            <DropdownItem header tag="div" className="text-center"><strong>Account</strong></DropdownItem>
            <DropdownItem disabled>
              <i className="icon-bell"/>Updates
              <Badge color="info">0</Badge>
            </DropdownItem>
            <DropdownItem header tag="div" className="text-center"><strong>Settings</strong></DropdownItem>
            <DropdownItem disabled><i className="icon-user"/>Profile</DropdownItem>
            <DropdownItem disabled><i className="icon-wrench"/>Settings</DropdownItem>
            <DropdownItem divider/>
            <DropdownItem tag="a" href="/api-auth/logout/">
              <i className="icon-lock"/> Logout
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </Navbar>
    )
  }
}

export default Header;
