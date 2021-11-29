import axios from "axios";

import {
  API_URL,
  ADD_INDUSTRY,
  UPDATE_INDUSTRY,
  GET_INDUSTRIES,
  GET_INDUSTRY,
  DELETE_INDUSTRY
} from "./types";
import { setAlert } from './alert';

// Get Industries
export const getIndustries = (current_page=1, search_keyword=null) => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/industries?current_page=${current_page}&search_keyword=${search_keyword}`);
    dispatch({ type: GET_INDUSTRIES, payload: { data:res.data.industries, pagination:res.data.pagination } });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get All Industries
export const getAllIndustries = (limit='') => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/all_industries?limit=${limit}`);
    dispatch({ type: GET_INDUSTRIES, payload: { data:res.data.industries} });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Industry
export const addIndustry = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/industry/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_INDUSTRY, payload: res.data.industry });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/industries');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Single Industry
export const getIndustry = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/industry/${param._id}`);
      dispatch({ type: GET_INDUSTRY, payload: res.data.industry });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Industry
export const deleteIndustry = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/industry/delete/${id}`);
    dispatch({ type: DELETE_INDUSTRY, payload: { data:res.data.industries, pagination:res.data.pagination } });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Industry
export const updateIndustry = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/industry/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_INDUSTRY, payload: res.data.industry });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/industries');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
