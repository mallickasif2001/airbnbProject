// Load environment variables (only in development)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// DB URL
const dbUrl = process.env.ATLASDB_URL || "mongodb://localhost:27017/wanderlust";


// -----------------------------------
// Database Connection
// -----------------------------------
async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to DB");
  } catch (err) {
    console.error("Database Connection Error:", err);
  }
}
main();


// -----------------------------------
// Basic App Setup
// -----------------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));


// -----------------------------------
// Session Store (Fixed Version)
// -----------------------------------
const store = MongoStore.create({
  mongoUrl: dbUrl,
  // ❌ crypto.secret removed → It breaks connect-mongo latest version
  touchAfter: 24 * 3600, // Update session only once per day
});

// Error listener for store
store.on("error", (err) => {
  console.error("SESSION STORE ERROR:", err);
});

// Session configuration
const sessionOptions = {
  store,
  secret: "mysupersecretcode", // keep secret here only
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};




store.on("error", (err) => {
  console.error("ERROR in MONGO SESSION STORE:", err);
});


app.use(session(sessionOptions));
app.use(flash());


// -----------------------------------
// Passport Setup
// -----------------------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// -----------------------------------
// Flash + Current User Middleware
// -----------------------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


// -----------------------------------
// Routes
// -----------------------------------
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


// -----------------------------------
// 404 Handler
// -----------------------------------
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});


// -----------------------------------
// Global Error Handler
// -----------------------------------
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});


// -----------------------------------
// Server Start
// -----------------------------------
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
