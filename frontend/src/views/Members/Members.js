import React, { Component } from 'react';

class Members extends Component {

    constructor(props) {
        super(props);
        this.members = props.participants.slice();
    }


    render() {
        return (
            <div className="">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.members.map((member, idx) => (
                      <tr>
                        <th scope="row">{idx+1}</th>
                        <td>{member.id}</td>
                        <td>{member.fullName}</td>
                        <td>{member.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        )
    }
}

export default Members;
