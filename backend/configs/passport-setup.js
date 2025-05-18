const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/User");

passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    email: user._tempEmail || null,
  });
});

passport.deserializeUser((obj, done) => {
  User.findById(obj.id).then((user) => {
    if (user) {
      user._tempEmail = obj.email;
    }
    done(null, user);
  });
});

// Get the frontend URL from environment variable or fallback to localhost for development
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || "development";

// Set callback URL based on environment
const callbackURL =
  process.env.NODE_ENV === "production"
    ? "https://skillverse-backend.azurewebsites.net/auth/google/callback"
    : "http://localhost:5000/auth/google/callback"; // for local development

passport.use(
  new GoogleStrategy(
    {
      callbackURL: callbackURL,
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Profile Information:", profile);
        console.log("profile email:", profile.emails[0].value);
        const email = profile.emails[0]?.value;
        const existingUser = await User.findOne({ googleID: profile.id });

        if (existingUser) {
          console.log(`Logging in User ${profile.id}`);
          existingUser._tempEmail = email; // temporarily attach email to be stored in session, not in DB
          return done(null, existingUser);
        } else {
          const newUser = new User({
            googleID: profile.id,
            username: profile.displayName,
          });
          await newUser.save();
          newUser._tempEmail = email;
          console.log(`New User Created: ${newUser}`);
          return done(null, newUser);
        }
      } catch (error) {
        console.error("Error in Google strategy callback:", error);
        return done(error, null);
      }
    }
  )
);
