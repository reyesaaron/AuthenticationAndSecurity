///////////////////////////////////////////////////// MODULES /////////////////////////////////////////////////////////////
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
///////////////////////////////////////////////////// PASSPORT MODULES /////////////////////////////////////////////////////////////
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

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
    }
});

//Using passport-local-mongoose for authentication
userSchema.plugin(passportLocalMongoose);

// DATABASE MODEL
const User = mongoose.model('User', userSchema);

///////////////////////////////////////////////////// PASSPORT-LOCAL-MONGOOSE USAGE /////////////////////////////////////////////////////////////
// To setup passport-local LocalStrategy
passport.use(User.createStrategy()); 
// To create the cookies of the user when in session/login
passport.serializeUser(User.serializeUser());
// To remove the cookies of the user when out of the session/logout
passport.deserializeUser(User.deserializeUser());

///////////////////////////////////////////////////// HOME ROUTE /////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    res.render("home");
})

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
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
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