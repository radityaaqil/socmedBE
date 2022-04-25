const express = require("express");
const { getAllPost, getPostCount, getUserPost, postCaptionImage, deletePost, getUserPostDetail, editPostCaptionImage } = require("../controllers/postControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const upload = require("../lib/upload");

const uploaderPostImage = upload("/photos", "POST_IMAGE").fields([
    { name: "image", maxCount: 4 },
]);


Router.get("/getpost", getAllPost);
Router.get("/getpostcount", verifyTokenAccess, getPostCount);
Router.get("/getuserpost", verifyTokenAccess, getUserPost);
Router.get("/getuserpostdetail/:postID", verifyTokenAccess, getUserPostDetail);

Router.post("/postcaptionimage", verifyTokenAccess, uploaderPostImage, postCaptionImage);

Router.delete("/deletepost/:postID", verifyTokenAccess, deletePost)

Router.patch("/editpostcaptionimage/:postID", verifyTokenAccess, uploaderPostImage, editPostCaptionImage)


module.exports = Router;