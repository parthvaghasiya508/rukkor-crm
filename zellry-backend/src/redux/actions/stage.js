import axios from "axios";

import {
  API_URL,
  ADD_STAGE,
  UPDATE_STAGE,
  GET_STAGES,
  GET_STAGE,
  DELETE_STAGE
} from "./types";
import { setAlert } from './alert';

// Get Stages
export const getStages = () => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/stages`);
    dispatch({ type: GET_STAGES, payload: res.data.stages });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Stage
export const addStage = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/stage/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_STAGE, payload: res.data.stage });
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

// Get Single Stage
export const getStage = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/stage/${param._id}`);
      dispatch({ type: GET_STAGE, payload: res.data.stage });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Stage
export const deleteStage = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/stage/delete/${id}`);
    dispatch({ type: DELETE_STAGE, payload: id });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Stage
export const updateStage = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/stage/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_STAGE, payload: res.data.stage });
      // dispatch(setAlert(res.data.msg, 'success'));
      // props.history.push('/configuration');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Change Stage Position
export const changeStagePosition = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/stage/changePosition`, formData, config);
    dispatch({ type: GET_STAGES, payload: res.data.stages });
    props.history.push('/configuration');
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Change Field Position
export const changeFieldPosition = (formData,config) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/field/changePosition`, formData, config);
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};