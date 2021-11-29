import React, { Component, createRef } from "react";
import Layout from "./layout";
import  {Helmet } from 'react-helmet-async';
import { updateProfile,changePassword, getProfile } from '../redux/actions/authentication';
import { connect } from "react-redux";

export class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      photo: "",
      username: "",
      email: "",
      old_password:"",
      new_password:"",
      cnew_password:"",
      errors: {},
      inputKey: Date.now()
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.fileInput = createRef();
    this.resetPassword = this.resetPassword.bind(this);    
  }

  componentDidMount = async () => {
    // this.getProfile();
    var auth_user = (this.props.auth_user) ? this.props.auth_user : "" ;
    var current_user = (auth_user && auth_user._id) ? auth_user._id : "";
    let formData = {
      _id:current_user
    };
    const config = {
      headers: {
        "content-type": "application/json",
      },
    };
    this.props.getProfile(formData,config);
    // this.setState({ username:auth_user.username, email:auth_user.email });
  };
  componentDidUpdate = async(prevProps) => {
    if ( this.props.auth_user !== prevProps.auth_user ) {
      var auth_user = (this.props.auth_user) ? this.props.auth_user : "" ;
      this.setState({ username:auth_user.username, email:auth_user.email });
    }
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
  onSubmit = async (e) => {
    e.preventDefault();
    if (this.validateForm()) {
      const { username, email, photo } = this.state;
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      
      const formData = new FormData();
      formData.append("_id", current_user);
      formData.append("photo", photo);
      formData.append("username", username);
      formData.append("email", email);
      const config = {
        headers: {
          "content-type": "multipart/form-data",
        },
      };
      await this.props.updateProfile(formData, config, this.props);
      this.fileInput.current.value = '';
      this.setState({
        photo: null,
        // inputKey: Date.now()
      });
      // this.getProfile();
    }
  };


  // Change Password Submit
  onSubmit2 = (e) => {
    e.preventDefault();

    if (this.validateForm2()) {
      const { old_password, new_password, cnew_password } = this.state;
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      
      const formData = { current_user,old_password,new_password,cnew_password };
      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      this.props.changePassword(formData, config, this.props);
      this.setState({ old_password : '', new_password : '', cnew_password : '' });
    }
  };

  validateForm() {
    const { username, email, photo } = this.state;

    let errors = {};
    let formIsValid = true;

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

    if (photo && !photo.name.match(/\.(jpg|jpeg|png|gif)$/)) {
      formIsValid = false;
      errors["photo"] = "*Please select valid image.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }

  validateForm2() {
    const { old_password, new_password, cnew_password } = this.state;

    let errors = {};
    let formIsValid = true;
    var password_match = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;

    if (!old_password.trim()) {
      formIsValid = false;
      errors["old_password"] = "*Please enter old password.";
    }

    if (!new_password.trim()) {
      formIsValid = false;
      errors["new_password"] = "*Please enter new password.";
    }
    else if(!password_match.test(new_password)){
      formIsValid = false;
      errors["new_password"] = "*New password must be min 8 letter password, with at least a symbol, a letter and a number.";
    }

    if (!cnew_password.trim()) {
      formIsValid = false;
      errors["cnew_password"] = "*Please enter confirm new password.";
    }

    if (cnew_password.trim() !== new_password.trim()) {
      formIsValid = false;
      errors["cnew_password"] = "*Confirm password and new password must be same.";
    }
   
    this.setState({
      errors: errors,
    });
    return formIsValid;
  }

  resetPassword(event) {
    this.setState({
      old_password:'',
      new_password:'',
      cnew_password:'',
      errors : {}
    });
  }
  render() {
    const { username, email, old_password, new_password, cnew_password } = this.state;
    return (
      <>
        <Helmet>
          <title>Admin Profile</title>
        </Helmet>
        <Layout title="Profile">
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-6">
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
                          // key={this.state.inputKey}
                          placeholder=""
                          name="photo"
                          style={{position:"absolute",left:"40%",border:"0px",top:"1px",outline:"none"}}
                          onChange={this.handleInputChange}
                          ref={this.fileInput}
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
                          type="email"
                          placeholder=""
                          name="email"
                          onChange={this.handleInputChange}
                          value={email}
                        />
                        <div className="text-danger">
                          {this.state.errors.email}
                        </div>
                      </div>
                      <button className="btn btn-primary" type="submit">
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                {/* Overflow Hidden */}
                <div className="card mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">Change Password</h6>
                  </div>
                  <div className="card-body">
                    <form onSubmit={this.onSubmit2}>
                      <div className="form-group">
                        <label>*Old Password</label>
                        <input
                          className="form-control"
                          type="password"
                          placeholder=""
                          name="old_password"
                          value={old_password}
                          onChange={this.handleInputChange}
                        />
                        <div className="text-danger">
                          {this.state.errors.old_password}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>*New Password</label>
                        <input
                          className="form-control"
                          type="password"
                          placeholder=""
                          name="new_password"
                          value={new_password}
                          onChange={this.handleInputChange}
                        />
                        <div className="text-danger">
                          {this.state.errors.new_password}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>*Confirm New Password</label>
                        <input
                          className="form-control"
                          type="password"
                          placeholder=""
                          name="cnew_password"
                          value={cnew_password}
                          onChange={this.handleInputChange}
                        />
                        <div className="text-danger">
                          {this.state.errors.cnew_password}
                        </div>
                      </div>
                      <button className="btn btn-primary" type="submit">
                        Save
                      </button>
                      <button onClick={this.resetPassword} className="btn btn btn-outline-secondary ml-2" type="button">
                        Reset
                      </button>
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

const mapStateToProps = state => ({ user: state.user.single,auth_user: state.auth.user });
const mapDispatchToProps = {
  updateProfile,changePassword,getProfile
};
export default connect(mapStateToProps,mapDispatchToProps)(Profile);
