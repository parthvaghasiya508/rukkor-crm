import {
  ADD_CONTACT,
  GET_CONTACTS,
  GET_CONTACT,
  UPDATE_CONTACT,
  DELETE_CONTACT,
} from "../actions/types";

const initialState = { list: [], single: null };

const contactsReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_CONTACTS:
      return { ...state, list: payload };

    case ADD_CONTACT:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_CONTACT:
      return { ...state, single: payload };

    case DELETE_CONTACT:
      return {
        ...state,
        list: state.list.filter((contact) => contact._id !== payload),
      };

    case UPDATE_CONTACT:
      return {
        ...state,
        list: state.list.map((contact) =>
          contact._id === payload._id ? payload : contact
        ),
      };

    default:
      return state;
  }
};

export default contactsReducer;
