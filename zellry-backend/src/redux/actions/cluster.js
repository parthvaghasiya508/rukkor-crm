import axios from "axios";

import {
  API_URL,
  ADD_CLUSTER,
  UPDATE_CLUSTER,
  GET_CLUSTERS,
  GET_CLUSTER,
  DELETE_CLUSTER
} from "./types";
import { setAlert } from './alert';

// Get Clusters
export const getClusters = (current_page=1, search_keyword=null) => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/clusters?current_page=${current_page}&search_keyword=${search_keyword}`);
    dispatch({ type: GET_CLUSTERS, payload: { data:res.data.clusters, pagination:res.data.pagination } });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get All Clusters
export const getAllClusters = (limit='') => async (dispatch) => {
  try {
    const res = await axios.get(`${API_URL}/admin/all_clusters?limit=${limit}`);
    dispatch({ type: GET_CLUSTERS, payload: { data:res.data.clusters} });
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Add Cluster
export const addCluster = (formData,config, props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/cluster/add`, formData, config);
    if(res.data.success){
      dispatch({ type: ADD_CLUSTER, payload: res.data.cluster });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/clusters');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Get Single Cluster
export const getCluster = (param) => async (dispatch) => {
    try {
      const res = await axios.get(`${API_URL}/admin/cluster/${param._id}`);
      dispatch({ type: GET_CLUSTER, payload: res.data.cluster });
      // dispatch(setAlert(res.data.msg, 'success'));
    } catch (err) {
      dispatch(setAlert(err.message, 'danger'));
    }
  };

// Delete Cluster
export const deleteCluster = (id,props) => async (dispatch) => {
  try {
    const res = await axios.delete(`${API_URL}/admin/cluster/delete/${id}`);
    dispatch({ type: DELETE_CLUSTER, payload: { data:res.data.clusters, pagination:res.data.pagination } });
    dispatch(setAlert(res.data.msg, 'success'));
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};

// Update Cluster
export const updateCluster = (formData,config,props) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_URL}/admin/cluster/update`, formData, config);
    if(res.data.success){
      dispatch({ type: UPDATE_CLUSTER, payload: res.data.cluster });
      dispatch(setAlert(res.data.msg, 'success'));
      props.history.push('/clusters');
    }
    else{
      dispatch(setAlert(res.data.msg, 'warning'));
    }   
  } catch (err) {
    dispatch(setAlert(err.message, 'danger'));
  }
};
