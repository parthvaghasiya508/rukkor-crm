import React, { useState } from "react";
import { connect } from "react-redux";
import { resetPassword } from "../redux/actions/authentication";
import Alert from "./Alert";
import { Helmet } from "react-helmet-async";

function ResetPassword(props) {
  const [new_password, setNewPwd] = useState("");
  const [confirm_new_password, setConfirmPwd] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      var formData = {
        reset_password_token: props.match.params.token,
        new_password,
        confirm_new_password,
      };
      props.resetPassword(formData, props);
      setNewPwd("");
      setConfirmPwd("");
    }
  };

  const validateForm = () => {
    let errors = {};
    let formIsValid = true;
    var password_match = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;

    if (!new_password.trim()) {
      formIsValid = false;
      errors["new_password"] = "*Please enter new password.";
    } else if (!password_match.test(new_password)) {
      formIsValid = false;
      errors["new_password"] =
        "*New password must be min 8 letter password, with at least a symbol, a letter and a number.";
    }

    if (!confirm_new_password.trim()) {
      formIsValid = false;
      errors["confirm_new_password"] = "*Please enter confirm new password.";
    }

    setErrors(errors);
    return formIsValid;
  };

  return (
    <>
      <Helmet>
        <title>Reset Password</title>
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
                        <h1 className="h4 text-gray-900 mb-4">
                          Reset Password
                        </h1>
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
                            type="password"
                            className="form-control form-control-user"
                            id="exampleInputPassword"
                            placeholder="New Password"
                            value={new_password}
                            onChange={(e) => setNewPwd(e.target.value)}
                          />
                          <div className="text-danger">
                            {errors.new_password}
                          </div>
                        </div>

                        <div className="form-group">
                          <input
                            type="password"
                            className="form-control form-control-user"
                            id="exampleInputPassword"
                            placeholder="Confirm New Password"
                            value={confirm_new_password}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                          />
                          <div className="text-danger">
                            {errors.confirm_new_password}
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn btn-primary btn-user btn-block"
                        >
                          Update Password
                        </button>
                      </form>

                      <div className="text-center" />
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

const mapStateToProps = (state) => ({});
const mapDispatchToProps = {
  resetPassword,
};
export default connect(mapStateToProps, mapDispatchToProps)(ResetPassword);
