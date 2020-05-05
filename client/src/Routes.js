import React from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import App from "./App";
import Signup from "./auth/Signup";
import Signin from "./auth/Signin";
import Activate from "./auth/Activate";
import Private from "./core/Private";
import Admin from "./core/Admin";
import User from "./core/User";
import PrivateRoute from "./auth/PrivateRoute";
import UserRoute from "./auth/UserRoute";
import AdminRoute from "./auth/AdminRoute";
import Forgot from "./auth/Forgot";
import Reset from "./auth/Reset";

const Routes = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={App} />
        <Route path="/signup" exact component={Signup} />
        <Route path="/signin" exact component={Signin} />
        <Route path="/auth/activate/:token" exact component={Activate} />
        <Route path="/auth/password/forgot" exact component={Forgot} />
        <Route path="/auth/password/reset/:token" exact component={Reset} />
        <PrivateRoute path="/private" component={Private} />
        <UserRoute path="/user" component={User} />
        <AdminRoute path="/admin" component={Admin} />
      </Switch>
    </BrowserRouter>
  );
};

export default Routes;
