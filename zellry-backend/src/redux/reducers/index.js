import { combineReducers } from "redux";

import user from "./user";
import country from "./country";
import industry from "./industry";
import cluster from "./cluster";
import stage from "./stage";
import organisation from "./organisation";
import contact from "./contact";
import deal from "./deal";
import auth from "./authentication";
import alert from './alert';
import reason from './reason';
import report from './report';

const appReducer = combineReducers({
  user,
  auth,
  alert,
  country,
  industry,
  cluster,
  stage,
  organisation,
  contact,
  deal,
  reason,
  report
})

const rootReducer = (state, action) => {
  if (action.type === 'AUTH_LOGOUT') {
    return appReducer(undefined, action)
  }
  return appReducer(state, action)
}

export default rootReducer;

// export default combineReducers({
//   user,
//   auth,
//   alert,
//   country,
//   industry,
//   cluster,
//   stage,
//   organisation,
//   contact,
//   deal,
//   reason,
//   report
// });
