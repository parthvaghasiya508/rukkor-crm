import {
  ADD_DEAL,
  GET_DEALS,
  GET_DEAL,
  UPDATE_DEAL,
  DELETE_DEAL,
} from "../actions/types";

const initialState = { list: [], single: null };

const dealsReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_DEALS:
      return { ...state, list: payload };

    case ADD_DEAL:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_DEAL:
      return { ...state, single: payload };

    case DELETE_DEAL:
      return {
        ...state,
        list: state.list.filter((deal) => deal._id !== payload),
      };

    case UPDATE_DEAL:
      return {
        ...state,
        list: state.list.map((deal) =>
          deal._id === payload._id ? payload : deal
        ),
      };

    default:
      return state;
  }
};

export default dealsReducer;
