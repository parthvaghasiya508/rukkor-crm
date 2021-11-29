import {
  ADD_REASON,
  GET_REASONS,
  GET_REASON,
  UPDATE_REASON,
  DELETE_REASON,
} from "../actions/types";

const initialState = { list: [], single: null, pagination: null };

const reasonsReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_REASONS:
      return { ...state, list: payload.data, pagination:payload.pagination };

    case ADD_REASON:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_REASON:
      return { ...state, single: payload, pagination: null };

    case DELETE_REASON:
      return {
        ...state,
        // list: state.list.filter((reason) => reason._id !== payload),
        list: payload.data,
        pagination:payload.pagination
      };

    case UPDATE_REASON:
      return {
        ...state,
        list: state.list.map((reason) =>
          reason._id === payload._id ? payload : reason
        ),
      };

    default:
      return state;
  }
};

export default reasonsReducer;
