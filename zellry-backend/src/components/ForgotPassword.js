import React, { useState } from 'react'
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import { connect } from "react-redux";
import { sendResetLink } from "../redux/actions/authentication";
import Alert from "./Alert";


function ForgotPassword(props) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      let formData = { email };
      props.sendResetLink(formData,props);
      // setEmail('');
    }
  };

  const validateForm = () =>{
    let errors = {};
    let formIsValid = true;

    if (!email.trim()) {
      formIsValid = false;
      errors["email"] = "*Please enter email.";
    }
    else if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      formIsValid = false;
      errors["email"] = "*Please enter valid email.";
    }   

    setErrors(errors);
    return formIsValid;
  }
    return (
      <>
        <Helmet>
          <title>Forgot Password</title>
        </Helmet>
        <div className="container">
          {/* Outer Row */}
          <div className="row justify-content-center">
            <div className="col-xl-10 col-lg-12 col-md-9">
              <div className="card o-hidden border-0 shadow-lg my-5">
                <div className="card-body p-0">
                  {/* Nested Row within Card Body */}
                  <div className="row">
                    <div className="col-lg-6 d-none d-lg-block bg-password-image" />
                    <div className="col-lg-6">
                      <div className="p-5">
                        <div className="text-center">
                          <div className="mb-3">
                            <img
                              alt="Logo"
                              src="assets/img/logo.png"
                              style={{ height: "75px" }}
                            />
                          </div>
                          <h1 className="h5 text-gray-900 mb-2">
                            Forgot Your Password?
                          </h1>
                          <p className="mb-3">
                            We are here to help you to recover your password.
                          </p>
                          <Alert />
                        </div>
                        <form className="user" onSubmit={(e) => {
                          handleSubmit(e);
                        }}>
                          <div className="form-group">
                            <input
                              type="email"
                              className="form-control form-control-user"
                              placeholder="Enter Email Address..."
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                            <div className="text-danger">
                              {errors.email}
                            </div>
                          </div>
                          <button className="btn btn-primary btn-user btn-block"
                          >Send Reset Link</button>
                        </form>
                        <hr />
                        <div className="text-center">
                          <Link className="small" to="/login">
                            Already have an account? Login Now.
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
}

const mapStateToProps = state => ({  });
const mapDispatchToProps = {
  sendResetLink
};
export default connect(mapStateToProps,mapDispatchToProps)(ForgotPassword);