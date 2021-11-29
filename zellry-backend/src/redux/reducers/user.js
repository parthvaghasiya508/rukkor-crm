import {
  ADD_USER,
  GET_USERS,
  GET_USER,
  UPDATE_USER,
  DELETE_USER,
} from "../actions/types";

const initialState = { list: [], single: null, pagination: null };

const usersReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_USERS:
      return { ...state, list: payload.data, pagination:payload.pagination };

    case ADD_USER:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_USER:
      return { ...state, single: payload, pagination: null };

    case DELETE_USER:
      return {
        ...state,
        // list: state.list.filter((user) => user._id !== payload),
        list: payload.data,
        pagination:payload.pagination
      };

    case UPDATE_USER:
      return {
        ...state,
        list: state.list.map((user) =>
          user._id === payload._id ? payload : user
        ),
      };

    default:
      return state;
  }
};

export default usersReducer;
