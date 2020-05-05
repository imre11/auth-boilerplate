import React, { useState } from "react";
import { Redirect, Link } from "react-router-dom";
import Layout from "../core/Layout";
import axios from "axios";
import { authenticate, isAuth } from "./helpers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import Google from "./Google";
import Facebook from "./Facebook";

const Signin = ({ history }) => {
  const [values, setValues] = useState({
    email: "imre11@gmail.com",
    password: "imre1234",
    buttonText: "Submit"
  });

  const { email, password, buttonText } = values;

  const handleChange = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value });
  };

  const informParent = (response) => {
    authenticate(response, () => {
      setValues({
        ...values,
        email: "",
        password: "",
        buttonText: "Submitted"
      });
      toast.success(`Welcome ${response.data.user.name}`);
      isAuth().role === "admin"
        ? history.push("/admin")
        : history.push("/user");
    });
  };

  const clickSubmit = (event) => {
    event.preventDefault();
    setValues({ ...values, buttonText: "Submitting..." });
    axios({
      method: "POST",
      url: `${process.env.REACT_APP_API}/signin`,
      data: { email, password }
    })
      .then((response) => {
        authenticate(response, () => {
          setValues({
            ...values,
            email: "",
            password: "",
            buttonText: "Submitted"
          });
          toast.success(`Welcome ${response.data.user.name}`);
          isAuth().role === "admin"
            ? history.push("/admin")
            : history.push("/user");
        });
      })
      .catch((error) => {
        setValues({ ...values, buttonText: "Submit" });
        toast.error(error.response.data.error);
      });
  };

  const signinForm = () => (
    <form>
      <div className="form-group">
        <label className="text-muted">Email</label>
        <input
          type="email"
          value={email}
          className="form-control"
          onChange={handleChange("email")}
        />
      </div>
      <div className="form-group">
        <label className="text-muted">Password</label>
        <input
          type="password"
          value={password}
          className="form-control"
          onChange={handleChange("password")}
        />
        <Link to="/auth/password/forgot" className="btn btn-sm">
          Forgotten your password?
        </Link>
      </div>
      <div>
        <button className="btn btn-primary" onClick={clickSubmit}>
          {buttonText}
        </button>
      </div>
    </form>
  );

  return (
    <Layout>
      <div className="col-md-6 offset-md-3">
        <ToastContainer />
        {isAuth() ? <Redirect to="/" /> : null}
        <h1 className="p-5 text-center">Signin</h1>
        <Facebook informParent={informParent} />
        <Google informParent={informParent} />
        {signinForm()}
      </div>
    </Layout>
  );
};

export default Signin;
