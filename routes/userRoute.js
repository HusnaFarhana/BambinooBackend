const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");

//-------------------GET---------------------------
router.get("/home", userController.getHome);
router.get("/nav/:id", userController.getNav);
router.get("/userProfile/:data", userController.userProfile);
router.get("/mykids/:data", userController.myKids);
router.get("/mykids/babyprofile/:data", userController.babyprofile);


//-------------------POST---------------------------
router.post("/register", userController.userRegister);
router.post("/userLogin", userController.userLogin);
router.post("/otplogin", userController.otpLogin);
router.post("/verifyotp", userController.verifyOtpLogin);
router.post("/registerKid", userController.registerKid);
router.post("/updateuser", userController.updateUser);
router.post("/verify", userController.verifyotp);
router.post("/logout", userController.logout);
router.post("/mykids/editbaby", userController.editBaby);
router.post("/mykids/deletebaby", userController.deleteBaby);
router.post("/validatetoken", userController.validateToken);
router.post("/reset", userController.reset);


module.exports = router;
