const express = require("express");
const adminRouter = express.Router();
const path = require("path");
const multer = require("multer");
const helpers = require('../utils/helpers');

const fs = require("fs");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const crypto = require("crypto");
var mailer = require("../utils/mailer");
const {
  User,
  Country,
  Industry,
  Cluster,
  Stage,
  CustomTable,
  CustomTableFieldValue,
  Organization,
  Contact,
  Deal,
  Reason,
  DealAction
} = require("../model");
const {
  CountryLimit,
  UserLimit,
  IndustryLimit,
  ClusterLimit,
  ReasonLimit,
  LostReportLimit
} = require("../utils/limits");
const mongoose = require("mongoose");
const { convertToSlug } = require("../utils/helpers");
const { response } = require("express");
var moment = require('moment-timezone');
const Schema = mongoose.Schema;

// File Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir("./uploads/", (err) => {
      cb(null, "./uploads/");
    });
  },
  filename: (req, file, cb) => {
    // console.log(file);
    cb(null, "user_" + Date.now() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Try to upload .jpeg or .png file."), false);
  }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Defined Admin Login
adminRouter.post("/login", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    const { email, password } = req.body;
    const user = await User.findOne({ email: { $regex: `${email}`, $options: "i" }, role: 1 });
    if (!user) {
      return res
        .status(200)
        .json({ success: false, msg: "This email is not registered!" });
    }
    var match = await bcrypt.compare(password, user.password);
    console.log("Match:", match);
    if (match) {
      // Create a token
      const payload = { user: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      var user_res = {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        photo:
          user.photo && fs.existsSync(`./uploads/${user.photo}`)
            ? `${fullUrl}/uploads/${user.photo}`
            : "",
      };
      res.status(200).json({
        success: true,
        msg: "User logged-in successfully",
        user: user_res,
        token,
      });
    } else {
      res.status(200).json({ success: false, msg: "Invalid Credentials!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Profile Update
adminRouter.post(
  "/updateProfile",
  upload.single("photo"),
  async function (req, res) {
    try {
      console.log("body:", req.body);
      console.log("files:", req.file);
      var fullUrl = req.protocol + "://" + req.get("host");

      const { _id, username, email } = req.body;

      // Check Email Or Username
      const check_unique = await User.find({
        $and: [{ $or: [{ email }, { username }] }, { _id: { $ne: _id } }],
      }).count();
      if (check_unique) {
        return res
          .status(200)
          .json({ success: false, msg: "Username or email must be unique." });
      }

      const user = await User.findById(_id);
      console.log("Iser", user);
      if (user) {
        var newData = {
          username,
          email,
        };

        if (req.file && req.file.fieldname == "photo" && req.file.filename) {
          // Remove Old Profile Pic
          let path = `./uploads/${user.photo}`;
          if (user.photo && fs.existsSync(path)) {
            fs.unlinkSync(path);
          }
          newData.photo = req.file.filename;
        }

        User.findOneAndUpdate(
          { _id: _id },
          { $set: newData },
          { multi: true, new: true },
          function (err, user) {
            if (err) throw err;
            var response_arr = {
              _id: user._id,
              username: user.username,
              email: user.email,
              photo:
                user.photo && fs.existsSync(`./uploads/${user.photo}`)
                  ? `${fullUrl}/uploads/${user.photo}`
                  : "",
            };
            res
              .status(200)
              .json({
                success: true,
                msg: "Profile updated successfully",
                user: response_arr,
              });
          }
        );
      } else {
        res.status(400).json({ success: false, msg: "User not found!" });
      }
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  }
);

// Define Admin Change Password
adminRouter.post("/changePassword", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);
    var fullUrl = req.protocol + "://" + req.get("host");

    const {
      current_user,
      old_password,
      new_password,
      cnew_password,
    } = req.body;

    // Check old Password
    const user = await User.findOne({ _id: current_user });
    if (!user) {
      return res.status(200).json({ success: false, msg: "User not found!" });
    }
    var match = await bcrypt.compare(old_password, user.password);
    if (!match) {
      return res
        .status(200)
        .json({ success: false, msg: "Old password is wrong!" });
    } else if (new_password.trim() !== cnew_password.trim()) {
      return res
        .status(200)
        .json({
          success: false,
          msg: "Confirm password and new password must be same!",
        });
    }

    let newData = {
      password: bcrypt.hashSync(new_password, 8),
    };

    User.findOneAndUpdate(
      { _id: current_user },
      { $set: newData },
      { multi: true, new: true },
      function (err, user) {
        if (err) throw err;
        res
          .status(200)
          .json({ success: true, msg: "Password updated successfully." });
      }
    );
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Admin Send Reset Link
adminRouter.post("/sendResetLink", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);
    var fullUrl = req.protocol + "://" + req.get("host");

    const { email } = req.body;

    // Check Email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: false, msg: "Email not found!" });
    }

    // Generate Random Token
    crypto.randomBytes(20, function (err, buffer) {
      var token = buffer.toString("hex");
      User.findByIdAndUpdate(
        { _id: user._id },
        {
          reset_password_token: token,
          reset_password_expires: Date.now() + 86400000,
        },
        { upsert: true, new: true, multi: true }
      ).exec(function (err, new_user) {
        console.log("new_user:", new_user);

        let ADMIN_RESET_URL =
          process.env.NODE_ENV !== "production"
            ? process.env.ADMIN_RESET_LOCAL_URL
            : process.env.ADMIN_RESET_LIVE_URL;
        var mailOptions = {
          to: new_user.email,
          from: process.env.MAILER_EMAIL_ID,
          template: "forgot-password-email",
          subject: "Password help has arrived!",
          context: {
            url: `${ADMIN_RESET_URL}/${token}`,
            name: new_user.username,
          },
        };
        mailer.sendMail(mailOptions);
      });
    });
    // Send Mail

    res.status(200).json({ success: true, msg: "Mail sent successfully." });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Admin Verify Reset Link
adminRouter.post("/resetPassword", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);
    var fullUrl = req.protocol + "://" + req.get("host");

    const {
      reset_password_token,
      new_password,
      confirm_new_password,
    } = req.body;

    // Check Link
    const user = await User.findOne({
      reset_password_token: reset_password_token,
      reset_password_expires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(200)
        .json({
          success: false,
          msg: "Password reset token is invalid or has expired.",
        });
    }

    // Check New Password and Confirm New Password
    if (new_password !== confirm_new_password) {
      return res
        .status(200)
        .json({
          success: false,
          msg: "Confirm password and new password must be same!",
        });
    }

    let newData = {
      password: bcrypt.hashSync(new_password, 8),
      reset_password_token: "",
      reset_password_expires: "",
    };

    User.findOneAndUpdate(
      { _id: user._id },
      { $set: newData },
      { multi: true, new: true },
      function (err, new_user) {
        if (err) throw err;

        // Send Mail
        var mailOptions = {
          to: "aayusinghal34@gmail.com",
          from: process.env.MAILER_EMAIL_ID,
          template: "reset-password-email",
          subject: "Password Reset Confirmation",
          context: {
            name: new_user.username,
          },
        };
        mailer.sendMail(mailOptions);
        res
          .status(200)
          .json({ success: true, msg: "Password updated successfully." });
      }
    );
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Profile Get
adminRouter.post(
  "/getProfile", async function (req, res) {
    try {
      console.log("body:", req.body);
      console.log("files:", req.file);
      var fullUrl = req.protocol + "://" + req.get("host");

      const { _id } = req.body;

      const user = await User.findById(_id);
      console.log("Iser", user);
      if (user) {

        var response_arr = {
          _id: user._id,
          username: user.username,
          email: user.email,
          photo:
            user.photo && fs.existsSync(`./uploads/${user.photo}`)
              ? `${fullUrl}/uploads/${user.photo}`
              : "",
        };
        res
          .status(200)
          .json({
            success: true,
            msg: "Profile get successfully",
            user: response_arr,
          });
      } else {
        res.status(400).json({ success: false, msg: "User not found!" });
      }
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  }
);

// ::::::::::::::::::::::::::::::::::::::::: Users :::::::::::::::::::::::::::::::::::::::::
// Define User Add
adminRouter.post(
  "/user/add",
  upload.single("photo"),
  async function (req, res) {
    try {
      console.log("body:", req.body);
      console.log("files:", req.file);

      const { username, email, contact_no } = req.body;

      // Check Email Or Username
      const check_user = await User.find({ username}).count();
      if(check_user){
        return res.status(200).json({ success: false, msg: 'Username  must be unique.' });
      }
     
      const check_email = await  User.find({ $and: [{email: { $regex: `^${email}$`, $options: "i" } }]}).count();
      if(check_email){
        return res.status(200).json({ success: false, msg: 'Email  must be unique.' });
      }
      const check_phone = await User.find({contact_no: { $regex: `^${contact_no}$`, $options: "i" }}).count();
      if(check_phone){
        return res.status(200).json({ success: false, msg: 'Contact Number must be unique.' });
      }
      if (req.body.password) {
        var hashedPassword = bcrypt.hashSync(req.body.password, 8);
        req.body.password = hashedPassword;
      }

      if (req.file && req.file.fieldname == "photo" && req.file.filename) {
        req.body.photo = req.file.filename;
      }

      if(req.body.email){
        req.body.email = req.body.email.toLowerCase();
      }

      const newUser = new User(req.body);
      let user = await newUser.save();

      var response_arr = {
        _id: user._id,
        username: user.username,
        email: user.email,
        contact_no: user.contact_no,
        status: user.status,
      };

      res.status(200).json({
        success: true,
        msg: "User added successfully",
        user: response_arr,
      });
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  }
);

// Defined User Get All
adminRouter.get("/users", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var filter = { role: 2 };

    if (req.query.search_keyword && req.query.search_keyword !== "null") {
      // For Status Check
      const enable_str = "Enable";
      const disable_str = "Disable";
      var status_check = "";

      if (
        enable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 1;
      } else if (
        disable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 2;
      }

      filter = {
        ...filter,
        $or: [
          {
            username: { $regex: `${req.query.search_keyword}`, $options: "i" },
          },
          { email: { $regex: `${req.query.search_keyword}`, $options: "i" } },
          {
            contact_no: {
              $regex: `${req.query.search_keyword}`,
              $options: "i",
            },
          },
          { status: status_check },
        ],
      };
    }

    console.log("filter:", JSON.stringify(filter));

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = UserLimit;
    const totalRecords = await User.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);
    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    var users = await User.find(filter, {
      username: 1,
      email: 1,
      contact_no: 1,
      status: 1,
      photo: 1,
    })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });
    users.forEach((element, index) => {
      element.photo =
        element.photo && fs.existsSync(`./uploads/${element.photo}`)
          ? `${fullUrl}/uploads/${element.photo}`
          : "";
    });

    res
      .status(200)
      .json({
        success: true,
        msg: "User get successfully",
        users: users,
        pagination: { recordsPerPage, totalRecords, totalPages, page, recordRange },
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined User Get All
adminRouter.get("/users/all", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var filter = { role: 2 };

    var users = await User.find(filter, {
      username: 1,
      email: 1,
      contact_no: 1,
      status: 1,
      photo: 1,
    })
      .sort({ _id: -1 });
    users.forEach((element, index) => {
      element.photo =
        element.photo && fs.existsSync(`./uploads/${element.photo}`)
          ? `${fullUrl}/uploads/${element.photo}`
          : "";
    });

    res
      .status(200)
      .json({
        success: true,
        msg: "User get successfully",
        users: users,
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single User
adminRouter.get("/user/:id", async function (req, res) {
  try {
    const user = await User.findOne(
      { _id: req.params.id },
      { username: 1, email: 1, contact_no: 1, status: 1, password: 1, photo: 1 }
    );
    res
      .status(200)
      .json({ success: true, msg: "User detail get successfully", user: user });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define User Update
adminRouter.post(
  "/user/update",
  upload.single("photo"),
  async function (req, res) {
    try {
      console.log("body:", req.body);
      console.log("files:", req.file);

      const { _id, username, email, password, contact_no, status } = req.body;
   
      // Check Email Or Username
      const check_user = await User.find({ $and: [{username }, { _id: { $ne: _id } }]}).count();
      if(check_user){
        return res.status(200).json({ success: false, msg: 'Username  must be unique.' });
      }
      const check_email = await  User.find({ $and: [{email: { $regex: `^${email}$`, $options: "i" } }, { _id: { $ne: _id } }]}).count();
      if(check_email){
        return res.status(200).json({ success: false, msg: 'Email  must be unique.' });
      }
      const check_phone = await User.find({ $and: [{contact_no: { $regex: `^${contact_no}$`, $options:"i"}}, { _id: { $ne: _id } }]}).count();
      if(check_phone){
        return res.status(200).json({ success: false, msg: 'Contact Number must be unique.' });
      }

      const user = User.findById(_id);
      if (user) {
        var newData = {
          username,
          email:email.toLowerCase(),
          contact_no,
          status,
        };
        if (password) {
          var hashedPassword = bcrypt.hashSync(password, 8);
          newData.password = hashedPassword;
        }
        if (req.file && req.file.fieldname == "photo" && req.file.filename) {
          newData.photo = req.file.filename;
        }
        User.findOneAndUpdate(
          { _id: _id },
          { $set: newData },
          { multi: true, new: true },
          function (err, user) {
            if (err) throw err;
            var response_arr = {
              _id: user._id,
              username: user.username,
              email: user.email,
              contact_no: user.contact_no,
              status: user.status,
            };
            res
              .status(200)
              .json({
                success: true,
                msg: "User updated successfully",
                user: response_arr,
              });
          }
        );
      } else {
        res.status(400).json({ success: false, msg: "User not found!" });
      }
    } catch (error) {
      res.status(400).json({ success: false, msg: error.message });
    }
  }
);

// Defined Delete User
adminRouter.delete("/user/delete/:id", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var filter = { role: 2 };

    // Get Data
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(200).json({
        success: false,
        msg: "No data find",
      });
    }
    // Remove File From Folder
    let path = `./uploads/${user.photo}`;
    if (user.photo && fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
    const deleteUser = await User.findByIdAndRemove({ _id: req.params.id });

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = UserLimit;
    const totalRecords = await User.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var users = await User.find(filter, {
      username: 1,
      email: 1,
      contact_no: 1,
      status: 1,
      photo: 1,
    })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });
    users.forEach((element, index) => {
      element.photo =
        element.photo && fs.existsSync(`./uploads/${element.photo}`)
          ? `${fullUrl}/uploads/${element.photo}`
          : "";
    });

    res
      .status(200)
      .json({
        success: true,
        msg: "User deleted successfully",
        users: users,
        pagination: { recordsPerPage, totalRecords, totalPages, page },
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Countries :::::::::::::::::::::::::::::::::::::::::
// Define Country Add
adminRouter.post("/country/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { title } = req.body;

    // Check Title
    const check_unique = await Country.find({
      title: { $regex: `^${title}$`, $options: "i" },
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const newCountry = new Country(req.body);
    let country = await newCountry.save();

    var response_arr = {
      _id: country._id,
      title: country.title,
      status: country.status,
      status_text: country.status_text,
    };

    res.status(200).json({
      success: true,
      msg: "Country added successfully",
      country: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Country Get All
adminRouter.get("/countries", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    // console.log(`${ JSON.stringify(req.params) }  | ${ JSON.stringify(req.body) } | ${req.query.current_page}`);

    var filter = {};

    if (req.query.search_keyword && req.query.search_keyword !== "null") {
      // For Status Check
      const enable_str = "Enable";
      const disable_str = "Disable";
      var status_check = "";

      if (
        enable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 1;
      } else if (
        disable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 2;
      }

      filter = {
        $or: [
          { title: { $regex: `${req.query.search_keyword}`, $options: "i" } },
          { status: status_check },
        ],
      };
    }

    console.log("filter:", JSON.stringify(filter));

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = CountryLimit;
    const totalRecords = await Country.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    var countries = await Country.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });
    res.status(200).json({
      success: true,
      msg: "Country get successfully",
      countries: countries,
      pagination: { recordsPerPage, totalRecords, totalPages, page, recordRange },
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined All Countries
adminRouter.get("/all_countries", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var limit = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }
    var countries = await Country.find(
      { status: 1 },
      { title: 1, status: 1, status_text: 1 }
    )
      .lean({ virtuals: true })
      .limit(limit)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Country get successfully",
      countries: countries,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Country
adminRouter.get("/country/:id", async function (req, res) {
  try {
    const country = await Country.findOne(
      { _id: req.params.id },
      { title: 1, status: 1, status_text: 1 }
    ).lean({ virtuals: true });
    res.status(200).json({
      success: true,
      msg: "Country detail get successfully",
      country: country,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Country Update
adminRouter.post("/country/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { _id, title, status } = req.body;

    // Check Title
    const check_unique = await Country.find({
      $and: [
        { title: { $regex: `^${title}$`, $options: "i" } },
        { _id: { $ne: _id } },
      ],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const country = Country.findById(_id);
    if (country) {
      var newData = {
        title,
        status,
      };

      Country.findOneAndUpdate(
        { _id: _id },
        { $set: newData },
        { multi: true, new: true },
        function (err, country) {
          if (err) throw err;
          var response_arr = {
            _id: country._id,
            title: country.title,
            status: country.status,
            status_text: country.status_text,
          };
          res.status(200).json({
            success: true,
            msg: "Country updated successfully",
            country: response_arr,
          });
        }
      );
    } else {
      res.status(400).json({ success: false, msg: "Country not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Country
adminRouter.delete("/country/delete/:id", async function (req, res) {
  try {
    // Get Data
    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(200).json({
        success: false,
        msg: "No data find",
      });
    }
    await Country.findByIdAndRemove({ _id: req.params.id });

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = CountryLimit;
    const totalRecords = await Country.find({}).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var countries = await Country.find({}, { title: 1, status: 1, status_text: 1 })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res
      .status(200)
      .json({
        success: true,
        msg: "Country deleted successfully",
        countries: countries,
        pagination: { recordsPerPage, totalRecords, totalPages, page },
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Industries :::::::::::::::::::::::::::::::::::::::::
// Define Industry Add
adminRouter.post("/industry/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { title } = req.body;

    // Check Title
    const check_unique = await Industry.find({
      title: { $regex: `^${title}$`, $options: "i" },
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const newIndustry = new Industry(req.body);
    let industry = await newIndustry.save();

    var response_arr = {
      _id: industry._id,
      title: industry.title,
      status: industry.status,
    };

    res.status(200).json({
      success: true,
      msg: "Industry added successfully",
      industry: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Industry Get All
adminRouter.get("/industries", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");

    var filter = {};

    if (req.query.search_keyword && req.query.search_keyword !== "null") {
      // For Status Check
      const enable_str = "Enable";
      const disable_str = "Disable";
      var status_check = "";

      if (
        enable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 1;
      } else if (
        disable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 2;
      }

      filter = {
        $or: [
          { title: { $regex: `${req.query.search_keyword}`, $options: "i" } },
          { status: status_check },
        ],
      };
    }

    console.log("filter:", JSON.stringify(filter));

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = IndustryLimit;
    const totalRecords = await Industry.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    var industries = await Industry.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Industry get successfully",
      industries: industries,
      pagination: { recordsPerPage, totalRecords, totalPages, page, recordRange },
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined All Industries
adminRouter.get("/all_industries", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var limit = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }
    var industries = await Industry.find(
      { status: 1 },
      { title: 1, status: 1, status_text: 1 }
    )
      .lean({ virtuals: true })
      .limit(limit)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Industry get successfully",
      industries: industries,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Industry
adminRouter.get("/industry/:id", async function (req, res) {
  try {
    const industry = await Industry.findOne(
      { _id: req.params.id },
      { title: 1, status: 1 }
    );
    res.status(200).json({
      success: true,
      msg: "Industry detail get successfully",
      industry: industry,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Industry Update
adminRouter.post("/industry/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { _id, title, status } = req.body;

    // Check Title
    const check_unique = await Industry.find({
      $and: [
        { title: { $regex: `^${title}$`, $options: "i" } },
        { _id: { $ne: _id } },
      ],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const industry = Industry.findById(_id);
    if (industry) {
      var newData = {
        title,
        status,
      };

      Industry.findOneAndUpdate(
        { _id: _id },
        { $set: newData },
        { multi: true, new: true },
        function (err, industry) {
          if (err) throw err;
          var response_arr = {
            _id: industry._id,
            title: industry.title,
            status: industry.status,
          };
          res.status(200).json({
            success: true,
            msg: "Industry updated successfully",
            industry: response_arr,
          });
        }
      );
    } else {
      res.status(400).json({ success: false, msg: "Industry not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Industry
adminRouter.delete("/industry/delete/:id", async function (req, res) {
  try {
    var filter = {};

    // Get Data
    const industry = await Industry.findById(req.params.id);
    if (!industry) {
      return res.status(200).json({
        success: false,
        msg: "No data find",
      });
    }

    await Industry.findByIdAndRemove({ _id: req.params.id });

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = IndustryLimit;
    const totalRecords = await Industry.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var industries = await Industry.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res
      .status(200)
      .json({
        success: true,
        msg: "Industry deleted successfully",
        industries: industries,
        pagination: { recordsPerPage, totalRecords, totalPages, page },
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Clusters :::::::::::::::::::::::::::::::::::::::::
// Define Cluster Add
adminRouter.post("/cluster/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { title } = req.body;

    // Check Title
    const check_unique = await Cluster.find({
      title: { $regex: `^${title}$`, $options: "i" },
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const newCluster = new Cluster(req.body);
    let cluster = await newCluster.save();

    var response_arr = {
      _id: cluster._id,
      title: cluster.title,
      status: cluster.status,
    };

    res.status(200).json({
      success: true,
      msg: "Cluster added successfully",
      cluster: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Cluster Get All
adminRouter.get("/clusters", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    // console.log(`${ JSON.stringify(req.params) }  | ${ JSON.stringify(req.body) } | ${req.query.current_page}`);

    var filter = {};
    if (req.query.search_keyword && req.query.search_keyword !== "null") {
      // For Status Check
      const enable_str = "Enable";
      const disable_str = "Disable";
      var status_check = "";

      if (
        enable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 1;
      } else if (
        disable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 2;
      }

      filter = {
        $or: [
          { title: { $regex: `${req.query.search_keyword}`, $options: "i" } },
          { status: status_check },
        ],
      };
    }

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = ClusterLimit;
    const totalRecords = await Cluster.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    var clusters = await Cluster.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Cluster get successfully",
      clusters: clusters,
      pagination: { recordsPerPage, totalRecords, totalPages, page, recordRange },
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined All Clusters
adminRouter.get("/all_clusters", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var limit = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }
    var clusters = await Cluster.find(
      { status: 1 },
      { title: 1, status: 1, status_text: 1 }
    )
      .lean({ virtuals: true })
      .limit(limit)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Cluster get successfully",
      clusters: clusters,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Cluster
adminRouter.get("/cluster/:id", async function (req, res) {
  try {
    const cluster = await Cluster.findOne(
      { _id: req.params.id },
      { title: 1, status: 1 }
    );
    res.status(200).json({
      success: true,
      msg: "Cluster detail get successfully",
      cluster: cluster,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Cluster Update
adminRouter.post("/cluster/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { _id, title, status } = req.body;

    // Check Title
    const check_unique = await Cluster.find({
      $and: [
        { title: { $regex: `^${title}$`, $options: "i" } },
        { _id: { $ne: _id } },
      ],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const cluster = Cluster.findById(_id);
    if (cluster) {
      var newData = {
        title,
        status,
      };

      Cluster.findOneAndUpdate(
        { _id: _id },
        { $set: newData },
        { multi: true, new: true },
        function (err, cluster) {
          if (err) throw err;
          var response_arr = {
            _id: cluster._id,
            title: cluster.title,
            status: cluster.status,
          };
          res.status(200).json({
            success: true,
            msg: "Cluster updated successfully",
            cluster: response_arr,
          });
        }
      );
    } else {
      res.status(400).json({ success: false, msg: "Cluster not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Cluster
adminRouter.delete("/cluster/delete/:id", async function (req, res) {
  try {
    // Get Data
    const cluster = await Cluster.findById(req.params.id);
    if (!cluster) {
      return res.status(200).json({
        success: false,
        msg: "No data find",
      });
    }

    await Cluster.findByIdAndRemove({ _id: req.params.id });

    var filter = {};
    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = ClusterLimit;
    const totalRecords = await Cluster.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var clusters = await Cluster.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res
      .status(200)
      .json({
        success: true,
        msg: "Cluster deleted successfully",
        clusters: clusters,
        pagination: { recordsPerPage, totalRecords, totalPages, page },
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Stages :::::::::::::::::::::::::::::::::::::::::
// Define Stage Add
adminRouter.post("/stage/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { name, color } = req.body;

    // Check Title
    const check_unique = await Stage.find({
      name: { $regex: `^${name}$`, $options: "i" },
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const newStage = new Stage(req.body);
    let stage = await newStage.save();

    var response_arr = {
      _id: stage._id,
      name: stage.name,
      color: stage.color,
      position: stage.position,
    };

    res.status(200).json({
      success: true,
      msg: "Stage added successfully",
      stage: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Stage Get All
adminRouter.get("/stages", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var stages = await Stage.find({}, { name: 1, color: 1, position: 1 }).sort({
      position: 1,
    });
    res.status(200).json({
      success: true,
      msg: "Stage get successfully",
      stages: stages,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Stage
adminRouter.get("/stage/:id", async function (req, res) {
  try {
    const stage = await Stage.findOne(
      { _id: req.params.id },
      { name: 1, color: 1, position: 1 }
    );
    res.status(200).json({
      success: true,
      msg: "Stage detail get successfully",
      stage: stage,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Stage Update
adminRouter.post("/stage/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { user, stage, name, color } = req.body;

    // Check Title
    const check_unique = await Stage.find({
      $and: [
        { name: { $regex: `^${name}$`, $options: "i" } },
        { _id: { $ne: stage } },
      ],
    });

    console.log("check_unique:", check_unique);

    // if (check_unique > 0) {
    //   return res
    //     .status(200)
    //     .json({ success: false, msg: "Title must be unique." });
    // }

    const stage_find = Stage.findById(stage);
    if (stage_find) {
      var newData = {
        user: user,
      };

      if (name) {
        newData.name = name;
      }

      if (color) {
        newData.color = color;
      }

      Stage.findOneAndUpdate(
        { _id: stage },
        { $set: newData },
        { multi: true, new: true },
        function (err, stage) {
          if (err) throw err;
          var response_arr = {
            _id: stage._id,
            name: stage.name,
            color: stage.color,
            position: stage.position,
          };
          res.status(200).json({
            success: true,
            msg: "Stage updated successfully",
            stage: response_arr,
          });
        }
      );
    } else {
      res.status(400).json({ success: false, msg: "Stage not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Stage
adminRouter.delete("/stage/delete/:id", async function (req, res) {
  try {
    // Get Data
    const stage = await Stage.findById(req.params.id);
    if (!stage) {
      return res.status(200).json({
        success: false,
        msg: "No data find",
      });
    }

    await Stage.findByIdAndRemove({ _id: req.params.id });
    res.status(200).json({ success: true, msg: "Stage deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Update Stage Position
adminRouter.post("/stage/changePosition", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { stage, last_position, current_position } = req.body;

    const check_stage = Stage.findById(stage);
    if (check_stage) {
      // Change Other Stage Position
      await Stage.findOneAndUpdate(
        { position: current_position },
        { $set: { position: last_position } },
        { new: true }
      );
      // Change Stage Position
      await Stage.findOneAndUpdate(
        { position: last_position, _id: stage },
        { $set: { position: current_position } },
        { new: true }
      );

      var stages = await Stage.find({}, { name: 1, color: 1, position: 1 })
        .lean()
        .sort({ position: 1 });
      res.status(200).json({
        success: true,
        msg: "Stage updated successfully",
        stages: stages,
      });
    } else {
      res.status(200).json({ success: false, msg: "Stage not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Organizations :::::::::::::::::::::::::::::::::::::::::

// Define Organization Add
adminRouter.post("/organisation/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const {
      user,
      table_name,
      slug_name,
      column_name,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
      values,
    } = req.body;

    let column_slug = convertToSlug(column_name);

    // Check Title
    const check_unique = await CustomTable.find({
      slug_name: { $regex: `^${slug_name}$`, $options: "i" },
      column_slug: column_slug,
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Column must be unique." });
    }

    const newOrganisation = new CustomTable({
      user,
      table_name,
      slug_name,
      column_name,
      column_slug,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
    });
    let organisation = await newOrganisation.save();

    if (organisation) {
      if (values && values.length > 0) {
        for (let index = 0; index < values.length; index++) {
          const element = values[index];
          await new CustomTableFieldValue({
            custom_table: organisation._id,
            column_value: element.value,
            ref: element.ref ? element.ref : "",
          }).save();
        }
      }
    }

    // Fetch Data
    let response_arr = {};
    
    const data = await CustomTable.findOne({ _id:organisation._id  }).lean().populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data) {
        let d = data;
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];

        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:country._id,label:country.title,ref:ref });
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:industry._id,label:industry.title,ref:ref });
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              new_values.push( { value:stage._id,label:stage.name,ref:ref });
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr=d;
    }

    res.status(200).json({
      success: true,
      msg: "Organization added successfully",
      organisation: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Organization Get All
adminRouter.get("/organisations", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    const response_arr = [];

    const data = await CustomTable.find({ slug_name: "org" })
      .lean()
      .sort({position:1})
      .populate({
        path: "values",
        select: "column_value ref -_id -custom_table",
      });
    if (data && data.length > 0) {
      for (const d of data) {
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];

        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(country){
                new_values.push({ value:country._id,label:country.title,ref:ref });
              }              
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(industry){
                new_values.push({ value:industry._id,label:industry.title,ref:ref });
              }              
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(cluster){
                new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
              }              
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              if(stage){
                new_values.push( { value:stage._id,label:stage.name,ref:ref });
              }              
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr.push(d);
      }
    }
    res.status(200).json({
      success: true,
      msg: "Organization get successfully",
      organisations: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Organization Update
adminRouter.post("/organisation/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const {
      _id,
      user,
      table_name,
      slug_name,
      column_name,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
      values,
    } = req.body;
    let column_slug = convertToSlug(column_name);

    // Check Title
    const check_unique = await CustomTable.find({
      $and: [{ column_name }, { slug_name }, { _id: { $ne: _id } }],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Column must be unique." });
    }

    let finalData = {
      table_name,
      slug_name,
      column_name,
      column_slug,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
    };
    const organisation = await CustomTable.findOneAndUpdate( { _id: req.body._id },{ $set: finalData }, { multi: true, new: true });

    await CustomTableFieldValue.remove({ custom_table: req.body._id });
    if (values && values.length > 0) {
      // Delete Old Data
      for (let index = 0; index < values.length; index++) {
        const element = values[index];
        await new CustomTableFieldValue({
          custom_table: organisation._id,
          column_value: element.value,
          ref: element.ref ? element.ref : "",
        }).save();
      }
    }


    // Fetch Data
    let response_arr = {};
    
    const data = await CustomTable.findOne({ _id:req.body._id  }).lean().populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data) {
        let d = data;
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];

        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:country._id,label:country.title,ref:ref });
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:industry._id,label:industry.title,ref:ref });
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              new_values.push( { value:stage._id,label:stage.name,ref:ref });
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr=d;
    }
    

    res.status(200).json({
      success: true,
      msg: "Organization updated successfully",
      organisation: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Organization
adminRouter.get("/organisation/:id", async function (req, res) {
  try {
    const data = await CustomTable.findOne({
      _id: req.params.id,
      slug_name: "org",
    });

    if(!data){
      res.status(200).json({
        success: false,
        msg: "Organization detail could not get.",
      });
    }

    // Get Field Values
    let new_values = [];
    const field_values = await CustomTableFieldValue.find({custom_table: data._id}).lean();
    if(field_values && field_values.length > 0){      
      for (const v of field_values) {
        let column_value = v.column_value;
        let ref = v.ref;
        if (ref && ref === "country") {
          const country = await Country.findOne(
            { _id: column_value },
            { title: 1 }
          ).lean();
          new_values.push({ value:country._id,label:country.title,ref:ref });
        } else if (ref && ref === "industry") {
          const industry = await Industry.findOne(
            { _id: column_value },
            { title: 1 }
          ).lean();
          new_values.push({ value:industry._id,label:industry.title,ref:ref });
        } else if (ref && ref === "cluster") {
          const cluster = await Cluster.findOne(
            { _id: column_value },
            { title: 1 }
          ).lean();
          new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
        } else if (ref && ref === "stage") {
          const stage = await Stage.findOne(
            { _id: column_value },
            { name: 1 }
          ).lean();
          new_values.push({ value:stage._id,label:stage.name,ref:ref });
        } 
        else if (ref && ref === "deal_status") {
          const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
          new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
        }
        else if (ref && ref === "organization") {
          new_values.push({
            value:'Organizations',
            label:'Organizations',
            ref:'organization'
          });
        } else if (ref && ref === "contact") {
          new_values.push({
            value:'Contacts',
            label:'Contacts',
            ref:'contact'
          });
        }
        else if (ref && ref === "user") {
          new_values.push({ value:column_value,label:column_value,ref:ref });
        } else {
          new_values.push({ value:column_value, label:column_value, ref:ref });
        }
      }     
    }
    data.values = new_values;
    // data.values = (field_values && field_values.length > 0) ? field_values : [];
    res.status(200).json({
      success: true,
      msg: "Organization detail get successfully",
      organisation: data,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Organization
adminRouter.delete("/organisation/delete/:id", async function (req, res) {
  try {
    // Get Data
    const organisation = await CustomTable.findById(req.params.id);
    if (!organisation) {
      return res.status(200).json({
        success: false,
        msg: "No field found!",
      });
    }
    await CustomTable.findByIdAndRemove({ _id: req.params.id });
    await CustomTableFieldValue.remove({ custom_table: req.params.id });
    res
      .status(200)
      .json({ success: true, msg: "Organization field deleted successfully!" });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Contacts :::::::::::::::::::::::::::::::::::::::::
// Define Contact Add
adminRouter.post("/contact/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const {
      user,
      table_name,
      slug_name,
      column_name,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
      values,
    } = req.body;
  
    let column_slug = convertToSlug(column_name);
  
    // Check Title
    const check_unique = await CustomTable.find({
      slug_name: { $regex: `^${slug_name}$`, $options: "i" },
      column_slug: column_slug,
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Column must be unique." });
    }
  
    const newContact = new CustomTable({
      user,
      table_name,
      slug_name,
      column_name,
      column_slug,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
    });
    let contact = await newContact.save();
  
    if (contact) {
      if (values && values.length > 0) {
        for (let index = 0; index < values.length; index++) {
          const element = values[index];
          await new CustomTableFieldValue({
            custom_table: contact._id,
            column_value: element.value,
            ref: element.ref ? element.ref : "",
          }).save();
        }
      }
    }
  
    // Fetch Data
    let response_arr = {};
    
    const data = await CustomTable.findOne({ _id:contact._id  }).lean().populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data) {
        let d = data;
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
  
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:country._id,label:country.title,ref:ref });
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:industry._id,label:industry.title,ref:ref });
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              new_values.push( { value:stage._id,label:stage.name,ref:ref });
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr=d;
    }

    res.status(200).json({
      success: true,
      msg: "Contact added successfully",
      contact: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Contact Get All
adminRouter.get("/contacts", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    const response_arr = [];

    const data = await CustomTable.find({ slug_name: "contact" })
    .lean()
    .sort({position:1})
    .populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data && data.length > 0) {
      for (const d of data) {
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];

        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(country){
                new_values.push({ value:country._id,label:country.title,ref:ref });
              }              
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(industry){
                new_values.push({ value:industry._id,label:industry.title,ref:ref });
              }              
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(cluster){
                new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
              }              
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              if(stage){
                new_values.push( { value:stage._id,label:stage.name,ref:ref });
              }              
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr.push(d);
      }
    }

    res.status(200).json({
      success: true,
      msg: "Contact get successfully",
      contacts: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Contact
adminRouter.get("/contact/:id", async function (req, res) {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      slug_name: "contact",
    });
    res.status(200).json({
      success: true,
      msg: "Contact detail get successfully",
      contact: contact,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Contact
adminRouter.delete("/contact/delete/:id", async function (req, res) {
  try {
    // Get Data
    const contact = await CustomTable.findById(req.params.id);
    if (!contact) {
      return res.status(200).json({
        success: false,
        msg: "No field found!",
      });
    }
    await CustomTable.findByIdAndRemove({ _id: req.params.id });
    await CustomTableFieldValue.remove({ custom_table: req.params.id });
    res
      .status(200)
      .json({ success: true, msg: "Contact field deleted successfully!" });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Contacts Update
adminRouter.post("/contact/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const {
      _id,
      user,
      table_name,
      slug_name,
      column_name,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
      values,
    } = req.body;
    let column_slug = convertToSlug(column_name);
  
    // Check Title
    const check_unique = await CustomTable.find({
      $and: [{ column_name }, { slug_name }, { _id: { $ne: _id } }],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Column must be unique." });
    }
  
    let finalData = {
      table_name,
      slug_name,
      column_name,
      column_slug,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
    };
    const organisation = await CustomTable.findOneAndUpdate( { _id: req.body._id },{ $set: finalData }, { multi: true, new: true });
  
    await CustomTableFieldValue.remove({ custom_table: req.body._id });
    if (values && values.length > 0) {
      // Delete Old Data
      for (let index = 0; index < values.length; index++) {
        const element = values[index];
        await new CustomTableFieldValue({
          custom_table: organisation._id,
          column_value: element.value,
          ref: element.ref ? element.ref : "",
        }).save();
      }
    }
  
  
    // Fetch Data
    let response_arr = {};
    
    const data = await CustomTable.findOne({ _id:req.body._id  }).lean().populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data) {
        let d = data;
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
  
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:country._id,label:country.title,ref:ref });
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:industry._id,label:industry.title,ref:ref });
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              new_values.push( { value:stage._id,label:stage.name,ref:ref });
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr=d;
    }

    res.status(200).json({
      success: true,
      msg: "Contacts updated successfully",
      contact: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Deals :::::::::::::::::::::::::::::::::::::::::
// Define Deal Add
adminRouter.post("/deal/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const {
      user,
      table_name,
      slug_name,
      column_name,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
      values,
    } = req.body;
  
    let column_slug = convertToSlug(column_name);
  
    // Check Title
    const check_unique = await CustomTable.find({
      slug_name: { $regex: `^${slug_name}$`, $options: "i" },
      column_slug: column_slug,
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Column must be unique." });
    }
  
    const newDeal = new CustomTable({
      user,
      table_name,
      slug_name,
      column_name,
      column_slug,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
    });
    let deal = await newDeal.save();
  
    if (deal) {
      if (values && values.length > 0) {
        for (let index = 0; index < values.length; index++) {
          const element = values[index];
          await new CustomTableFieldValue({
            custom_table: deal._id,
            column_value: element.value,
            ref: element.ref ? element.ref : "",
          }).save();
        }
      }
    }
  
    // Fetch Data
    let response_arr = {};
    
    const data = await CustomTable.findOne({ _id:deal._id  }).lean().populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data) {
        let d = data;
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
  
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:country._id,label:country.title,ref:ref });
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:industry._id,label:industry.title,ref:ref });
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              new_values.push( { value:stage._id,label:stage.name,ref:ref });
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr=d;
    }

    res.status(200).json({
      success: true,
      msg: "Deal added successfully",
      deal: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Deal Get All
adminRouter.get("/deals", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    const response_arr = [];

    const data = await CustomTable.find({ slug_name: "deal" })
    .lean()
    .sort({position:1})
    .populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data && data.length > 0) {
      for (const d of data) {
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(country){
                new_values.push({ value:country._id,label:country.title,ref:ref });
              }              
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(industry){
                new_values.push({ value:industry._id,label:industry.title,ref:ref });
              }              
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(cluster){
                new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
              }              
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              if(stage){
                new_values.push( { value:stage._id,label:stage.name,ref:ref });
              }              
            } else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }            
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr.push(d);
      }
    }

    res.status(200).json({
      success: true,
      msg: "Deal get successfully",
      deals: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Deal
adminRouter.get("/deal/:id", async function (req, res) {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, slug_name: "deal" });
    res.status(200).json({
      success: true,
      msg: "Deal detail get successfully",
      deal: deal,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Deal
adminRouter.delete("/deal/delete/:id", async function (req, res) {
  try {
    // Get Data
    const deal = await CustomTable.findById(req.params.id);
    if (!deal) {
      return res.status(200).json({
        success: false,
        msg: "No field found!",
      });
    }
    await CustomTable.findByIdAndRemove({ _id: req.params.id });
    await CustomTableFieldValue.remove({ custom_table: req.params.id });
    res
      .status(200)
      .json({ success: true, msg: "Deal field deleted successfully!" });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Deals Update
adminRouter.post("/deal/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const {
      _id,
      user,
      table_name,
      slug_name,
      column_name,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
      values,
    } = req.body;
    let column_slug = convertToSlug(column_name);
  
    // Check Title
    const check_unique = await CustomTable.find({
      $and: [{ column_name }, { slug_name }, { _id: { $ne: _id } }],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Column must be unique." });
    }
  
    let finalData = {
      table_name,
      slug_name,
      column_name,
      column_slug,
      column_type,
      is_editable,
      is_sortable,
      is_filterable,
      is_required,
      position,
    };
    const deal = await CustomTable.findOneAndUpdate( { _id: req.body._id },{ $set: finalData }, { multi: true, new: true });
  
    await CustomTableFieldValue.remove({ custom_table: req.body._id });
    if (values && values.length > 0) {
      // Delete Old Data
      for (let index = 0; index < values.length; index++) {
        const element = values[index];
        await new CustomTableFieldValue({
          custom_table: deal._id,
          column_value: element.value,
          ref: element.ref ? element.ref : "",
        }).save();
      }
    }
  
  
    // Fetch Data
    let response_arr = {};
    
    const data = await CustomTable.findOne({ _id:req.body._id  }).lean().populate({
      path: "values",
      select: "column_value ref -_id -custom_table",
    });
    if (data) {
        let d = data;
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
  
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:country._id,label:country.title,ref:ref });
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:industry._id,label:industry.title,ref:ref });
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              new_values.push( { value:stage._id,label:stage.name,ref:ref });
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "contact") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else if (ref && ref === "user") {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr=d;
    }

    res.status(200).json({
      success: true,
      msg: "Deals updated successfully",
      deal: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});


// Define Update Field Position
adminRouter.post("/field/changePosition", async function (req, res) {
  try {
    console.log("body:", req.body);

    const { fieldId, last_position, current_position, slug_name } = req.body;

    const check_field = CustomTable.findById(fieldId);
    if (check_field) {
      // Change Other Field Position
      await CustomTable.findOneAndUpdate(
        { position: current_position, slug_name },
        { $set: { position: last_position } },
        { new: true }
      );
      // Change Field Position
      await CustomTable.findOneAndUpdate(
        { position: last_position, _id: fieldId, slug_name },
        { $set: { position: current_position } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        msg: "Field position updated successfully",
      });
    } else {
      res.status(200).json({ success: false, msg: "Field not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// ::::::::::::::::::::::::::::::::::::::::: Reasons :::::::::::::::::::::::::::::::::::::::::
// Define Reason Add
adminRouter.post("/reason/add", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { title } = req.body;

    // Check Title
    const check_unique = await Reason.find({
      title: { $regex: `^${title}$`, $options: "i" },
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const newReason = new Reason(req.body);
    let reason = await newReason.save();

    var response_arr = {
      _id: reason._id,
      title: reason.title,
      status: reason.status,
    };

    res.status(200).json({
      success: true,
      msg: "Reason added successfully",
      reason: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Reason Get All
adminRouter.get("/reasons", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");

    var filter = {};

    if (req.query.search_keyword && req.query.search_keyword !== "null") {
      // For Status Check
      const enable_str = "Enable";
      const disable_str = "Disable";
      var status_check = "";

      if (
        enable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 1;
      } else if (
        disable_str
          .toLowerCase()
          .includes(req.query.search_keyword.toLowerCase())
      ) {
        status_check = 2;
      }

      filter = {
        $or: [
          { title: { $regex: `${req.query.search_keyword}`, $options: "i" } },
          { status: status_check },
        ],
      };
    }

    console.log("filter:", JSON.stringify(filter));

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = ReasonLimit;
    const totalRecords = await Reason.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    var reasons = await Reason.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Reason get successfully",
      reasons: reasons,
      pagination: { recordsPerPage, totalRecords, totalPages, page, recordRange },
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined All Reasons
adminRouter.get("/all_reasons", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var limit = 0;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }
    var reasons = await Reason.find(
      { status: 1 },
      { title: 1, status: 1, status_text: 1 }
    )
      .lean({ virtuals: true })
      .limit(limit)
      .sort({ _id: -1 });

    res.status(200).json({
      success: true,
      msg: "Reason get successfully",
      reasons: reasons,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Single Reason
adminRouter.get("/reason/:id", async function (req, res) {
  try {
    const reason = await Reason.findOne(
      { _id: req.params.id },
      { title: 1, status: 1 }
    );
    res.status(200).json({
      success: true,
      msg: "Reason detail get successfully",
      reason: reason,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Define Reason Update
adminRouter.post("/reason/update", async function (req, res) {
  try {
    console.log("body:", req.body);
    console.log("files:", req.file);

    const { _id, title, status } = req.body;

    // Check Title
    const check_unique = await Reason.find({
      $and: [
        { title: { $regex: `^${title}$`, $options: "i" } },
        { _id: { $ne: _id } },
      ],
    }).count();
    if (check_unique) {
      return res
        .status(200)
        .json({ success: false, msg: "Title must be unique." });
    }

    const reason = Reason.findById(_id);
    if (reason) {
      var newData = {
        title,
        status,
      };

      Reason.findOneAndUpdate(
        { _id: _id },
        { $set: newData },
        { multi: true, new: true },
        function (err, reason) {
          if (err) throw err;
          var response_arr = {
            _id: reason._id,
            title: reason.title,
            status: reason.status,
          };
          res.status(200).json({
            success: true,
            msg: "Reason updated successfully",
            reason: response_arr,
          });
        }
      );
    } else {
      res.status(400).json({ success: false, msg: "Reason not found!" });
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Delete Reason
adminRouter.delete("/reason/delete/:id", async function (req, res) {
  try {
    var filter = {};

    // Get Data
    const reason = await Reason.findById(req.params.id);
    if (!reason) {
      return res.status(200).json({
        success: false,
        msg: "No data find",
      });
    }

    await Reason.findByIdAndRemove({ _id: req.params.id });

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = ReasonLimit;
    const totalRecords = await Reason.find(filter).count();
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var reasons = await Reason.find(filter, {
      title: 1,
      status: 1,
      status_text: 1,
    })
      .lean({ virtuals: true })
      .limit(recordsPerPage)
      .skip(skipRecords)
      .sort({ _id: -1 });

    res
      .status(200)
      .json({
        success: true,
        msg: "Reason deleted successfully",
        reasons: reasons,
        pagination: { recordsPerPage, totalRecords, totalPages, page },
      });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Defined Get Lost Report
adminRouter.get("/report/lostDealReport", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    const response_arr = [];
    var filter = {action:'deal_lost'};

    var lost_by       = req.query.lost_by ? req.query.lost_by : '';
    var lost_reason   = req.query.lost_reason ? req.query.lost_reason : '';
    var date_range    = req.query.date_range ? req.query.date_range : '';

    if(lost_by){
      filter = {...filter, user:lost_by};
    }

    if(lost_reason){
      filter = {...filter, reason:lost_reason};
    }

    if(date_range){
      let split_date  = date_range.split(",");
      let start_date  = split_date[0];
      let end_date    = split_date[1];            
      filter = { ...filter, 'updated_at': {$gte: new Date(new Date(start_date).setHours(00, 00, 00)),
        $lt: new Date(new Date(end_date).setHours(23, 59, 59))} };
    }
    console.log("filter",filter);

    var temp_reports = [];
    var sort_lost_reports = await DealAction.find(filter).lean({ virtuals: true }).sort({ _id: -1 });
    if(sort_lost_reports && sort_lost_reports.length > 0){
      for (const report of sort_lost_reports) {
        let deal    = report.deal;        
        let user    = report.user;
        let get_latest_status = await DealAction.findOne({deal:deal,user:user}).sort({ "updated_at": -1 }).lean();
        if(get_latest_status && get_latest_status.action == 'deal_lost'){
          temp_reports.push(get_latest_status);
        }
      }
    }

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = LostReportLimit;
    const totalRecords = temp_reports.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);

    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    // var lost_reports = await DealAction.find(filter).lean({ virtuals: true })
    //   .limit(recordsPerPage)
    //   .skip(skipRecords)
    //   .sort({ _id: -1 });

    let new_list = temp_reports.slice(skipRecords);
    new_list = new_list.slice(0,recordsPerPage);

    if(new_list && new_list.length > 0){
      for (const report of new_list) {
        let action_id = report._id;
        let deal_id = report.deal;
        let reason_id  = report.reason;
        let reported_user_id  = report.user;
        let organization = '';
        let contact_name = '';
        let responsible = '';
        let lost_reason = '';
        let reported_user = '';

        const dealInfo = await Deal.findById(deal_id,{contact_name:1,responsible:1,organization:1,value:1}).lean();
        if(dealInfo){
          if(dealInfo.organization && dealInfo.organization.value){
            const organizationInfo = await Organization.findById(dealInfo.organization.value, {organization:1}).lean();
            organization = (organizationInfo) ? organizationInfo.organization : '';
          }

          if(dealInfo.contact_name && dealInfo.contact_name.value){
            const contactInfo = await Contact.findById(dealInfo.contact_name.value, {contact_name:1}).lean();
            contact_name = (contactInfo) ? contactInfo.contact_name : '';
          }

          if(dealInfo.responsible && dealInfo.responsible.value){
            const responsibleInfo = await User.findById(dealInfo.responsible.value, {username:1}).lean();
            responsible = (responsibleInfo) ? responsibleInfo.username : '';
          }
          
          if(reason_id){
            const reasonInfo = await Reason.findById(reason_id, {title:1}).lean();
            lost_reason = (reasonInfo) ? reasonInfo.title : '';
          }

          if(reported_user_id){
            const reportUserInfo = await User.findById(reported_user_id, {username:1}).lean();
            reported_user = (reportUserInfo) ? reportUserInfo.username : '';
          }
          
          // Get Deal Data
          response_arr.push({
            "_id":action_id,
            "deal_id":deal_id, 
            "organization":organization, 
            "contact_name":contact_name, 
            "responsible":responsible, 
            "reported_user":reported_user,
            "lost_reason":lost_reason, 
            "action_date_time":moment(report.updated_at).tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
          });
        }        
      }
    }

    res.status(200).json({
      success: true,
      msg: "Lost reports get successfully",
      reports: response_arr,
      pagination: { recordsPerPage, totalRecords, totalPages, page, recordRange },
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

module.exports = adminRouter;
