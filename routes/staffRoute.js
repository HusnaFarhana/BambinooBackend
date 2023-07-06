const express = require("express");
const router = express.Router();
const staffController = require("../controller/staffController");


//-------------------GET---------------------------
router.get("/myprofile/:data", staffController.myProfile);
router.get("/mypupils/:id", staffController.getPupils);
router.get("/singlekid/:id", staffController.singleKid);


//-------------------POST---------------------------
router.post("/stafflogin", staffController.staffLogin);


module.exports = router;
