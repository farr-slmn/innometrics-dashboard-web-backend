import React, {Component} from 'react';
import {Button, Card, Col, Container, Form, Input, InputGroup, InputGroupAddon, Row} from 'reactstrap';
import cookie from "react-cookie";

class Register extends Component {
  render() {
    let links = {
      register: "/dash_register/",
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
                  <InputGroup>
                    <InputGroupAddon><i className="icon-user"/></InputGroupAddon>
                    <Input name="username" type="text" placeholder="Username"/>
                  </InputGroup>
                  <div className="text-danger">{window.form_username_errors}</div>
                  <InputGroup className="mt-3">
                    <InputGroupAddon>@</InputGroupAddon>
                    <Input name="email" type="text" placeholder="Email"/>
                  </InputGroup>
                  <div className="text-danger">{window.form_email_errors}</div>
                  <InputGroup className="mt-3">
                    <InputGroupAddon><i className="icon-lock"/></InputGroupAddon>
                    <Input name="password1" type="password" placeholder="Password"/>
                  </InputGroup>
                  <div className="text-danger">{window.form_password1_errors}</div>
                  <InputGroup className="mt-3">
                    <InputGroupAddon><i className="icon-lock"/></InputGroupAddon>
                    <Input name="password2" type="password" placeholder="Repeat password"/>
                  </InputGroup>
                  <div className="text-danger">{window.form_password2_errors}</div>
                  <Input name="csrfmiddlewaretoken" type="hidden" value={cookie.load('csrftoken')}/>
                  <Button className="mt-4" color="primary" block>Create Account</Button>
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