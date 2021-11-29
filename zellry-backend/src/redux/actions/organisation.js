import axios from "axios";

import {
  API_URL,
  ADD_ORGANISATION,
  UPDATE_ORGANISATION,
  GET_ORGANISATIONS,
  GET_ORGANISATION,
  DELETE_ORGANISATION
} from "./types";
import { setAlert } from './alert';

// Get Organisations
export const getOrganisations = () => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/organisations`);
    dispatch({ type: GET_ORGANISATIONS, payload: res.data.organisations });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Organisation
export const addOrganisation = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/organisation/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_ORGANISATION, payload: res.data.organisation });
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

// Get Single Organisation
export const getOrganisation = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/organisation/${param._id}`);
      dispatch({ type: GET_ORGANISATION, payload: res.data.organisation });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Organisation
export const deleteOrganisation = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/organisation/delete/${id}`);
    dispatch({ type: DELETE_ORGANISATION, payload: id });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Organisation
export const updateOrganisation = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/organisation/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_ORGANISATION, payload: res.data.organisation});
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
