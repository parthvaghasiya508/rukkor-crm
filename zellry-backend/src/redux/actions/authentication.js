import axios from "axios";
import {
  AUTH_LOGIN,AUTH_LOGOUT,AUTH_ERROR,API_URL,UPDATE_PROFILE,GET_PROFILE
} from "./types";

import { login,update_profile,logout } from "../../utils/auth";
import { setAlert } from './alert';


// User Login
export const authLogin = (props,userCrential) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/login`,userCrential);
    if(res.data.success){
      let user = { user:res.data.user, token:res.data.token };
      login(user);
      dispatch({ type: AUTH_LOGIN, payload: user });
      dispatch(setAlert('Login Success', 'success'));
      props.history.push('/user-list');
    }
    else{
      dispatch({ type: AUTH_ERROR, payload: res.data.msg });
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch({ type: AUTH_ERROR, payload: err.message });
    dispatch(setAlert(err.message, 'danger'));
  }
};


// User Logout
export const authLogout = () => async (dispatch) => {
  try {
    logout();
    dispatch({ type: AUTH_LOGOUT,payload:'' });
    dispatch(setAlert('Logout done', 'success'));
  } catch (err) {
    dispatch({ type: AUTH_ERROR, payload: err.message });
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Profile
export const updateProfile = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/updateProfile`, formData, config);
    if(res.data.success){
      update_profile(res.data.user);
      dispatch({ type: UPDATE_PROFILE, payload: res.data.user });
      dispatch(setAlert(res.data.msg, 'success'));
      // props.history.push('/user-list');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Password
export const changePassword = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/changePassword`, formData, config);
    if(res.data.success){
      dispatch(setAlert(res.data.msg, 'success'));
      // props.history.push('/profile');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Send Reset Link
export const sendResetLink = (formData,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/sendResetLink`,formData);
    if(res.data.success){
      dispatch(setAlert(res.data.msg, 'success'));
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch({ type: AUTH_ERROR, payload: err.message });
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Reset New Password
export const resetPassword = (formData,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/resetPassword`,formData);
    if(res.data.success){
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push("/login");
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch({ type: AUTH_ERROR, payload: err.message });
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Profile
export const getProfile = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/getProfile`, formData, config);
    if(res.data.success){
      update_profile(res.data.user);
      dispatch({ type: GET_PROFILE, payload: res.data.user });
      // dispatch(setAlert(res.data.msg, 'success'));
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};