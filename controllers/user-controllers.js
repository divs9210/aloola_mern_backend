const uuid = require("uuid/v4");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const crypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUserById = (req, res, next) => {
  console.log("Get request in user route called");
  const uid = req.params.uid;
  const foundUser = DUMMY_USER.find((user) => {
    return user.id === uid;
  });
  if (!foundUser) {
    next(new HttpError("User not found"));
  } else {
    res.json({ foundUser });
  }
};

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Inputs", 422));
  }
  console.log("user-route POST req reached");
  const { name, email, password } = req.body;
  let hasUserAlready;
  try {
    hasUserAlready = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("User already exists", 409));
  }
  if (hasUserAlready) {
    return next(new HttpError("User Already Exists!", 409));
  }

  let hashedPassword;
  try {
    hashedPassword = await crypt.hash(password, 12);
  } catch (error) {
    return next(new HttpError("could not create user, try again!", 500));
  }
  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    console.log(error);
    return next(new HttpError("could not add User...try again"));
  }
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {}
  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const allUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
    console.log(`users`, users)
  } catch (error) {
    return next(new HttpError("Didn't get users. Try Again Later!", 404));
  }

  if (users.length !== 0) {
    res.status(200).json({
      AllUsers: users.map((user) => user.toObject({ getters: true })),
    });
  } else {
    next(new HttpError("No users found", 404));
  }
};

const updateUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  const updatingUserId = req.params.uid;

  let updatedUser;
  try {
    updatedUser = await User.findById(updatingUserId);
  } catch (error) {
    console.log(error.message);
  }
  updatedUser.name = name;
  updatedUser.email = email;
  updatedUser.password = password;

  try {
    await updatedUser.save();
  } catch (error) {
    return next(new HttpError("Could not update user", 500));
  }
  res
    .status(200)
    .json({ updatedUser: updatedUser.toObject({ getters: true }) });
};

const deleteUser = async (req, res, next) => {
  try {
    const Id = req.params.uid;
    let deletingUser;
    try {
      deletingUser = await User.findById(Id);
    } catch (error) {
      console.log(`error.message`, error.message);
      return next(new HttpError(`${error.message}`, 500));
    }
    if (deletingUser) {
      try {
        await deletingUser.remove();
        res.json({ message: "User deleted successfully!" });
      } catch (error) {
        return next(new HttpError("Cannot delete the user", 500));
      }
    }
  } catch (error) {
    console.log("error : ", error.message);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("User already exists", 409));
  }
  if (!identifiedUser) {
    next(new HttpError("Could not identify user.", 401));
  } else {
    let isValidPassword = false;
    try {
      isValidPassword = await crypt.compare(password, identifiedUser.password);
    } catch (error) {
 
      return next(new HttpError("Could not validate password", 404));
    }

    if (isValidPassword) {
      return next(new HttpError("Invalid Password", 401));
    }

    let token;
    try {
      token = jwt.sign(
        { userId: identifiedUser.id, email: identifiedUser.email },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
    } catch (error) {
      return next(new HttpError("Loggin In failed", 500));
    }
    res.status(200).json({
      userId: identifiedUser.id,
      email: identifiedUser.email,
      token: token,
    });
  }
};

exports.getUserById = getUserById;
exports.createUser = createUser;
exports.allUsers = allUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.login = login;
