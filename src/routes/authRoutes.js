const express = require("express");
const Router = express.Router();
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/verifyToken");
const { authControllers } = require("./../controllers");
const { register, login, keeplogin, sendEmailVerified, accountVerified } = authControllers
const verifyLastToken = require("./../lib/verifyLastToken")

Router.post("/register", register);
Router.post("/login", login);
Router.get("/keeplogin", verifyTokenAccess, keeplogin)
Router.get("/verified", verifyTokenEmail, verifyLastToken, accountVerified);
Router.post("/sendemail-verified", sendEmailVerified)


module.exports = Router;