const express = require("express");
const {  addProfilePhoto } = require("../controllers/profileControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const upload = require("../lib/upload");

const uploader = upload("/photos", "PHOTO").single("profile_picture");

Router.patch("/",verifyTokenAccess, uploader, addProfilePhoto);


module.exports = Router;