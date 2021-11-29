import React, { Component } from "react";
import { Link } from "react-router-dom";
import Layout from "./layout";
import { Helmet } from "react-helmet-async";

import { addIndustry } from "../redux/actions/industry";
import { connect } from "react-redux";

export class AddIndustry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "",
      status: 1,
      errors: {},
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  handleInputChange(event) {
    const { type, name, value, files } = event.target;
    if (type === "file") {
      this.setState({
        [name]: files[0],
      });
    } else {
      this.setState({
        [name]: value,
      });
    }
  }

  // Submit
  onSubmit = (e) => {
    e.preventDefault();

    if (this.validateForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const { title, status } = this.state;

      var formData = {
        user: current_user,
        title,
        status,
      };

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      this.props.addIndustry(formData, config, this.props);
    }
  };

  validateForm() {
    const { title } = this.state;

    let errors = {};
    let formIsValid = true;

    if (!title.trim()) {
      formIsValid = false;
      errors["title"] = "*Please enter title.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }
  render() {
    const { title, status } = this.state;
    return (
      <>
        <Helmet>
          <title>Add Industry</title>
        </Helmet>
        <Layout title="Add Industry">
          <div className="container-fluid">
            {/* Page Heading */}
            {/* <h1 className="h3 mb-1 text-gray-800"> Add User </h1>
            <p className="mb-4">Add User Personal Detail</p> */}
            {/* Content Row */}
            <div className="row">
              <div className="col-lg-8">
                {/* Overflow Hidden */}
                <div className="card mb-4">
                  <div className="card-header py-3">
                  
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.onSubmit}>
                      <div className="form-group">
                        <label>*Title</label>
                        <input
                          className="form-control"
                          type="text"
                          placeholder=""
                          name="title"
                          onChange={this.handleInputChange}
                          value={title}
                        />
                        <div className="text-danger">
                          {this.state.errors.title}
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
                        to="/industries"
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

const mapStateToProps = (state) => ({
  alert: state.alert,
  auth_user: state.auth.user,
});
const mapDispatchToProps = {
  addIndustry,
};
export default connect(mapStateToProps, mapDispatchToProps)(AddIndustry);
