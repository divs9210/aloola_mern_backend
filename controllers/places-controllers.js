// const uuid = require("uuid/v4");
const { validationResult } = require("express-validator");
const getCoordinatesForAddress = require("./util/location");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");
const fs = require("fs");

const getAllPlaces = async (req, res, next) => {
  let results;
  try {
    results = await Place.find();
  } catch (error) {
    return next(new HttpError("Kuch ni mila...!", 404));
  }
  res.json({
    results: results.map((place) => place.toObject({ getters: true })),
  });
};

const getPlaceById = async (req, res, next) => {
  console.log("Get request in places-routes called");
  const pId = req.params.pid;
  let searchedPlace;
  try {
    searchedPlace = await Place.findById(pId);
  } catch (error) {
    return next(new HttpError("Didn't get the place in DB.", 404));
  }

  if (!searchedPlace) {
    return next(new HttpError("Couldn't find a place with the given id", 404));
    // return res
    //   .status(404)
    //   .json({ message: "Couldn't find a place with the given id" });
  } else {
    res
      .status(200)
      .json({ searchedPlace: searchedPlace.toObject({ getters: true }) });
  }
};

const getPlacesByUserId = async (req, res, next) => {
  console.log("Get request in places-routes called");
  const userId = req.params.uid;
  let placesByUser;
  try {
    placesByUser = await Place.find({
      creator: userId,
    });
  } catch (error) {
    return next(
      new HttpError("Didn't get the place in DB for given userID.", 404)
    );
  }

  if (!placesByUser || placesByUser.length === 0) {
    next(new HttpError("Couldn't find a place for the given user id", 404));
    // return res
    //   .status(404)
    //   .json({ message: "Couldn't find a place for the given user id" });
  } else {
    res.json({
      placesByUser: placesByUser.map((place) =>
        place.toObject({ getters: true })
      ),
    });
  }
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Inputs", 422));
  }
  console.log("places- route POST req reached");

  const { title, description, address, creator } = req.body;
  const coordinates = getCoordinatesForAddress();
  const createdPlace = new Place({
    title,
    description,
    location: coordinates,
    image: req.file.path,
    address,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    console.log(error.message);
    return next(
      new HttpError("Could not add a place with this creator id", 500)
    );
  }

  if (!user) {
    return next(new HttpError("could not add a place : userId is wrong", 404));
  }

  // DUMMY_PLACES.push(createdPlace); Not using DUMMY_PLACES anymore
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save();
    user.places.push(createdPlace);
    await user.save({ session: session });
    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(error);
  }
  res
    .status(201)
    .json({ placeAdded: createdPlace.toObject({ getters: true }) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid Inputs", 422));
  }
  console.log("patch request reached");
  const { title, description } = req.body;
  const placeId = req.params.pid;
  //Reaching to place which needs to be updated and updating the properties
  // by creating a copy of that object first.
  // const updatedPlace = {
  //   ...DUMMY_PLACES.find((place) => place.id === placeId),
  // };
  let updatedPlace;
  try {
    updatedPlace = await Place.findById(placeId);
  } catch (error) {
    return next(new HttpError("Something went wrong....with updation", 500));
  }
  updatedPlace.title = title;
  updatedPlace.description = description;

  if (updatedPlace.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError(
        "You are not allowed to do this operation, we had hidden buttons for you in the UI. You sure have some audacity to still put your request here. Get Out!",
        401
      )
    );
  }

  try {
    await updatedPlace.save();
  } catch (error) {
    return next(new HttpError("Something went wrong....with updation", 500));
  }
  //After updation finding index where updatedPlace needs to be sent
  // const updatingPlaceIndex = DUMMY_PLACES.findIndex(
  //   (place) => place.id === placeId
  // );

  // DUMMY_PLACES[updatingPlaceIndex] = updatedPlace;
  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  console.log("deleting place req called");
  try {
    const deletingPlaceId = req.params.pid;
    let deletingPlace;
    try {
      deletingPlace = await Place.findById(deletingPlaceId).populate("creator");
    } catch (error) {
      return next(new HttpError("place did not exist...", 404));
    }
    if (deletingPlace) {
      if(deletingPlace.id !== req.userData.userId){
        return next(new HttpError("You are not allowed", 403));
      }
      const imagePath = deletingPlace.image;
      console.log(imagePath);
      // DUMMY_PLACES = DUMMY_PLACES.filter((place) => place.id !== deletingPlaceId);
      try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await deletingPlace.remove({ session: session });
        deletingPlace.creator.places.pull(deletingPlace);
        await deletingPlace.creator.save({ session: session });
        await session.commitTransaction();
      } catch (error) {
        return next(new HttpError("place did not exist...", 404));
      }

      fs.unlink(imagePath, (err) => console.log(err));

      res.status(200).json({ message: "Deleted the item with specified id" });
    } else {
      next(new HttpError("No Place found with given Id", 404));
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.getAllPlaces = getAllPlaces;
exports.getPlacesByUserId = getPlacesByUserId;
exports.getPlaceById = getPlaceById;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
