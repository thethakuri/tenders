//routes/routes.js
var Tender = require('../models/tender');
var Users = require('../models/users');
var nodemailer = require('nodemailer');
var reCAPTCHA=require('recaptcha2')
 
recaptcha = new reCAPTCHA({
    siteKey:'6Lc05h0TAAAAAAWK14mmdPPon7lKdPBLyeOW3RNb',
    secretKey:'6Lc05h0TAAAAAJQAfV3G61FIbCj5K0qd09RpMTqR'
});

var path = require('path');

module.exports = function (app, passport) {
    /* Define http endpoints */
    
    app.get('/login', function(req, res) {
        res.render('login', { 
            message: req.flash('loginMessage'),
            alert : 'alert-danger' 
        });
    });
    
    app.get('/signup', function(req, res) {
        res.render('signup', { 
            message: req.flash('signupMessage'),
            alert : 'alert-danger' 
        });
    });
    app.get('/sendmail', function(req, res) {
        if(!req.user){
            return res.redirect('/');
        }
        res.render('message', { 
            message: 'An email with verification link has been sent to ' +  req.user.email + '@rudra.com.np. Please follow the link in your mail to verify your account before logging in.',
            alert : 'alert-success'
        });
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'no-reply@rudra.com.np', // Your email id
                pass: 'NodeMailer2016' // Your password
            }
        });
        var recipient = req.user.email + '@rudra.com.np';
        var html = "Dear "+ req.user.email +",<br><br>You have been registered for Tender Portal @ Rudra International. Please click the following link to verify your email address:<br><br><a target=_blank href=\'http://tenders.rudra.com.np/verify?token=" + req.user.authToken + "\'>Confirm your email</a><br><br>Once your email is verified, you can login using the credentials you provided.<br><br>Thank you,<br>Rudra International";
        var mailOptions = {
            from: 'Rudra International<no-reply@rudra.com.np>', // sender address
            to: recipient, // list of receivers
            subject: 'Verification Required - Tender Portal', // Subject line
            html: html
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                res.json({ error: error});
            }else{
                console.log('Message sent: ' + info.response);
                res.json({ message: info.response});
            };
        });
        /* Following hack if required from keeping user authenticated after signup (not verfied yet)
        req.logOut(); 
        req.session.destroy();
        */
    });
    // Verification email api
    app.get('/verify', function(req, res) {
        //console.log('verify_email token: ',req.query.token);

        Users.findOne({ authToken: req.query.token }, function(err, user) {
            if (err) { return console.error(err); }
            //console.dir(user);
            
            if(user){
               user.isAuthenticated = true;
                user.save(function (err) {
                    if (err) return console.error(err);
                    //console.log('succesfully updated user');
                    //console.log(user);
                    //res.redirect('/');
                    req.flash('userverifiedMessage', 'User ' + user.email + ' is verified. Enter your credentials to sign in.')
                    res.render('login', { 
                        message : req.flash('userverifiedMessage'),
                        alert : 'alert-success' 
                    });
                });   
            }
            else{
                req.flash('invalidtokenMessage', 'Invalid token')
                res.render('login', { 
                    message: req.flash('invalidtokenMessage'),
                    alert : 'alert-danger' 
                });
            }
            
        });
    });
    
    app.get('/', isLoggedIn, function(req, res) {
     
         Users.findOne({email : req.user.email},{isAuthenticated:1, _id:0}, function(err, docs){
            if (docs.isAuthenticated)
                res.render(path.join(__dirname, '/../views', 'home.ejs'), {
                    user : req.user // get the user out of session and pass to template
                });
            else{
                req.flash('verificationMessage', 'User not verified');
                res.render('login', { 
                    message: req.flash('verificationMessage'),
                    alert : 'alert-danger'
                });
            }
        });
       
    });

    
    // LOGOUT
    app.get('/logout', function(req, res) {
        req.logOut();
        req.session.destroy();
        res.redirect('/');
    });
    
    /*********************************/
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
    
    // process the signup form
    app.post('/signup', captchaVerify, passport.authenticate('local-signup', {
        successRedirect : '/sendmail', // redirect to the secure home section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure home section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
  }
  
  // route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()){
        return next();
    } 
    // if they aren't redirect them to the login page
    res.redirect('/login');
}

function captchaVerify(req, res, next){
    
    recaptcha.validateRequest(req)
    .then(function(){
        // validated and secure
        //res.json({formSubmit:true});
        return next();
    })
    .catch(function(errorCodes){
        // invalid
        //res.json({formSubmit:false,errors:recaptcha.translateErrors(errorCodes)});// translate error codes to human readable text
        req.flash('recaptchaFailed', 'Verify you are not a robot')
        res.render('signup', { 
            message : req.flash('recaptchaFailed'),
            alert : 'alert-danger' 
        });
    });
}