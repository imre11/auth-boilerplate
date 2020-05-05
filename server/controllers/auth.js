const User = require("../models/user");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const sgMail = require("@sendgrid/mail");
const _ = require("lodash");
const { OAuth2Client } = require("google-auth-library");
const fetch = require("node-fetch");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.signup = (req, res) => {
  const { name, email, password } = req.body;
  User.findOne({ email }).exec((err, user) => {
    if (user) {
      return res.status(400).json({
        error: "User account with this email already exists. Please sign in."
      });
    }

    const token = jwt.sign(
      { name, email, password },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "1d" }
    );
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Account activation required`,
      html: `
        <p>Please click on the link below to activate your account.</p>
        <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
        <hr>
        <p>This email may contain sensitive information</p>
        <p>${process.env.CLIENT_URL}</p>`
    };
    sgMail
      .send(emailData)
      .then((sent) => {
        console.log(`Singup email sent to ${email}`);
        return res.json({
          message: `Email has been sent to ${email}. Follow the instructions to activate your account.`
        });
      })
      .catch((err) => {
        console.log("SIGNUP EMAIL SENT ERROR", err);
        return res.json({
          message: err.message
        });
      });
  });
};

exports.accountActivation = (req, res) => {
  const { token } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (
      err,
      decoded
    ) {
      if (err) {
        console.log("JWT token verification failed.", err);
        return res.status(401).json({
          error: "Link expired, please signup again."
        });
      }
      const { name, email, password } = jwt.decode(token);
      User.findOne({ email }, { _id: 1 }).exec((err, user) => {
        console.log("accountActivation", user);
        if (user) {
          return res.status(200).json({
            message: "Account has already been activated. Please signin."
          });
        } else {
          const user = new User({ name, email, password });
          user.save((err, user) => {
            if (err) {
              console.log(`Error saving user`);
              return res.status(401).json({
                error: "Error saving user in database. Please signup again."
              });
            }
            return res.json({
              message: "Account has been activated. Please signin."
            });
          });
        }
      });
    });
  } else {
    return res.json({
      message: "Something went wrong. Please try again."
    });
  }
};

exports.signin = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with this email address does not exist. Please signup."
      });
    }
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: "Login error. Please double check your email and password"
      });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });
    const { _id, name, email, role } = user;
    return res.json({
      token,
      user: { _id, name, email, role }
    });
  });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET
});

exports.adminMiddleware = (req, res, next) => {
  User.findById({ _id: req.user._id }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    }
    if (user.role !== "admin") {
      return res.status(400).json({
        error: "Admin users only. Access denied."
      });
    }
    req.profile = user;
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist"
      });
    }
    const token = jwt.sign(
      { _id: user._id, name: user.name },
      process.env.JWT_RESET_PASSWORD,
      {
        expiresIn: "60m"
      }
    );
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password reset link`,
      html: `
        <p>Please click on the link below to reset your password.</p>
        <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
        <hr>
        <p>This email may contain sensitive information</p>
        <p>${process.env.CLIENT_URL}</p>`
    };

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
      if (err) {
        console.log("Reset password link error", err);
        return res.status(400).json({
          error: "Database connection error"
        });
      } else {
        sgMail
          .send(emailData)
          .then((sent) => {
            console.log(`Password reset email sent to ${email}`);
            return res.json({
              message: `Password reset email has been sent to ${email}. Follow the instructions to reset your password.`
            });
          })
          .catch((err) => {
            console.log("Password reset email error", err);
            return res.json({
              message: err.message
            });
          });
      }
    });
  });
};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (resetPasswordLink) {
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(400).json({
          error: "Password reset link expired. Try again"
        });
      }
      User.findOne({ resetPasswordLink }, (err, user) => {
        if (err || !user) {
          return res.status(400).json({
            error: "Something went wrong. Try again later"
          });
        }
        const updatedFields = {
          password: newPassword,
          resetPasswordLink: ""
        };
        user = _.extend(user, updatedFields);
        user.save((err, result) => {
          if (err) {
            return res.status(400).json({
              error: "Error resetting user password"
            });
          }
          res.json({
            message:
              "Password has been changed. Please login with your new password"
          });
        });
      });
    });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (req, res) => {
  const { idToken } = req.body;
  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID })
    .then((response) => {
      console.log("Google OAuth response ", response);
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((error, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: "7d"
            });
            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role }
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log("Error saving new Google user to DB", err);
                return res.status(400).json({
                  error: "User signup with Google failed"
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                {
                  expiresIn: "7d"
                }
              );
              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role }
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: "Google login failed. Try again."
        });
      }
    });
};

exports.facebookLogin = (req, res) => {
  console.log("Facebook request", req.body);
  const { userId, accessToken } = req.body;
  const url = `https://graph.facebook.com/v2.11/${userId}/?fields=id,name,email&access_token=${accessToken}`;
  return fetch(url, {
    method: "GET"
  })
    .then((response) => response.json())
    .then((response) => {
      const { email, name } = response;
      User.findOne({ email }).exec((err, user) => {
        if (user) {
          const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
          });
          const { _id, email, name, role } = user;
          return res.json({
            token,
            user: { _id, email, name, role }
          });
        } else {
          let password = email + process.env.JWT_SECRET;
          user = new User({ name, email, password });
          console.log("Facebook user", user);
          user.save((err, data) => {
            if (err) {
              console.log("Error saving new Facebook user to DB", err);
              return res.status(400).json({
                error: "User signup with Facebook failed"
              });
            }
            const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
              expiresIn: "7d"
            });
            const { _id, email, name, role } = data;
            return res.json({
              token,
              user: { _id, email, name, role }
            });
          });
        }
      });
    })
    .catch((error) => {
      res.json({
        error: "Facebook login failed. Try later."
      });
    });
};
