import axios from "axios";

import {
  API_URL,
  ADD_COUNTRY,
  UPDATE_COUNTRY,
  GET_COUNTRIES,
  GET_COUNTRY,
  DELETE_COUNTRY
} from "./types";
import { setAlert } from './alert';

// Get Countries
export const getCountries = (current_page=1, search_keyword=null) => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/countries?current_page=${current_page}&search_keyword=${search_keyword}`);
    dispatch({ type: GET_COUNTRIES, payload: { data:res.data.countries, pagination:res.data.pagination } });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get All Countries
export const getAllCountries = (limit='') => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/all_countries?limit=${limit}`);
    dispatch({ type: GET_COUNTRIES, payload: { data:res.data.countries} });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Country
export const addCountry = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/country/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_COUNTRY, payload: res.data.country });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/countries');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Single Country
export const getCountry = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/country/${param._id}`);
      dispatch({ type: GET_COUNTRY, payload: res.data.country });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Country
export const deleteCountry = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/country/delete/${id}`);
    dispatch({ type: DELETE_COUNTRY, payload: { data:res.data.countries, pagination:res.data.pagination } });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Country
export const updateCountry = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/country/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_COUNTRY, payload: res.data.country });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/countries');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
