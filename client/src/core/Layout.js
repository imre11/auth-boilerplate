import React, { Fragment } from "react";
import { Link, withRouter } from "react-router-dom";
import { isAuth, signout } from "../auth/helpers";

const Layout = ({ children, match, history }) => {
  const getClass = (path) => {
    let className = "nav-link text-light";
    if (match.path === path) {
      className = "nav-link text-dark active";
    }
    return className;
  };

  const nav = () => (
    <ul className="nav nav-tabs bg-primary">
      <li className="nav-item">
        <Link to="/" className={getClass("/")}>
          Home
        </Link>
      </li>
      {!isAuth() && (
        <Fragment>
          <li className="nav-item">
            <Link to="/signin" className={getClass("/signin")}>
              Signin
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/signup" className={getClass("/signup")}>
              Signup
            </Link>
          </li>
        </Fragment>
      )}

      {isAuth() && (
        <li className="nav-item">
          <Link
            to="/signin"
            className={getClass("/signin")}
            onClick={() => {
              signout(() => {
                history.push("/");
              });
            }}
          >
            Signout
          </Link>
        </li>
      )}

      {isAuth() && isAuth().role === "admin" && (
        <li className="nav-item">
          <Link className={getClass("/admin")} to="/admin">
            Admin
          </Link>
        </li>
      )}

      {isAuth() && isAuth().role === "subscriber" && (
        <li className="nav-item">
          <Link className={getClass("/user")} to="/user">
            User Home
          </Link>
        </li>
      )}

      {isAuth() && (
        <li className="nav-item">
          <Link className={getClass("/private")} to="/private">
            {isAuth().name}
          </Link>
        </li>
      )}
    </ul>
  );

  return (
    <Fragment>
      {nav()}
      <div className="container">{children}</div>
    </Fragment>
  );
};

export default withRouter(Layout);
