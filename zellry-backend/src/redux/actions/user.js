import axios from "axios";

import {
  API_URL,
  ADD_USER,
  UPDATE_USER,
  GET_USERS,
  GET_USER,
  DELETE_USER
} from "./types";
import { setAlert } from './alert';

// Get Users
export const getUsers = (current_page=1, search_keyword=null) => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/users?current_page=${current_page}&search_keyword=${search_keyword}`);
    dispatch({ type: GET_USERS, payload: { data:res.data.users, pagination:res.data.pagination } });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Users
export const getAllUsers = () => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/users/all`);
    dispatch({ type: GET_USERS, payload: { data:res.data.users, pagination:null } });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add User
export const addUser = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/user/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_USER, payload: res.data.user });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/user-list');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Single User
export const getUser = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/user/${param.user_id}`);
      dispatch({ type: GET_USER, payload: res.data.user });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete User
export const deleteUser = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/user/delete/${id}`);
    dispatch({ type: DELETE_USER, payload: { data:res.data.users, pagination:res.data.pagination } });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update User
export const updateUser = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/user/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_USER, payload: res.data.user });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/user-list');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
