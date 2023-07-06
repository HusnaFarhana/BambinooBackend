const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");


//-------------------GET---------------------------
router.get("/getTutors", adminController.viewStaffs);
router.get("/getkids", adminController.getKids);
router.get("/getplans", adminController.getPlans);
router.get("/tutors/tutorprofile/:data", adminController.tutorProfile);
router.get("/getusers", adminController.getUsers);
router.get("/getdash", adminController.getDash);
router.get("/kids/profile/:id", adminController.getBabyProfile);
router.get("/getplan/:id", adminController.getAPlan);
router.get("/deletestaff/:id", adminController.deleteStaff);
router.get("/payments", adminController.payments);
router.get("/chathistory", adminController.getChatHistory);


//-------------------POST--------------------------
router.post("/adminLogin", adminController.postAdminLogin);
router.post("/addTutor", adminController.addTutor);
router.post("/addplan", adminController.addPlan);
router.post("/allot", adminController.allot);
router.post("/edittutor", adminController.editTutor);
router.post("/editplan", adminController.editPlan);


module.exports = router;
