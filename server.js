#!/bin/env node
//  

var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');
var Tender = require('./public/models/tender');

var app = express();

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
// Start server
app.listen(server_port, server_ip_address, function(){
    console.log("Listening on " + server_ip_address + ":" + server_port);
});

//MongoD
if(process.env.OPENSHIFT_MONGODB_DB_URL){
    mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + "tenders";
}
else {
    mongodb_connection_string = 'mongodb://localhost:27017/tenders';
}
mongoose.connect(mongodb_connection_string);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
    console.log('Connected to Mongoose Database.');
    
});

// Close MongoD connection when app is terminated
process.on('SIGINT', function (){
   mongoose.disconnect();
   db.close(function (){
       console.log("Server halted: Mongoose default connection disconnected.");
       process.exit(0);
   }); 
});

// Look for static files like html, css, js in the given directory
app.use(express.static(__dirname + "/public"));

/* Define http endpoints */
// Get only active tenders
app.get('/Active', function(req, res){
    var now = new Date();
    console.log('GET Request: ' + now);
    
    Tender.find({subDate : {$gte : now}}, function(err, docs){
        res.json(docs);
    });
    
});
// Get tenders published within last one week
app.get('/Recent', function(req, res){
    var now = new Date();
    //60*60*24*7 would be the number of seconds in a week. Convert to miliseconds by * 1000
    var lastWeek = new Date(now.getTime()-1000*60*60*24*7);
    
    Tender.find({pubDate : {$gte : lastWeek}}, function(err, docs){
        res.json(docs);
    });
    
});
// Get it all
app.get('/All', function(req, res){
    Tender.find(function(err, docs){
        res.json(docs);
    });
    
});



/*  ================================================================  */
/*  Helper functions.                                                 */
/*  ================================================================  */

/**
 *  Set up server IP address and port # using env variables/defaults.
 
self.setupVariables = function() {
    //  Set the environment variables we need.
    self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
    self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

    if (typeof self.ipaddress === "undefined") {
        //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
        //  allows us to run/test the app locally.
        console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
        self.ipaddress = "127.0.0.1";
    };
};
*/
    