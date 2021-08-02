const { Router } = require("express");
const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");

const userControllers = require("../controllers/user-controllers");

const routeUser = express.Router();

routeUser.get("/", userControllers.allUsers);

routeUser.get("/:uid", userControllers.getUserById);

routeUser.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({min: 5})
  ],
  userControllers.createUser
);
routeUser.post("/login", userControllers.login);

routeUser.patch("/:uid", userControllers.updateUser);
routeUser.delete("/:uid", userControllers.deleteUser);

module.exports = routeUser;
