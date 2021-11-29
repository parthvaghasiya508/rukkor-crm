import axios from "axios";

import {
  API_URL,
  ADD_CONTACT,
  UPDATE_CONTACT,
  GET_CONTACTS,
  GET_CONTACT,
  DELETE_CONTACT
} from "./types";
import { setAlert } from './alert';

// Get Contacts
export const getContacts = () => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/contacts`);
    dispatch({ type: GET_CONTACTS, payload: res.data.contacts });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Contact
export const addContact = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/contact/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_CONTACT, payload: res.data.contact });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/configuration');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Single Contact
export const getContact = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/contact/${param._id}`);
      dispatch({ type: GET_CONTACT, payload: res.data.contact });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Contact
export const deleteContact = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/contact/delete/${id}`);
    dispatch({ type: DELETE_CONTACT, payload: id });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Contact
export const updateContact = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/contact/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_CONTACT, payload: res.data.contact });
      dispatch(setAlert(res.data.msg, 'success'));
      
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
