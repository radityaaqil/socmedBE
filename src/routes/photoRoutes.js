const express = require("express");
const {  addProfilePhoto, addCoverPhoto, deleteCoverPhoto } = require("../controllers/profileControllers");
const {  postImage } = require("../controllers/postControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const upload = require("../lib/upload");

const uploader = upload("/photos", "PHOTO").single("profile_picture");
const uploaderCover = upload("/photos", "COVER_PHOTO").single("cover_picture");
const uploaderPostImage = upload("/photos", "POST_IMAGE").fields([
    { name: "caption", maxCount: 4 },
]);

Router.patch("/",verifyTokenAccess, uploader, addProfilePhoto);
Router.patch("/coverphotos",verifyTokenAccess, uploaderCover, addCoverPhoto);
Router.patch("/deletecoverphotos",verifyTokenAccess, deleteCoverPhoto);
Router.patch("/postimage",verifyTokenAccess, uploaderPostImage, postImage);


module.exports = Router;