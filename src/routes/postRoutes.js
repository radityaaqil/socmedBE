const express = require("express");
const { getAllPost, getPostCount, getUserPost, postCaptionImage, deletePost, getUserPostDetail, editPostCaptionImage, addLikes, insertComments, getComments, getCommentsCount, getUserComments, getUserPostMedia, getLikedPosts } = require("../controllers/postControllers");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/verifyToken");
const upload = require("../lib/upload");

const uploaderPostImage = upload("/photos", "POST_IMAGE").fields([
    { name: "image", maxCount: 4 },
]);


Router.get("/getpost", getAllPost);
Router.get("/getlikedpost", getLikedPosts);
Router.get("/getpostcount", verifyTokenAccess, getPostCount);
Router.get("/getcommentscount/:postID", verifyTokenAccess, getCommentsCount);
Router.get("/getuserpost", verifyTokenAccess, getUserPost);
Router.get("/getuserpostmedia", verifyTokenAccess, getUserPostMedia);
Router.get("/getuserpostdetail/:postID", verifyTokenAccess, getUserPostDetail);
Router.get("/getcomments/:postID", verifyTokenAccess, getComments);
Router.get("/getusercomment", verifyTokenAccess, getUserComments);



Router.post("/postcaptionimage", verifyTokenAccess, uploaderPostImage, postCaptionImage);
Router.post("/addlikes/:postID", verifyTokenAccess, addLikes);
Router.post("/comments/:postID", verifyTokenAccess, insertComments);

Router.delete("/deletepost/:postID", verifyTokenAccess, deletePost)

Router.patch("/editpostcaptionimage/:postID", verifyTokenAccess, uploaderPostImage, editPostCaptionImage)


module.exports = Router;