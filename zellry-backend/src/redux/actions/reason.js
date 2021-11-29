import axios from "axios";

import {
  API_URL,
  ADD_REASON,
  UPDATE_REASON,
  GET_REASONS,
  GET_REASON,
  DELETE_REASON
} from "./types";
import { setAlert } from './alert';

// Get Reasons
export const getReasons = (current_page=1, search_keyword=null) => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/reasons?current_page=${current_page}&search_keyword=${search_keyword}`);
    dispatch({ type: GET_REASONS, payload: { data:res.data.reasons, pagination:res.data.pagination } });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get All Reasons
export const getAllReasons = (limit='') => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/all_reasons?limit=${limit}`);
    dispatch({ type: GET_REASONS, payload: { data:res.data.reasons} });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Reason
export const addReason = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/reason/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_REASON, payload: res.data.reason });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/reasons');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Single Reason
export const getReason = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/reason/${param._id}`);
      dispatch({ type: GET_REASON, payload: res.data.reason });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Reason
export const deleteReason = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/reason/delete/${id}`);
    dispatch({ type: DELETE_REASON, payload: { data:res.data.reasons, pagination:res.data.pagination } });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Reason
export const updateReason = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/reason/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_REASON, payload: res.data.reason });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/reasons');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
