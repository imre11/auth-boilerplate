const User = require("../models/user");

exports.read = (req, res) => {
  const userId = req.params.id;

  User.findById(userId).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    }
    user.salt = undefined;
    user.hashed_password = undefined;
    res.json(user);
  });
};

exports.update = (req, res) => {
  //console.log ('Update user ', req.user, 'Update data ', req.body);
  const { name, password, email } = req.body;

  User.findOne({ _id: req.user._id }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found"
      });
    }
    if (!name) {
      return res.status(400).json({
        error: "Name is required"
      });
    } else {
      user.name = name;
    }
    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    } else {
      user.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password should be min 6 characters long"
        });
      } else {
        user.password = password;
      }
    }
    user.save((err, updatedUser) => {
      if (err) {
        console.log("User update error ", err);
        return res.status(400).json({
          error: "User update failed"
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      res.json(updatedUser);
    });
  });
};
