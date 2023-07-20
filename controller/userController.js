const User = require("../model/userModel");
const Baby = require("../model/babyModel");
const Plan = require("../model/subscriptonModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const accountSID = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const serviceId = process.env.SERVICE_ID;
const Razorpay = require("razorpay");
const client = require("twilio")(accountSID, authToken);
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.KEYID,
  key_secret: process.env.KEYSECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.APIKEY,
  api_secret: process.env.APISECRET,
});

const userRegister = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const emailExists = await User.findOne({ email: req.body.email });

    if (emailExists) {
      return res.json({
        message: "The email already exists",
        emailExists: true,
      });
    }

    const mobile = req.body.contactnum;
    const result = {
      name: req.body.name,
      email: req.body.email,
      dob: req.body.dob,
      password: hashedPassword,
      contact: req.body.contactnum,
      adhar: req.body.adhar,
    };

    client.verify.v2
      .services(serviceId)
      .verifications.create({ to: `+91${mobile}`, channel: "sms" })
      .then((verification) => {
        console.log(verification.status);
        res.status(200).json({
          status: "true",
          message: "new User waiting for verification",
          result,
        });
      })
      .catch((error) => {
        console.error("Twilio verification request error:", error);
        res
          .status(500)
          .json({ status: "error", message: "Verification request failed" });
      });
  } catch (error) {
    console.error("User registration error:", error);
    res
      .status(500)
      .json({ status: "error", message: "User registration failed" });
  }
};



const getNav = async (req, res) => {
  try {
    const data = await User.findById(req.params.id);
    res.status(200).json({ data: data });
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    const id = req.body.data;
    const user = await User.findByIdAndUpdate(id, { token: null });
    if (user) {
      res.status(200).json({ status: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const registerKid = async (req, res) => {
  try {
    const imageFile = req.body.image;

    const uploadResult = await cloudinary.uploader.upload(imageFile, {
      folder: "kid-images",
    });

    const imageUrl = uploadResult.secure_url;
    const result = await Baby({
      name: req.body.name,
      dob: req.body.dob,
      gender: req.body.gender,
      medications: req.body.medical,
      relation: req.body.relation,
      subscription: {
        id: req.body.plan.id,
        date: new Date(),
        expDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        paymentid: req.body.paymentid,
      },
      image: imageUrl,
      parent: req.body.user,
    });

    const babyData = await result.save();
    await User.findByIdAndUpdate(req.body.user, {
      $push: { mykids: babyData._id },
    });
    await Plan.findByIdAndUpdate(req.body.plan.id, {
      $push: { users: babyData._id },
    });
    res.status(200).json({ data: "hi" });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(401).json({ message: "cannot find user" });
    }
    if (await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign(
        { name: user.name, userid: user._id },
        process.env.JWT_CODE,
        {
          expiresIn: "1h",
        }
      );
      const upd = await User.findOneAndUpdate(
        { email: req.body.email },
        {
          $set: { token: token },
        }
      );
      res.status(200).json({ token });
    } else {
      res.status(401).json({ message: "wrong password" });
    }
  } catch (err) {
    console.log(err);
  }
};

const otpLogin = async (req, res) => {
  try {
    const mobile = req.body.phone;
    const user = await User.findOne({ contact: req.body.phone });
    if (!user) {
      res
        .status(401)
        .json({ message: "cannot find user with this phone number" });
    } else {
      client.verify.v2
        .services(serviceId)
        .verifications.create({ to: `+91${mobile}`, channel: "sms" })
        .then((verification) => {
          console.log(verification.status);
        })
        .catch((error) => {
          console.error("Twilio verification request error:", error);
        });

      res.status(200).json({ success: true, data: req.body.phone });
    }
  } catch (err) {
    console.log(err);
  }
};

const userProfile = async (req, res) => {
  try {
    const data = req.params;
    const userid = data.data;
    const user = await User.find({ _id: userid });
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
  }
};

const myKids = async (req, res) => {
  try {
    const data = req.params;
    const userid = data.data;
    const kid = await Baby.find({ parent: userid, active: true }).populate(
      "parent"
    );
    res.status(200).json({ kid });
  } catch (error) {
    console.log(error);
  }
};

const updateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          dob: req.body.dob,
          contact: req.body.contact,
          adhar: req.body.adhar,
        },
      }
    );
    res.status(200).json({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};

const babyprofile = async (req, res) => {
  try {
    const id = req.params.data;
    const baby = await Baby.findOne({ _id: id })
      .populate("parent")
      .populate("subscription.id");
    res.status(200).json({ baby });
  } catch (error) {
    console.log(error.message);
  }
};

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

const verifyOtpLogin = async (req, res) => {
  const otp = req.body.otp;
  const mob = req.body.phone;

  client.verify.v2
    .services(serviceId)
    .verificationChecks.create({ to: `+91${mob}`, code: otp })
    .then(async (verification_check) => {
      console.log(verification_check.status);
      if (verification_check.status === "approved") {
        const token = generateToken();
        const user = await User.findOneAndUpdate(
          { contact: mob },
          { $set: { crypto: token } }
        );
        res
          .status(200)
          .json({ success: true, data: { phone: mob, token: token } });
      } else {
        res.status(400).json({ success: false, message: "invalid otp" });
      }
    })
    .catch((error) => {
      console.error("Twilio verification check error:", error);
      res
        .status(500)
        .json({ success: false, message: "Verification check failed" });
    });
};

const verifyotp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const mob = req.body.details.contact;

    client.verify.v2
      .services(serviceId)
      .verificationChecks.create({ to: `+91${mob}`, code: otp })
      .then(async (verification_check) => {
        console.log(verification_check.status);
        if (verification_check.status === "approved") {
          const user = new User({
            name: req.body.details.name,
            email: req.body.details.email,
            dob: req.body.details.dob,
            password: req.body.details.password,
            contact: req.body.details.contact,
            adhar: req.body.details.adhar,
            verified: true,
          });

          const userData = await user.save();
          const token = jwt.sign(
            { name: userData.name, userid: userData._id },
            process.env.JWT_CODE,
            {
              expiresIn: "1h",
            }
          );

          await User.findByIdAndUpdate(
            { _id: userData._id },
            {
              $set: { token: token },
            }
          );
          userData.token = token;
          res.status(200).json({ success: true, data: userData });
        } else {
          res.status(400).json({ success: false, message: "invalid otp" });
        }
      })
      .catch((error) => {
        console.error("Twilio verification check error:", error);
        res
          .status(500)
          .json({ success: false, message: "Verification check failed" });
      });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Verify OTP failed" });
  }
};

const getHome = async (req, res) => {
  try {
    const plans = await Plan.find({active:true});
    res.status(200).json({ plans: plans });
  } catch (error) {
    console.log(error.message);
  }
};

const editBaby = async (req, res) => {
  try {
    await Baby.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          dob: req.body.dob,
          medications: req.body.medical,
          gener: req.body.gender,
        },
      }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteBaby = async (req, res) => {
  try {
    await Baby.findOneAndUpdate(
      { _id: req.body.id },
      { $set: { active: false, "subscription.active": false } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};

const removeExpiredSubscriptions = async () => {
  try {
    const currentDate = new Date();
    const expiredBabies = await Baby.find({
      "subscription.expDate": { $lt: currentDate },
    });
    for (const baby of expiredBabies) {
      baby.subscription = null;
      await baby.save();
    }
  } catch (error) {
    console.log(error.message);
  }
};
const validateToken = async (req, res) => {
  try {
    const token = req.body.token;
    const user = await User.findOne({ crypto: token });
    console.log(user, "user with crypto");
    if (user) {
      res.status(200).json({ success: true });
    } else {
      res
        .status(200)
        .json({ success: "false", message: "Verification check failed" });
    }
  } catch (error) {}
};
const reset = async (req, res) => {
  try {

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(
      req.body.data.password.password,
      salt
    );
    
    const user = await User.findOneAndUpdate(
      { crypto: req.body.data.token },
      {
        $set: { password: hashedPassword, crypto: "" },
      }
    );

    if (user) {
      res.status(200).json({ success: true });
    } else {
      res
        .status(200)
        .json({ success: "false", message: "Verification check failed" });
    }
  } catch (error) {}
};

setInterval(removeExpiredSubscriptions, 6 * 60 * 60 * 1000);

module.exports = {
  getHome,
  getNav,
  userRegister,
  userLogin,
  userProfile,
  myKids,
  registerKid,
  updateUser,
  babyprofile,
  verifyotp,
  logout,
  editBaby,
  deleteBaby,
  otpLogin,
  verifyOtpLogin,
  validateToken,
  reset,
};
