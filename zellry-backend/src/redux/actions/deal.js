import axios from "axios";

import {
  API_URL,
  ADD_DEAL,
  UPDATE_DEAL,
  GET_DEALS,
  GET_DEAL,
  DELETE_DEAL
} from "./types";
import { setAlert } from './alert';

// Get Deals
export const getDeals = () => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/deals`);
    dispatch({ type: GET_DEALS, payload: res.data.deals });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Deal
export const addDeal = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/deal/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_DEAL, payload: res.data.deal });
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

// Get Single Deal
export const getDeal = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/deal/${param._id}`);
      dispatch({ type: GET_DEAL, payload: res.data.deal });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Deal
export const deleteDeal = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/deal/delete/${id}`);
    dispatch({ type: DELETE_DEAL, payload: id });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Deal
export const updateDeal = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/deal/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_DEAL, payload: res.data.deal });
      dispatch(setAlert(res.data.msg, 'success'));
     
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
