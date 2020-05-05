import React, { useState, useEffect } from "react";
import jwt from "jsonwebtoken";
import Layout from "../core/Layout";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

const Reset = ({ match }) => {
  const [values, setValues] = useState({
    name: "",
    token: "",
    newPassword: "",
    buttonText: "Reset password"
  });

  const { name, token, newPassword, buttonText } = values;

  /*eslint-disable */
  useEffect(() => {
    let token = match.params.token;
    let { name } = jwt.decode(token);
    if (token) {
      setValues({ ...values, name, token });
    }
  }, []);
  /*eslint-disable */

  const handleChange = (event) => {
    setValues({ ...values, newPassword: event.target.value });
  };

  const clickSubmit = (event) => {
    event.preventDefault();
    setValues({ ...values, buttonText: "Submitting..." });
    axios({
      method: "PUT",
      url: `${process.env.REACT_APP_API}/reset-password`,
      data: { newPassword, resetPasswordLink: token }
    })
      .then((response) => {
        toast.success(response.data.message);
        setValues({ ...values, buttonText: "Done" });
      })
      .catch((error) => {
        setValues({ ...values, buttonText: "Reset password" });
        toast.error(error.response.data.error);
      });
  };

  const resetPasswordForm = () => (
    <form>
      <div className="form-group">
        <label className="text-muted">New Password</label>
        <input
          type="password"
          value={newPassword}
          className="form-control"
          onChange={handleChange}
          placeholder="Type new password"
          required
        />
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
        <h1 className="p-5 text-center">
          Welcome {name}
          <br />
          Reset password
        </h1>
        {resetPasswordForm()}
      </div>
    </Layout>
  );
};

export default Reset;
