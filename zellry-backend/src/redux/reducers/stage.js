import {
  ADD_STAGE,
  GET_STAGES,
  GET_STAGE,
  UPDATE_STAGE,
  DELETE_STAGE,
} from "../actions/types";

const initialState = { list: [], single: null };

const stagesReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_STAGES:
      return { ...state, list: payload };

    case ADD_STAGE:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_STAGE:
      return { ...state, single: payload };

    case DELETE_STAGE:
      return {
        ...state,
        list: state.list.filter((stage) => stage._id !== payload),
      };

    case UPDATE_STAGE:
      return {
        ...state,
        list: state.list.map((stage) =>
          stage._id === payload._id ? payload : stage
        ),
      };

    default:
      return state;
  }
};

export default stagesReducer;
