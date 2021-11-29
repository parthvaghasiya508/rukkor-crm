import {
  ADD_INDUSTRY,
  GET_INDUSTRIES,
  GET_INDUSTRY,
  UPDATE_INDUSTRY,
  DELETE_INDUSTRY,
} from "../actions/types";

const initialState = { list: [], single: null, pagination: null };

const industriesReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_INDUSTRIES:
      return { ...state, list: payload.data, pagination:payload.pagination };

    case ADD_INDUSTRY:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_INDUSTRY:
      return { ...state, single: payload, pagination: null };

    case DELETE_INDUSTRY:
      return {
        ...state,
        // list: state.list.filter((industry) => industry._id !== payload),
        list: payload.data,
        pagination:payload.pagination
      };

    case UPDATE_INDUSTRY:
      return {
        ...state,
        list: state.list.map((industry) =>
          industry._id === payload._id ? payload : industry
        ),
      };

    default:
      return state;
  }
};

export default industriesReducer;
