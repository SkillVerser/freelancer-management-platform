const router = require("express").Router();
const passport = require("passport");

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000";

//auth logout
router.get("/logout", (req, res) => {
  console.log("Logout called. Session:", req.session, "User:", req.user);
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err); // log the error for debugging
      return res.status(500).send("Error logging out");
    }
    req.session.destroy((err) => {
      // destory the session
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).send("Error destroying session");
      }
      res.clearCookie("connect.sid", {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }); // clear the cookie
      res.status(200).send("Logout successful"); // send success response
    });
  });
});

//auth with google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

//callback route for google to redirect to
router.get("/google/callback", passport.authenticate("google"), (req, res) => {
  // to access currently logged in user : res.send(req.user)
  console.log("User in /google/callback route:", req.user); // Log the user info for debugging
  const isNewUser = req.user?.role === undefined; // Assuming role is not yet set for new users

  if (isNewUser) {
    res.redirect(`${FRONTEND_URL}/roles?userId=${req.user._id}`); // Frontend route for setting role
    //userID needs to be fetched for request purposes
  } else {
    const user_role = req.user.role;
    res.redirect(`${FRONTEND_URL}/${user_role}/home`);
  }
});

router.get("/me", (req, res) => {
  console.log("User Info:", req.user); // log the user info for debugging
  console.log("Session Info:", req.session); // log the session info for debugging
  console.log("Checking for req.user.email:", req.user?._tempEmail);

  //gets current logged in users info from session for reqs
  if (req.user) {
    const userObj = req.user.toObject(); //convert mongoose doc to plain json object
    userObj.email = req.user._tempEmail; //add email
    //console.log("userObj:", userObj);
    res.status(200).json(userObj);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

module.exports = router;
