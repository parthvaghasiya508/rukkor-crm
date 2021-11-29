import {
  ADD_COUNTRY,
  GET_COUNTRIES,
  GET_COUNTRY,
  UPDATE_COUNTRY,
  DELETE_COUNTRY,
} from "../actions/types";

const initialState = { list: [], single: null, pagination: null };

const countriesReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_COUNTRIES:
      return { ...state, list: payload.data, pagination:payload.pagination };

    case ADD_COUNTRY:
      return {
        ...state,
        list: [...state.list, payload],
        pagination: null
      };

    case GET_COUNTRY:
      return { ...state, single: payload, pagination: null };

    case DELETE_COUNTRY:
      return {
        ...state,
        // list: state.list.filter((country) => country._id !== payload.id),
        list: payload.data,
        pagination:payload.pagination
      };

    case UPDATE_COUNTRY:
      return {
        ...state,
        list: state.list.map((country) =>
          country._id === payload._id ? payload : country
        ),
      };

    default:
      return state;
  }
};

export default countriesReducer;
