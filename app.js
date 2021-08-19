require('dotenv').config();
///////////////////////////////////////////////////// MODULES /////////////////////////////////////////////////////////////
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
///////////////////////////////////////////////////// PASSPORT MODULES /////////////////////////////////////////////////////////////
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
///////////////////////////////////////////////////// GOOGLE MODULES /////////////////////////////////////////////////////////////
const GoogleStrategy = require('passport-google-oauth20').Strategy;
///////////////////////////////////////////////////// FACEBOOK MODULES /////////////////////////////////////////////////////////////
const FacebookStrategy = require("passport-facebook").Strategy;

// APP INITIALIZATION FOR EXPRESS
const app = express();

app.use(express.static("public"));  //TO CONNECT THE PUBLIC FILES
app.set("view engine", "ejs");      //TO USE THE EJS FILES
app.use(express.urlencoded({extended:true})); //TO USE BODY PARSER

//Use session with initial configuration
app.use(session({
    secret: 'This is a fucking secret',
    resave: false,
    saveUninitialized: false,
  }));

app.use(passport.initialize()); //Use to initialized passport
app.use(passport.session()); //Use passport to deal with the session

///////////////////////////////////////////////////// DATABASE CONNECTION  /////////////////////////////////////////////////////////////
mongoose.connect('mongodb://localhost:27017/section32DB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true); //For deprecation warning

// DATABASE SCHEMA
const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    password: {
        type: String,
    },
    googleId: String,
    facebookId: String,
    secret: String,
});

//Using passport-local-mongoose for authentication
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// DATABASE MODEL
const User = mongoose.model('User', userSchema);

///////////////////////////////////////////////////// PASSPORT-LOCAL-MONGOOSE USAGE /////////////////////////////////////////////////////////////
// To setup passport-local LocalStrategy
passport.use(User.createStrategy()); 
// To create the cookies of the user when in session/login
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
// To remove the cookies of the user when out of the session/logout
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

///////////////////////////////////////////////////// SETTING UP GOOGLE STRATEGY  /////////////////////////////////////////////////////////////
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///////////////////////////////////////////////////// SETTING UP FACEBOOK STRATEGY  /////////////////////////////////////////////////////////////
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FB,
    clientSecret: process.env.CLIENT_SECRET_FB,
    callbackURL: "http://localhost:3000/auth/facebook/secret"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///////////////////////////////////////////////////// HOME ROUTE /////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    res.render("home");
})

///////////////////////////////////////////////////// GOOGLE AUTH ROUTE /////////////////////////////////////////////////////////////
app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] })
  );

app.get("/auth/google/secret", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

///////////////////////////////////////////////////// FACEBOOK AUTH ROUTE /////////////////////////////////////////////////////////////
app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secret",
  passport.authenticate("facebook", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

///////////////////////////////////////////////////// REGISTER ROUTE /////////////////////////////////////////////////////////////

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", (req, res) => {

    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });

});

///////////////////////////////////////////////////// LOGIN ROUTE /////////////////////////////////////////////////////////////

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) =>{
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    })
});

///////////////////////////////////////////////////// SECRETS ROUTE /////////////////////////////////////////////////////////////
app.get("/secrets", (req, res) => {
    User.find({"secret": {$ne: null}}, (err, foundUsers) =>{
        if(err){
            console.log(err);
        } else {
            if(foundUsers){
                res.render("secrets", {
                    usersWithSecrets: foundUsers
                })
            }
        }
    })
})

///////////////////////////////////////////////////// SUBMIT ROUTE /////////////////////////////////////////////////////////////
app.get("/submit", (req, res) => {
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    
    User.findById(req.user._id, (err, foundUser) => {
        if (foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save(() => {
                res.redirect("/secrets");
            });
        } else {
            console.log("User not found!");
        }
    })
})


///////////////////////////////////////////////////// LOGOUT ROUTE /////////////////////////////////////////////////////////////
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
})

///////////////////////////////////////////////////// TO LISTEN IN THE PORT /////////////////////////////////////////////////////////////
app.listen(3000, () => {
    console.log("Server started and running in port 3000");
})