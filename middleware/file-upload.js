const multer = require('multer');
const uuid = require("uuid/v1");


const MINE_TYPE_MAP = {
    "image/png" : "png",
    "image/jpeg" : "jpeg",
    "image/jpg" : "jpg"
};

const fileUpload = multer({
    limits: 5000000,
    storage: multer.diskStorage({
        destination: (req, file, callBack) => {
            callBack(null, "uploads/images")
        },
        filename: (req, file, callBack) => {
            const ext = MINE_TYPE_MAP[file.mimetype];
            callBack(null, uuid() + "." + ext);
        }
    }),
    fileFilter: (req, file, callBack) => {
        const isValid = !!MINE_TYPE_MAP[file.mimetype];
        let error = isValid ? null : new Error("Invalid MIME type");
        callBack(error, isValid);
    }
});

module.exports = fileUpload;