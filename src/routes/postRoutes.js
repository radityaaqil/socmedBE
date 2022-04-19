const express = require("express");
const { postCaption, editPostCaption, getAllPost } = require("../controllers/postControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");


Router.post("/postcaption", verifyTokenAccess, postCaption);
Router.post("/editpostcaption", verifyTokenAccess, editPostCaption);
Router.get("/getpost", verifyTokenAccess, getAllPost);


module.exports = Router;