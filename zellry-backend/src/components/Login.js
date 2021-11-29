import React, { useState,  useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { authLogin } from "../redux/actions/authentication";
import Alert from "./Alert";
import { Helmet } from "react-helmet-async";

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin_remember_me, setRemember] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if(localStorage.getItem('admin_remember_me') && localStorage.getItem('admin_email') !== ""){
      setEmail(localStorage.getItem('admin_email'));
      setPassword(localStorage.getItem('admin_password'));
      setRemember(localStorage.getItem('admin_remember_me') ? true : false);
    }    
    return () => {      
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {

      if(admin_remember_me){
        localStorage.setItem('admin_remember_me', admin_remember_me);
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_password', password);
      }
      else{
        localStorage.removeItem('admin_remember_me');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_password');
      }
      var login_data = { email, password };
      props.authLogin(props, login_data);
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

    if (!password.trim()) {
      formIsValid = false;
      errors["password"] = "*Please enter password.";
    }

    setErrors(errors);
    return formIsValid;
  }

  return (
    <>
      <Helmet>
        <title>Login</title>
      </Helmet>

      <div className="container">
        {/* Outer Row */}
        <div className="row justify-content-center">
          <div className="col-xl-10 col-lg-12 col-md-9">
            <div className="card o-hidden border-0 shadow-lg my-5">
              <div className="card-body p-0">
                {/* Nested Row within Card Body */}
                <div className="row">
                  <div className="col-lg-6 d-none d-lg-block bg-login-image" />
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
                        <h1 className="h4 text-gray-900 mb-3">Welcome Back!</h1>
                        <Alert />
                      </div>
                      <form
                        className="user"
                        onSubmit={(e) => {
                          handleSubmit(e);
                        }}
                      >
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control form-control-user"
                            id="exampleInputEmail"
                            aria-describedby="emailHelp"
                            placeholder="Enter Email Address..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <div className="text-danger">
                            {errors.email}
                          </div>
                        </div>
                        <div className="form-group">
                          <input
                            type="password"
                            className="form-control form-control-user"
                            id="exampleInputPassword"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <div className="text-danger">
                            {errors.password}
                          </div>
                        </div>
                        <div className="form-group">
                        <label className="checkbox-label">
                          <input 
                            type="checkbox"
                            checked={admin_remember_me}
                            onChange={(e) => setRemember(e.target.checked)}
                          />
                          <span className="geekmark" />  Remember Me
                        </label>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-user btn-block"
                        >
                          Login
                        </button>
                      </form>
                      <hr />
                      <div className="text-center">
                        <Link className="small" to="/forgot-password">
                          Forgot Password?
                        </Link>
                      </div>
                      <div className="text-center">
                       
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

export default connect(null, { authLogin })(Login);
