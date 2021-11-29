import {
  GET_LOST_REPORTS,
} from "../actions/types";

const initialState = { lost_report_list: [], single: null, pagination: null };

const reasonsReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_LOST_REPORTS:
      return { ...state, lost_report_list: payload.data, pagination:payload.pagination };

    default:
      return state;
  }
};

export default reasonsReducer;
