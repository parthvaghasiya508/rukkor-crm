import {
  ADD_ORGANISATION,
  GET_ORGANISATIONS,
  GET_ORGANISATION,
  UPDATE_ORGANISATION,
  DELETE_ORGANISATION,
} from "../actions/types";

const initialState = { list: [], single: null };

const organisationsReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_ORGANISATIONS:
      return { ...state, list: payload };

    case ADD_ORGANISATION:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_ORGANISATION:
      return { ...state, single: payload };

    case DELETE_ORGANISATION:
      return {
        ...state,
        list: state.list.filter((organisation) => organisation._id !== payload),
      };

    case UPDATE_ORGANISATION:
      return {
        ...state,
        list: state.list.map((organisation) =>
          organisation._id === payload._id ? payload : organisation
        ),
      };

    default:
      return state;
  }
};

export default organisationsReducer;
