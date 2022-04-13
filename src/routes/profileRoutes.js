const express = require("express");
const { updateProfile } = require("../controllers/profileControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");


Router.patch("/updateprofile", verifyTokenAccess, updateProfile);


module.exports = Router;