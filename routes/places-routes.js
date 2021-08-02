const { check } = require("express-validator");
const express = require("express");
const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require('../middleware/auth');

const router = express.Router();

router.get("/", placesControllers.getAllPlaces)
router.get("/:pid", placesControllers.getPlaceById);


router.get("/user/:uid", placesControllers.getPlacesByUserId);
router.use(checkAuth);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);
router.delete("/:pid", placesControllers.deletePlace);

router.post(
  "/",
  fileUpload.single('image'),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

module.exports = router;
