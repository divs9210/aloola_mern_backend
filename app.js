require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const placesRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/user-routes");
const HttpError = require("./models/http-error");

const app = express();
const url =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hyy46.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


// app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "GET, POST, PATCH, DELETE",
    "OPTIONS"
  );

  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", userRoutes);

//If a request is not made on "/api/places/......" or "/api/users/...."
//Thus any wrong route will be sent on this "NO-ROUTE-MIDDLEWARE"
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

//Special Middleware function a.k.a error handling middleware
// In place-routes any middleware that is sending an error along with it's request
// will be passed down to this special middleware with 4 parameters.
app.use((err, req, res, next) => {
  console.log("Error Middleware reached");
  if (req.file) {
    fs.unlink(req.file.path, (error) => {
      console.log(error);
    });
  }
  if (res.headerSent) {
    return next(err);
  }
  res.status(err.code || 500);
  res.json({ message: err.message || "An error occurred" });
});

mongoose
  .connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Database Connected!");
    app.listen(5000, () => {
      console.log("Server has been started on PORT 5000");
    });
  })
  .catch((error) => console.log(error));
