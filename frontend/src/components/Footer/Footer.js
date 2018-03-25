import React, { Component } from 'react';

class Footer extends Component {
  render() {
    return (
      <footer className="app-footer">
        1 Universitetskaya, Innopolis, Tatarstan, 420500
        <a href="mailto:university@innopolis.ru"> university@innopolis.ru</a>
        <span className="float-right">&copy; Innometrics. All rights reserved.</span><br/>
      </footer>
    )
  }
}

export default Footer;
