import React from "react";
import GoogleLogin from "react-google-login";
import axios from "axios";
//import {authenticate, isAuth} from './helpers';

const Google = ({ informParent = (f) => f }) => {
  const responseGoogle = (response) => {
    axios({
      method: "POST",
      url: `${process.env.REACT_APP_API}/google-login`,
      data: { idToken: response.tokenId }
    })
      .then((response) => {
        informParent(response);
      })
      .catch((error) => {
        console.log("Google signin error ", error);
      });
  };
  return (
    <div className="pb-3">
      <GoogleLogin
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        render={(renderProps) => (
          <button
            onClick={renderProps.onClick}
            disabled={renderProps.disabled}
            className="btn btn-danger btn-lg btn-block"
          >
            <i className="fab fa-google pr-2" /> Login with Google
          </button>
        )}
        //buttonText="Login with Google"
        onSuccess={responseGoogle}
        onFailure={responseGoogle}
        cookiePolicy={"single_host_origin"}
      />
    </div>
  );
};

export default Google;
