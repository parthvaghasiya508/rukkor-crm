import axios from "axios";

import {
  API_URL,
  GET_LOST_REPORTS
} from "./types";
import { setAlert } from './alert';

// Get All Lost Reports
export const getLostReports = (param) => async (dispatch) => {
  try {
    let query = [];
    if(param){
      for (const key in param) {
        if (param.hasOwnProperty(key)) {
          query.push(`${key}=${param[key]}`);        
        }
      }
    }
    query = query.join(`&`);
    const res = await axios.get(`${API_URL}/admin/report/lostDealReport?${query}`);
    dispatch({
      type: GET_LOST_REPORTS,
      payload: { data: res.data.reports, pagination: res.data.pagination },
    });
  } catch (err) {
    dispatch(setAlert(err.message, "danger"));
  }
};