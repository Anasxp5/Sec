//jshint esversion:6
require("dotenv").config();

const express = require("express");

const bodyParser = require("body-parser");

const ejs = require("ejs");

const mongoose = require("mongoose");

// const bcrypt = require("bcrypt");

const session = require("express-session");

const passport = require("passport");

const findOrCreate = require("mongoose-findorcreate");

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passportLocalMongoose = require("passport-local-mongoose");
// const encrypt = require("mongoose-encryption");

// const md5 = require("md5");

const app = express();

const saltRounds = 10;

console.log(process.env.API_KEY);

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Our little secrets.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secuserDB", {
  useNewUrlParser: true,
});

// mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
// const secret = "Thisisourlittlesecret";
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      passReqToCallback: true,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (request, accessToken, refreshToken, profile, done) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    console.log(err);
  });
  res.redirect("/");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.post("/register", function (req, res) {
  // bcrypt
  //   .hash(req.body.password, saltRounds)
  //   .then((hash) => {
  //     const newUser = new User({
  //       email: req.body.username,
  //       password: hash,
  //     });

  //     newUser
  //       .save()
  //       .then(() => console.log("Inserted"))
  //       .catch((err) => console.log(err));
  //   })
  //   .catch((err) => console.log(err));

  User.register(
    {
      username: req.body.username,
    },
    req.body.password
  )
    .then((user) => {
      passport.authenticate("local")(req, res, function (req, res) {
        res.redirect("/secrets");
      });
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/register");
    });
});

app.post("/login", function (req, res) {
  // const username = req.body.username;
  // const password = req.body.password;
  // User.findOne({ email: username })
  //   .then((foundUser) => {
  //     if (foundUser) {
  //       bcrypt
  //         .compare(password, foundUser.password)
  //         .then((result) => {
  //           if (result == true) {
  //             res.render("secrets");
  //           }
  //         })
  //         .catch((err) => console.log(err));
  //     }
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });

app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;

  console.log(req.user)
})

  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function (req, res) {
  console.log("Server is running on port 3000");
});
