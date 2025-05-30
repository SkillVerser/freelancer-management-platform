require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth-routes");
const passportSetup = require("./configs/passport-setup");
const { connectDB } = require("./configs/db-conn");
//const User = require("./models/User");
const userRoutes = require("./routes/user-routes");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const serviceRequestRoutes = require("./routes/service-request-routes");
const paymentRoutes = require("./routes/payment-routes");
const applicationRoutes = require("./routes/application-routes");
const milestoneRoutes = require("./routes/milestone-routes");
const webhookRoutes = require("./routes/webhook");
const fileRoutes = require("./routes/file-routes");
const adminRoutes = require("./routes/admin-routes");
const MongoStore = require("connect-mongo"); // for storing sessions in MongoDB
//const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const app = express();

// allows session to work properly with Azure's reverse proxy
// (this is needed for production, but not for local development)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

//Testing for stripe payment
const Items = new Map([
  [1, { priceInCents: 10000, name: "Software Developer" }],
  [2, { priceInCents: 20000, name: "Graphics Designer" }],
]);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"], //update backend to allow delete method
  })
);

app.use(express.json()); //middleware that allows us to accept JSON data in req.body

// use cookies
// lifetime of the cookie is one day and encrypt key
app.use(
  session({
    secret: process.env.COOKIE_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
    // stores user sessions in MongoDB
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Set up routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/webhook", webhookRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);

//set up payment routes
app.use("/payments", paymentRoutes);

// Set up the service request routes (this should be before the app.listen)
app.use("/api/service-requests", serviceRequestRoutes);

//app.use("/api", userRoutes);//route that works
app.use("/api/users", userRoutes); //get info of all users for admin list
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB(); // Connects to the database
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
