///////////////////////////////////////////////////// ENVIRONMENT VARIABLES /////////////////////////////////////////////////////////////
require('dotenv').config();

///////////////////////////////////////////////////// MODULES /////////////////////////////////////////////////////////////
const express = require("express");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

// APP INITIALIZATION FOR EXPRESS
const app = express();

app.use(express.static("public"));  //TO CONNECT THE PUBLIC FILES
app.set("view engine", "ejs");      //TO USE THE EJS FILES
app.use(express.urlencoded({extended:true})); //TO USE BODY PARSER

///////////////////////////////////////////////////// DATABASE CONNECTION  /////////////////////////////////////////////////////////////
mongoose.connect('mongodb://localhost:27017/section32DB', {useNewUrlParser: true, useUnifiedTopology: true});

// DATABASE SCHEMA
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

// TO ENCRYPT OUR PASSWORD
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

// DATABASE MODEL
const User = mongoose.model('User', userSchema);

///////////////////////////////////////////////////// HOME ROUTE /////////////////////////////////////////////////////////////

app.get("/", (req, res) => {
    res.render("home");
})

///////////////////////////////////////////////////// REGISTER ROUTE /////////////////////////////////////////////////////////////

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", (req, res) => {
    const newUser = new User({ 
        email: req.body.username,
        password: req.body.password,
    });

    newUser.save((err) => {
        if (!err) {
            console.log("Successfully added a new user!");
            res.redirect("/");
        } else{
            console.log(err);
        }
    })

})

///////////////////////////////////////////////////// LOGIN ROUTE /////////////////////////////////////////////////////////////

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", (req, res) => {
    User.findOne({email: req.body.username}, (err, foundUser) =>{

        if(foundUser){
           if (foundUser.password === req.body.password){
               res.render("secrets");
           } else{
               res.send("The account is invalid! Please input a valid account or register first.");
           }
        } else {
            res.send("The account is invalid! Please input a valid account or register first.");
        }
    })
})

///////////////////////////////////////////////////// TO LISTEN IN THE PORT /////////////////////////////////////////////////////////////
app.listen(3000, () => {
    console.log("Server started and running in port 3000");
})