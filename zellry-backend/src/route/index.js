import { Switch,Route } from "react-router-dom";

import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";

import Login from "../components/Login";
import ForgotPassword from "../components/ForgotPassword";
import ResetPassword from "../components/ResetPassword";
import Dashboard from "../components/Dashboard";

import AddUser from "../components/AddUser";
import UserList from "../components/UserList";
import EditUser from "../components/EditUser";

import Configuration from "../components/Configurations";
import Profile from "../components/Profile";

import AddCountry from "../components/AddCountry";
import Countries from "../components/Countries";
import EditCountry from "../components/EditCountry";


import Industries from "../components/Industries";
import AddIndustry from "../components/AddIndustry";
import EditIndustry from "../components/EditIndustry";


import Clusters from "../components/Clusters";
import AddCluster from "../components/AddCluster";
import EditCluster from "../components/EditCluster";

import Reasons from "../components/Reasons";
import AddReason from "../components/AddReason";
import EditReason from "../components/EditReason";

import Reports from "../components/Reports";

import Dnd from "../components/Dnd_v1";


import NotFound from "../components/PageNotFound";

function AppRouter() {
  return (
      <Switch>
        <PublicRoute exact path="/DND" component={Dnd} />
        <PublicRoute restricted={true} exact path='/' component={Login} />
        <PublicRoute restricted={true} path="/login" component={Login} />
        <PublicRoute restricted={true} path="/forgot-password" component={ForgotPassword} />
        <PublicRoute restricted={true} path="/reset-password/:token" component={ResetPassword} />
        <PrivateRoute path="/dashboard" component={Dashboard} />
        <PrivateRoute path="/add-user" component={AddUser} />
        <PrivateRoute path="/user-list" component={UserList} />
        <PrivateRoute path="/edit-user/:id" component={EditUser} />
        <PrivateRoute path="/countries" component={Countries} />
        <PrivateRoute path="/add-country" component={AddCountry} />
        <PrivateRoute path="/edit-country/:id" component={EditCountry} />
        <PrivateRoute path="/industries" component={Industries} />
        <PrivateRoute path="/add-industry" component={AddIndustry} />
        <PrivateRoute path="/edit-industry/:id" component={EditIndustry} />
        <PrivateRoute path="/clusters" component={Clusters} />
        <PrivateRoute path="/add-cluster" component={AddCluster} />
        <PrivateRoute path="/edit-cluster/:id" component={EditCluster} />
        <PrivateRoute path="/configuration" component={Configuration} />
        <PrivateRoute path="/profile" component={Profile} />
        <PrivateRoute path="/reasons" component={Reasons} />
        <PrivateRoute path="/add-reason" component={AddReason} />
        <PrivateRoute path="/edit-reason/:id" component={EditReason} />
        <PrivateRoute path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
  );
}

export default AppRouter;
