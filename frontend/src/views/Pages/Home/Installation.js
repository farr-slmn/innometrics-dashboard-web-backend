import React, {Component} from 'react';
import {Button, Col, Jumbotron, Row, TabContent, TabPane} from "reactstrap";


class Installation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'Windows',
        };

        this.toggle = this.toggle.bind(this);

        this.links = {
            agentWinMsi: "/downloadables/MetricsCollectionSystem.msi",
            agentWinExe: "/downloadables/InnoMetrics_win.exe",
            agentMac: "/downloadables/InnoMetrics_mac.dmg",
            agentLin: "/downloadables/InnoMetrics_linux.bz2.run",
            agentJB: "/downloadables/Innometrics-JB-plugin.zip",
            agentVS: "/downloadables/InnometricsVSTracker.vsix",
        };
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
            <div className="animated fadeIn bg-white">
                <Jumbotron className="text-center text-white bg-dark">
                    <h1>Installation Instructions</h1>
                    <p className="lead">Choose agent:</p>
                </Jumbotron>

                <Row className="text-center">
                    <Col>
                        <Button outline color="secondary"
                                active={this.state.activeTab === 'Windows'}
                                onClick={this.toggle.bind(this, 'Windows')}>
                            <span className="os fa fa-windows"/>
                            <h4>Instruction for Windows</h4>
                        </Button>
                    </Col>
                    <Col>
                        <Button outline color="secondary"
                                active={this.state.activeTab === 'macOS'}
                                onClick={this.toggle.bind(this, 'macOS')}>
                            <span className="os fa fa-apple"/>
                            <h4>Instruction for OS X</h4>
                        </Button>
                    </Col>
                    <Col>
                        <Button outline color="secondary"
                                active={this.state.activeTab === 'Linux'}
                                onClick={this.toggle.bind(this, 'Linux')}>
                            <span className="os fa fa-linux"/>
                            <h4>Instruction for Linux</h4>
                        </Button>
                    </Col>
                    <Col>
                        <Button outline color="secondary"
                                active={this.state.activeTab === 'JB_plugin'}
                                onClick={this.toggle.bind(this, 'JB_plugin')}>
                            <span className="os">JB</span>
                            <h4>Instruction for Intellij IDEA, <br/> PyCharm</h4>
                        </Button>
                    </Col>
                    <Col>
                        <Button outline color="secondary"
                                active={this.state.activeTab === 'VS_plugin'}
                                onClick={this.toggle.bind(this, 'VS_plugin')}>
                            <span className="os">VS</span>
                            <h4>Instruction for Visual Studio</h4>
                        </Button>
                    </Col>
                </Row>

                <TabContent activeTab={this.state.activeTab} className="container mt-2">

                    <TabPane tabId="macOS" className="animated fadeIn">
                        <h2>Mac OS</h2>
                        <ul>
                            <li> Download the application <a href={this.links.agentMac} download>via this
                                link</a></li>
                            <li> double-click on downloaded file</li>
                            <li> Run InnoMtricsCollector from Applications (not from .dmg file) to start collecting
                                metrics.
                            </li>
                            <li> Drag-and-drop InnoMetricsCollector and InnometrcisTransfer into Applications folder
                            </li>
                            <li> Run InnometricsTransfer from Applications (not from .dmg file) to configure already
                                collected
                                metrics and send them to the server.
                            </li>
                        </ul>
                        <br/>
                    </TabPane>

                    <TabPane tabId="Linux" className="animated fadeIn">
                        <h2>Linux</h2>
                        <ul>
                            <li> Download installation file: <a href={this.links.agentLin}
                                                                download>Linux </a>
                            </li>
                            <li> Need to open Terminal, and go to the directory where the installation file
                                downloaded(InnoMetrics_linux.bz2.run);
                            </li>
                            <li> Make installation utilite executable: <br/><code>chmod u+x
                                InnoMetrics_linux.bz2.run;</code>
                            </li>
                            <li> Install programm by command : <br/><code>sudo ./InnoMetrics_linux.bz2.run;</code></li>
                            <li> Run program by finding program in Dash or just type InnoMetrics in terminal.</li>
                        </ul>
                    </TabPane>

                    <TabPane tabId="Windows" className="animated fadeIn">
                        <h2>Windows</h2>
                        <br/> Make sure to have MSSQL LocalDb Server installed on your machine.
                        To install "Metrics Collection System" download two files:
                        <ul>
                            <li><a href={this.links.agentWinMsi}
                                   download>MetricsCollectionSystem.msi</a>
                            </li>
                            <li><a href={this.links.agentWinExe} download>InnoMetrics_win.exe</a></li>
                        </ul>

                        <div>

                            <p>
                                To install "Metrics Collection System" download two files:
                                <ul>
                                    <li>MetricsCollectionSystem.msi</li>
                                    <li>setup.exe</li>
                                </ul>
                            </p>

                            <p>
                                Prerequisites:
                                <ul>
                                    <li>MSSQL LocalDb Server should be installed on the machine</li>
                                    <li>.NET Framework 4.0 or higher</li>
                                </ul>
                            </p>

                            <p>
                                Run setup.exe file. You'll see welcome window. Click "Next". In "Select Installation
                                Folder"
                                window select a folder, or leave the default value. In "Confirm Installation" window
                                click
                                "Next" and wait for completeion. Close the window.
                            </p>

                            <p>
                                The system is installed on the machine. It can be found in the folder, selected
                                for
                                installation. By default the folder is <b>C:\(ProgramFiles of ProgramFiles
                                (x86))\Innopolis University\Metrics Collection System</b>. The launcers are
                                there, and
                                also there're shortcuts on the desktop.
                            </p>

                            <p>
                                There're two launchers files:
                                <ul>
                                    <li>MetricsCollectorApplication.exe</li>
                                    <li>MetricsSenderApplication.exe</li>
                                </ul>
                            </p>


                            <h3>MetricsCollectorApplication.exe</h3>

                            <p>
                                The application for tracking user activities. Its launch after period without
                                any
                                activities in the system may be rather long because of launching of database
                                server.
                            </p>

                            <p>
                                Before launching a user can select the events when the application makes
                                snapshots -
                                reads all the information about current user activity (window title, .exe path
                                of
                                current application, etc.).
                                There're 3 events for selection:
                                <ol>
                                    <li>Foreground Window Change Tracking - the application makes a snapshot
                                        each time a
                                        user switches from one window to another
                                    </li>
                                    <li>Mouse Left Click Tracking - the application makes a snapshot each time a
                                        user
                                        clicks left button
                                    </li>
                                    <li>State Scanning - the application makes a snapshot each time after a
                                        specified
                                        State Scanning Interval; each of the above actions resets the timer for
                                        state
                                        scanning, so it occurs only when user does nothing for at least State
                                        Scanning
                                        Interval
                                    </li>
                                </ol>
                            </p>

                            <p>
                                In settings a user can specify State Scanning Interval, and Data Saving Interval
                                - the
                                interval of storing into the database. WARNING! When a user changes settings,
                                it's
                                recommended to run program as administrator, otherwise a failure is possible.
                            </p>

                            <h3>MetricsSenderApplication.exe</h3>

                            <p>
                                The application for observing collected activities, and sending
                                activities to
                                the server.
                            </p>

                            <h4>Data Table</h4>
                            <p>
                                This table is for observing tracked activities. To obtain activities
                                click
                                "Refresh" button. It may take some time to process data, especially if
                                the
                                collector has been working for a long period.
                            </p>

                            <h4>Filter</h4>
                            <p>
                                Filters out activities. Add a string to filter, click "Refresh" - all
                                the
                                activities, whose window title contains that string, will be filtered
                                out.
                            </p>

                            <p><b>WARNING! Filter is case sensitive!</b></p>

                            <p>Example:</p>

                            <table>
                                <tr>
                                    <td/>
                                    <td>Title</td>
                                    <td>..</td>
                                </tr>
                                <tr>
                                    <td/>
                                    <td>Folder Manager</td>
                                    <td/>
                                </tr>
                                <tr>
                                    <td/>
                                    <td>Google Chrome</td>
                                    <td/>
                                </tr>
                                <tr>
                                    <td/>
                                    <td>Music Player</td>
                                    <td/>
                                </tr>
                                <tr>
                                    <td/>
                                    <td>Folder Manager</td>
                                    <td/>
                                </tr>
                                <tr>
                                    <td/>
                                    <td>Video Player</td>
                                    <td/>
                                </tr>
                            </table>

                            <p>
                                If you want to filter out all the media player, add "Player" to the
                                filter
                                (exactly "Player", not "player" or something else). Both "Music Player"
                                and
                                "Video Player" will be filtered out.
                                If you want to filter out folder manager, add "Folder Manager". Both
                                "Folder
                                Manager" activities will be filtered out.
                                If you want to filter out google chrome, add "Google Chrome". Only one
                                activity
                                Google Chrome will be filtered out.
                            </p>

                            <h4>Date Filter</h4>
                            <p>Chooses only activities that were started within given period.</p>

                            <h4>Transmission</h4>
                            <p>
                                When there's a selection of activities in the table, all the visible
                                activities
                                (and only they) can be transmitted to the server. Click "Transmit"
                                button to
                                transmit activities. Sending data requires authorization (it is
                                requested only
                                for the first transmission within current program session, for logout
                                just close
                                the application). All the successfully transmitted data is deleted from
                                the
                                storage.
                            </p>

                            <h4>Settings</h4>
                            <p><b>WARNING! When a user changes settings, it's recommended to run program
                                as
                                administrator, otherwise a failure is possible.</b></p>

                            <div>
                                Here there're the following settings:
                                <ul>
                                    <li>"Send Per Once". The number of activities sent in one request to
                                        the
                                        server. It's not recommended to change this number, but a user
                                        can
                                        increase it or decrease if sending process takes too much time.
                                        Decreasing means that less activities is sent per once - more
                                        little
                                        requests.
                                        Increasing means that more activities is sent per once - less
                                        requests,
                                        but each request is large and takes much time, progress bar will
                                        be
                                        updated more slowly.
                                    </li>
                                    <li>"Authorization Uri". Provided by server administrator, and can
                                        be
                                        changed manually.
                                    </li>
                                    <li>"Send Data Uri". Provided by server administrator, and can be
                                        changed
                                        manually.
                                    </li>
                                    <li>"Update Xml Uri". Provided by server administrator, and can be
                                        changed
                                        manually.
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </TabPane>

                    <TabPane tabId="JB_plugin" className="animated fadeIn">
                        <h2>JetBrains IDE plugin: IntelliJ IDEA, PyCharm</h2>
                        <p>
                            Installation:
                            <ul>
                                <li> Download plugin archive: <a href={this.links.agentJB}
                                                                 download>Innometrics-JB-plugin.zip</a>
                                </li>
                                <li> Open JetBrains IDE application</li>
                                <li> Go to <code>File -> Settings... -> Plugins -> Install plugin from disk... -></code>
                                    path to the
                                    plugin zip archive.
                                </li>
                                <li> Restart the IDE.</li>
                            </ul>
                        </p>
                        <p>
                            Sending measurements & Settings:
                            <ul>
                                <li> Open JetBrains IDE application (the plugin must be enabled)</li>
                                <li> Go to <code>Tools -> Innometrics plugin</code></li>
                                <li> Enter login and password for InnoMetrics system</li>
                                <li> Enter InnoMetrics system url location</li>
                                <li> Click OK to save and go to sending activities conformation dialog.</li>
                            </ul>
                        </p>
                    </TabPane>

                    <TabPane tabId="VS_plugin" className="animated fadeIn">
                        <h2>Visual Studio Extension: 2015, 2017</h2>
                        <p>
                            Installation:
                            <ul>
                                <li> Download extension archive: <a href={this.links.agentVS}
                                                                 download>InnometricsVSTracker.vsix</a>
                                </li>
                                <li> Run it</li>
                                <li> Select your IDE version</li>
                            </ul>
                        </p>
                        <p>
                            Sending measurements & Settings:
                            <ul>
                                <li> Open Visual Studio application</li>
                                <li> Go to <code>Innometrics -> Settings</code></li>
                                <li> Enter login and password for InnoMetrics system</li>
                                <li> Enter InnoMetrics system url location</li>
                                <li> Click OK</li>
                            </ul>
                        </p>
                    </TabPane>
                </TabContent>
            </div>
        )
    }
}

export default Installation;