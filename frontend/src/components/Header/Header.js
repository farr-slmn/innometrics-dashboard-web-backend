import React, { Component } from 'react';
import {
  Nav,
  NavItem,
  NavbarToggler,
  NavbarBrand,
} from 'reactstrap';

class Header extends Component {

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
      <header className="app-header navbar">
        <NavbarToggler className="d-lg-none" onClick={this.mobileSidebarToggle}>&#9776;</NavbarToggler>
        <NavbarBrand href="#"></NavbarBrand>
        <NavbarToggler className="d-md-down-none mr-auto" onClick={this.sidebarToggle}>&#9776;</NavbarToggler>
        <button type="button" className="btn btn-warning">Warnings<span className="badge badge-pill badge-light">3</span></button>
        <button type="button" className="btn btn-outline-danger">Critical<span className="badge badge-pill badge-light">0</span></button>
        <div className="dropdown">
          <a className="nav-link dropdown-toggle nav-link" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
            <img src="/static/img/avatars/1.jpg" className="img-avatar" alt="admin@bootstrapmaster.com"/>
              <span className="hidden-md-down">admin</span>
          </a>
          <div tabIndex="-1" aria-hidden="true" role="menu" className="dropdown-menu-right dropdown-menu">
            <h6 tabIndex="-1" className="text-center dropdown-header"><strong>Account</strong></h6>
            <button tabIndex="0" className="dropdown-item">
              <i className="fa fa-bell-o"></i>Updates
              <span className="badge badge-info">42</span>
            </button>
            <button tabIndex="0" className="dropdown-item">
              <i className="fa fa-envelope-o"></i>Messages
              <span className="badge badge-success">42</span>
            </button>
            <button tabIndex="0" className="dropdown-item">
              <i className="fa fa-tasks"></i>Tasks
              <span className="badge badge-danger">42</span>
            </button>
            <button tabIndex="0" className="dropdown-item">
              <i className="fa fa-comments"></i>Comments
              <span className="badge badge-warning">42</span>
            </button>
            <h6 tabIndex="-1" className="text-center dropdown-header"><strong>Settings</strong></h6>
            <button tabIndex="0" className="dropdown-item"><i className="fa fa-user"></i>Profile</button>
            <button tabIndex="0" className="dropdown-item"><i className="fa fa-wrench"></i>Settings</button>
            <button tabIndex="0" className="dropdown-item"><i className="fa fa-usd"></i>Payments<span className="badge badge-default">42</span></button>
            <button tabIndex="0" className="dropdown-item"><i className="fa fa-file"></i>Projects<span className="badge badge-primary">42</span></button>
            <div tabIndex="-1" className="dropdown-divider"></div>
            <button tabIndex="0" className="dropdown-item"><i className="fa fa-shield"></i>Lock Account</button>
            <button tabIndex="0" className="dropdown-item"><i className="fa fa-lock"></i>Logout</button>
          </div>
        </div>
      </header>
    )
  }
}

export default Header;
