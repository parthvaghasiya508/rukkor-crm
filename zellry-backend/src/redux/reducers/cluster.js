import {
  ADD_CLUSTER,
  GET_CLUSTERS,
  GET_CLUSTER,
  UPDATE_CLUSTER,
  DELETE_CLUSTER,
} from "../actions/types";

const initialState = { list: [], single: null, pagination: null };

const clustersReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_CLUSTERS:
      return { ...state, list: payload.data, pagination:payload.pagination };

    case ADD_CLUSTER:
      return {
        ...state,
        list: [...state.list, payload],
      };

    case GET_CLUSTER:
      return { ...state, single: payload };

    case DELETE_CLUSTER:
      return {
        ...state,
        // list: state.list.filter((cluster) => cluster._id !== payload),
        list: payload.data,
        pagination:payload.pagination
      };

    case UPDATE_CLUSTER:
      return {
        ...state,
        list: state.list.map((cluster) =>
          cluster._id === payload._id ? payload : cluster
        ),
      };

    default:
      return state;
  }
};

export default clustersReducer;
