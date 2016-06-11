// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../models/users');

var crypto = require('crypto');

// expose this function to our app using module.exports
module.exports = function(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        
        email = email.trim().toLowerCase();
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
            User.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    // if the user is already authenticated
                    if (user.isAuthenticated){
                        //console.log("user is authenticated : " + user.email);
                        return done(null, false, req.flash('signupMessage', 'Account already exists'));
                    }
                    // if user exists but not authenticated update password & token to send new verification email
                    else {
                        //generate authentication token
                        var seed = crypto.randomBytes(20);
                        //var authToken = crypto.createHash('sha1').update(seed + email + '@rudra.com.np').digest('hex');
                        var authToken = crypto.createHash('sha1').update(seed + email).digest('hex');

                        // update the user's local credentials
                        user.password = user.generateHash(password);
                        user.authToken = authToken;
                        
                        // save the user
                        user.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, user);
                        });
                    }
                }
                // if the user does not exists
                else{
                    //generate authentication token
                    var seed = crypto.randomBytes(20);
                    //var authToken = crypto.createHash('sha1').update(seed + email + '@rudra.com.np').digest('hex');
                    var authToken = crypto.createHash('sha1').update(seed + email).digest('hex');

                    // if there is no user with that email
                    // create the user
                    var newUser = new User();
                    
                    // set the user's local credentials
                    newUser.email    = email;
                    newUser.password = newUser.generateHash(password);
                    newUser.authToken = authToken;
                    newUser.isAuthenticated = false;
                    newUser.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                    var geo = $http.get('http://ip-api.com/json/' + newUser.ip + '?callback=?', function(data){
                        if(data){
                            if(data.status === "success") newUser.location = data.city + ', ' + data.country;
                        }
                        // save the user info
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }); 
                    
                }

            });    

        });

    }));
    
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        
        email = email.trim().toLowerCase();
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'Account for '+ email +' not found')); // req.flash is the way to set flashdata using connect-flash
            // if user is not verified 
            if (!user.isAuthenticated)
                return done(null, false, req.flash('loginMessage', 'Account for '+ email +' not verified'));
            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Invalid password'));

            // all is well, return successful user
            return done(null, user);
        });

    }));

};