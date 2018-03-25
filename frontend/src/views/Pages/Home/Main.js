import React, {Component} from 'react';
import {Button, Col, Jumbotron, Row} from "reactstrap";

class Main extends Component {

    constructor(props) {
        super(props);
        this.links = {
            agentWin: "/downloadables/InnoMetrics_win.zip",
            agentMac: "/downloadables/InnoMetrics_mac.dmg",
            agentLin: "/downloadables/InnoMetrics_linux.bz2.run",
            agentJB: "/downloadables/Innometrics-JB-plugin.zip",
            agentVS: "/downloadables/InnometricsVSTracker.vsix",
        };

        this.routes = {
            installation: "/installation",
        };
    }

    render() {
        return (
            <div>

                <div id="banner-wrapper">
                    <div id="banner" className="container">
                        <h2>Innometrics Tool</h2>
                        <p>
                            We provide analytics for data collected via Innometrics agents.
                        </p>
                        <Button href={"#" + this.routes.installation} color="primary" size="lg">Get Started</Button>
                    </div>
                </div>

                <div className="bg-white">
                    <Jumbotron className="container bg-transparent text-center">
                        <div>
                            <h1>Download agent for your platform</h1>
                            <p className="lead text-muted">Available for Windows, OS X and Linux</p>
                        </div>

                        <Row>
                            <Col>
                                <span className="os fa fa-windows"/>
                                <div>
                                    <h3>Download for Windows</h3>
                                </div>
                                <Button href={this.links.agentWin} color="success">
                                    <span className="icon-arrow-down-circle"/> Download
                                </Button>
                            </Col>
                            <Col>
                                <span className="os fa fa-apple"/>
                                <div>
                                    <h3>Download for OS X</h3>
                                </div>
                                <Button href={this.links.agentMac} color="success">
                                    <span className="icon-arrow-down-circle"/> Download
                                </Button>
                            </Col>
                            <Col>
                                <span className="os fa fa-linux"/>
                                <div>
                                    <h3>Download for Linux</h3>
                                </div>
                                <Button href={this.links.agentLin} color="success">
                                    <span className="icon-arrow-down-circle"/> Download
                                </Button>
                            </Col>
                        </Row>
                    </Jumbotron>

                    <Jumbotron className="container bg-transparent text-center">
                        <div>
                            <h1>Download agent for your IDE</h1>
                            <p className="lead text-muted">Available for Visual Studio, IntelliJ IDEA and PyCharm</p>
                        </div>

                        <Row>
                            <Col>
                                <span className="os">JB</span>
                                <div>
                                    <h3>Download for Intellij IDEA, <br/> PyCharm</h3>
                                </div>
                                <Button href={this.links.agentJB} color="success">
                                    <span className="icon-arrow-down-circle"/> Download
                                </Button>
                            </Col>
                            <Col>
                                <span className="os">VS</span>
                                <div>
                                    <h3>Download for Visual Studio</h3>
                                </div>
                                <Button href={this.links.agentVS} color="success">
                                    <span className="icon-arrow-down-circle"/> Download
                                </Button>
                            </Col>
                        </Row>
                    </Jumbotron>
                </div>

            </div>
        )
    }
}

export default Main;