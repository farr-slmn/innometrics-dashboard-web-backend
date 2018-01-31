import React, {Component} from 'react';
import {Button, Card, Col, Container, Form, Input, InputGroup, InputGroupAddon, Row} from 'reactstrap';
import cookie from "react-cookie";

class Register extends Component {
  render() {
    let links = {
      register: "/register/",
    };

    return (
      <div className="app flex-row align-items-center animated fadeIn">
        <Container>
          <Row className="justify-content-center">
            <Col md="6">
              <Card className="mx-4 p-5">
                <h1>Register</h1>
                <p className="text-muted">Create your account</p>
                <Form action={links.register} method="POST">
                  <InputGroup className="mb-3">
                    <InputGroupAddon><i className="icon-user"/></InputGroupAddon>
                    <Input name="username" type="text" placeholder="Username"/>
                  </InputGroup>
                  <InputGroup className="mb-3">
                    <InputGroupAddon>@</InputGroupAddon>
                    <Input name="email" type="text" placeholder="Email"/>
                  </InputGroup>
                  <InputGroup className="mb-3">
                    <InputGroupAddon><i className="icon-lock"/></InputGroupAddon>
                    <Input name="password" type="password" placeholder="Password"/>
                  </InputGroup>
                  <InputGroup className="mb-4">
                    <InputGroupAddon><i className="icon-lock"/></InputGroupAddon>
                    <Input name="password_repeat" type="password" placeholder="Repeat password"/>
                  </InputGroup>
                  <Input name="csrfmiddlewaretoken" type="hidden" value={cookie.load('csrftoken')}/>
                  <Button color="primary" block>Create Account</Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Register;