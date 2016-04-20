#!/bin/env node
//  

var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var app = express();

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

//MongoD
if(process.env.OPENSHIFT_MONGODB_DB_URL){
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + "tenders";
}
else {
    mongodb_connection_string = 'mongodb://localhost:27017/tenders';
}
mongoose.connect(mongodb_connection_string);
var dbconn = mongoose.connection;
dbconn.on('error', console.error.bind(console, 'connection error:'));
dbconn.once('open', function(){
    console.log('Connected to Mongoose Database.');
});

// Close MongoD connection when app is terminated
process.on('SIGINT', function (){
   mongoose.disconnect();
   dbconn.close(function (){
       console.log("Server halted: Mongoose default connection disconnected.");
       process.exit(0);
   }); 
});

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating
// required for passport
app.use(session({ secret: (process.env.SECRET) ? process.env.SECRET : 'Hhkox50D' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // expose the req.flash() method that allows to create and retrieve the flash message
/*
app.use('/sendmail', function(req, res, next) { // Middleware for only the `/sendmail` route
    if (req.user) {
        next();
    } else {
        res.redirect("/");
    }
});
*/
//app.use(favicon(__dirname + '/public/assets/favicon.ico'));
// Look for static files like html, css, js in the given directory
//app.use(express.static(__dirname + "/public", {index:'login.html'}));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

// ======================================================================
require('./routes/routes')(app, passport); // load our routes and pass in our app and fully configured passport
require('./config/passport')(passport); // pass passport for configuration

/* Middlewares */
// route undefined routes to default '/'
app.use(function(req, res) {
    res.redirect('/')
});
// Catch unauthorised errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
});

// Start server
app.listen(server_port, server_ip_address, function(){
    console.log("Listening on " + server_ip_address + ":" + server_port);
});