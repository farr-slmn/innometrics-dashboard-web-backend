import React, {Component} from 'react';
import {Button, Card, CardGroup, Col, Container, Form, Input, InputGroup, InputGroupAddon, Row} from 'reactstrap';
import cookie from "react-cookie";
import {Link} from "react-router-dom";


class Login extends Component {
  render() {
    let loginLink = "/api-auth/login/";
    let registerRoute = "/register";

    return (
      <div className="app flex-row align-items-center animated fadeIn">
        <Container>
          <Row className="justify-content-center">
            <Col md="8">
              <CardGroup>
                <Card className="p-5">
                  <h2>Login</h2>
                  <p className="text-muted">Sign In to your account</p>
                  <Form action={loginLink} method="POST">
                    <InputGroup className="mb-3">
                      <InputGroupAddon><i className="icon-user"/></InputGroupAddon>
                      <Input name="username" type="text" placeholder="Username"/>
                    </InputGroup>
                    <InputGroup className="mb-4">
                      <InputGroupAddon><i className="icon-lock"/></InputGroupAddon>
                      <Input name="password" type="password" placeholder="Password"/>
                    </InputGroup>
                    <Input name="csrfmiddlewaretoken" type="hidden" value={cookie.load('csrftoken')}/>
                    <Row>
                      <Col xs="6">
                        <Button color="primary" className="px-4">Login</Button>
                      </Col>
                      <Col xs="6" className="text-right">
                        <Button color="link" className="px-0">Forgot password?</Button>
                      </Col>
                    </Row>
                  </Form>
                </Card>
                <Card className="p-5 text-white bg-primary py-5 d-md-down-none" style={{ width: 44 + '%' }}>
                  <div className="text-center">
                    <h2>Sign up</h2>
                    <p>Innometrics</p>
                    <Link to={registerRoute}>
                      <Button color="primary" className="mt-3" active>Register Now!</Button>
                    </Link>
                  </div>
                </Card>
              </CardGroup>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Login;