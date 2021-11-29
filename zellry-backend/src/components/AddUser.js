import React, { Component } from "react";
import  {Helmet } from 'react-helmet-async';
import Layout from "./layout";
import { Link } from "react-router-dom";


import { addUser } from '../redux/actions/user';
import { connect } from "react-redux";


export class AddUser extends Component {
  constructor(props) {
    super(props);

    this.state = {
      photo: "",
      username: "",
      email: "",
      password: "",
      contact_no:"",
      status:1,
      errors: {},
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  handleInputChange(event) {
    const { type, name, value, files } = event.target;
    if(type === "file"){
      this.setState({
        [name]: files[0],
      });
    }
    else{
      this.setState({
        [name]: value,
      });
    }    
  }

  // Submit
  onSubmit = (e) => {
    e.preventDefault();

    if (this.validateForm()) {
      const { username, email, password, contact_no, status, photo } = this.state;
      
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("contact_no", contact_no);
      formData.append("status", status);

      console.log("this.state", this.state);

      const config = {
        headers: {
          "content-type": "multipart/form-data",
        },
      };
      this.props.addUser(formData, config, this.props);
    }
  };

  validateForm() {
    const { username, email, password, contact_no } = this.state;

    let errors = {};
    let formIsValid = true;

    var password_match = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;

    if (!username.trim()) {
      formIsValid = false;
      errors["username"] = "*Please enter username.";
    }

    if (!email.trim()) {
      formIsValid = false;
      errors["email"] = "*Please enter email.";
    }
    else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      formIsValid = false;
      errors["email"] = "*Please enter valid email.";
    }

    if (!password.trim()) {
      formIsValid = false;
      errors["password"] = "*Please enter password.";
    }
    else if(!password_match.test(password)){
      formIsValid = false;
      errors["password"] = "*Password must be min 8 letter password, with at least a symbol, a letter and a number.";
    }

    if (!contact_no.trim()) {
      formIsValid = false;
      errors["contact_no"] = "*Please enter contact no.";
    }
    
    if (contact_no.length>10) {
      formIsValid = false;
      errors["contact_no"] = "*Please enter valid 10 digit contact no.";
    }
    if(isNaN(contact_no)) {
      formIsValid = false;
      errors["contact_no"] = "*Contact No should be in numeric value.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }


  render() {
    const { username, email, password, contact_no, status } = this.state;
    console.log(this.state.photo)
    return (
      <>
        <Helmet>
          <title>Add User</title>
        </Helmet>
        <Layout title="Add User">
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-8">
                {/* Overflow Hidden */}
                <div className="card mb-4">
                  <div className="card-header py-3">
                   
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.onSubmit}>
                      <div className="form-group">
                        <label>Photo</label>
                        <div className="col-12 cover-field">
                        <input
                          className="form-control photo-field"
                          type="file"
                          placeholder=""
                          name="photo"
                          style={{position:"absolute",left:"40%",border:"0px",top:"1px",outline:"none"}}
                          onChange={this.handleInputChange}
                        />
                        </div>
                        {this.state.photo &&
                          <p>File Size: {Math.round(this.state.photo.size/1024)}Kb</p>
                        }
                        <div className="text-danger">
                          {this.state.errors.photo}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>*Username</label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder=""
                          name="username"
                          onChange={this.handleInputChange}
                          value={username}
                        />
                        <div className="text-danger">
                          {this.state.errors.username}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>*Email</label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder=""
                          name="email"
                          onChange={this.handleInputChange}
                          value={email}
                        />
                        <div className="text-danger">
                          {this.state.errors.email}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>*Password</label>
                        <input
                          className="form-control"
                          type="password"
                          placeholder=""
                          name="password"
                          onChange={this.handleInputChange}
                          value={password}
                        />
                        <div className="text-danger">
                          {this.state.errors.password}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>*Contact No</label>
                        <input
                          className="form-control"
                          type="number"
                          placeholder=""
                          name="contact_no"
                          onChange={this.handleInputChange}
                          value={contact_no}
                        />
                        <div className="text-danger">
                          {this.state.errors.contact_no}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Status</label>
                        <select
                          className="form-control"
                          name="status"
                          onChange={this.handleInputChange}
                          value={status}
                        >
                          <option value="1">Enable</option>
                          <option value="2">Disable</option>
                        </select>
                        <div className="text-danger">
                          {this.state.errors.status}
                        </div>
                      </div>

                      <button className="btn btn-primary" type="submit" style={{marginRight:"5rem",float:"right"}}>
                        Save
                      </button>{" "}
                      <Link
                        to="/user-list"
                        className="btn btn-outline-secondary"
                      style={{position:"absolute",right:"0px",marginRight:"1rem"}}>
                        Cancel
                      </Link>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }
}

const mapStateToProps = state => ({ alert: state.alert });
const mapDispatchToProps = {
  addUser
};
export default connect(mapStateToProps,mapDispatchToProps)(AddUser);