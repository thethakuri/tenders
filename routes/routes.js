//routes/routes.js 

var Tender = require('../models/tender');
var Users = require('../models/users');
var nodemailer = require('nodemailer');
var reCAPTCHA=require('recaptcha2');
 
recaptcha = new reCAPTCHA({
    siteKey: process.env.RECAPTCHA_SITEKEY,
    secretKey: process.env.RECAPTCHA_SECRETKEY
});

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
            user : req.user.email
        });
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.NODEMAILUSER,
                pass: process.env.NODEMAILPASS
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
        /* Following hack if required from keeping user authenticated after signup (not verfied yet)*/
        req.logOut(); 
        req.session.destroy();
        
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

        res.render('home', {
            user : {
                _id : req.user._id
                , email : req.user.email // get the user out of session and pass to template
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
    app.get('/Active', isLoggedIn, function(req, res){
        var now = new Date();
        now.setHours(0,0,0,0);
        
        Tender.find({subDate : {$gte : now}, owner : { $in: [null, req.user._id]}}, function(err, docs){
            res.json(docs);
        });


        // Tender.find({subDate : {$gte : now}}, function(err, docs){
        //     res.json(docs);
        // });
        
    });
    // Get tenders published within last one week
    app.get('/Recent', isLoggedIn, function(req, res){
        var now = new Date();
        now.setHours(0,0,0,0);
        //60*60*24*7 would be the number of seconds in a week. Convert to miliseconds by * 1000
        var lastWeek = new Date(now.getTime()-1000*60*60*24*7);
        
        Tender.find({pubDate : {$gte : lastWeek}, owner : { $in: [null, req.user._id]}}, function(err, docs){
            res.json(docs);
        });
        // Tender.find({pubDate : {$gte : lastWeek}}, function(err, docs){
        //     res.json(docs);
        // });
        
    });
    
    // Get it all
    app.get('/All', isLoggedIn, function(req, res){

        Tender.find({owner : { $in: [null, req.user._id]}}, function(err, docs){
            res.json(docs);
        });

        // Tender.find(function(err, docs){
        //     res.json(docs);
        // });
        
    });

    // Get Watching Tenders
    app.put('/Watchlist', isLoggedIn, function(req, res){
        Tender.find({
            _id : { $in : req.body}
        }, function(err, docs){
            res.json(docs);
        });
        
    });

    // Get Participated Tenders
    app.put('/Participated', isLoggedIn, function(req, res){
        Tender.find({
            _id : { $in : req.body}
        }, function(err, docs){
            res.json(docs);
        });
        
    });

    // Get myListings
    app.put('/myListings', isLoggedIn, function(req, res){
        Tender.find({
            _id : { $in : req.body}
        }, function(err, docs){
            res.json(docs);
        });
        
    });
    
    app.get('/User', isLoggedIn, function(req, res){
        
        Users
            .findById(req.user._id)
            .select('-password -authToken -isAuthenticated')
            // .populate([
            //     {
            //         path : 'tenders',
            //         populate : {
            //             path : '_id',
            //             model : 'Tender'
            //         }
            //     },
            //     {
            //         path : 'groups',
            //         populate :{
            //             path : 'admin',
            //             model : 'User'
            //         },
            //         populate : {
            //             path : 'members',
            //             model : 'User'
            //         },
            //         populate : {
            //             path : 'requests',
            //             model : 'User'
            //         }
            //     }
            // ])
            //.lean()
            .exec(function(err, doc){
                res.json(doc);
            })
    });

    app.put('/Update/User/Profile', isLoggedIn, function (req, res) {
        
        Users.findByIdAndUpdate(req.user._id, req.body, {new: true, upsert : false, select : '-password -authToken -isAuthenticated'}, function (err, user){
            if (err) {
                console.log(err);
                res.status(500).send();
            } 

            return res.json(user);
        })

    });
    
    app.put('/Update/User/TenderData', isLoggedIn, function (req, res) {  
        Users
            .findOne({'_id' : req.user._id }, '-password -authToken -isAuthenticated', function(err, doc){
                if (err){
                    console.log(err);
                    res.status(500).send();
                }
                
                doc.tenders.pull(req.body._id);
                doc.tenders.push(req.body);
                doc.save(function (err) {
                    if(err) {
                        console.log(err);
                        res.status(500).send();
                    }
                    return res.json(doc);
                }); 
            });
    });

    app.put('/Delete/User/TenderData', isLoggedIn, function (req, res){ //provide single id
        Users
            .findOne({'_id' : req.user._id }, '-password -authToken -isAuthenticated', function(err, doc){
                if (err){
                    console.log(err);
                    res.status(500).send();
                }

                doc.tenders.pull(req.body._id);
                
                doc.save(function (err) {
                    if(err) {
                        console.log(err);
                        res.status(500).send();
                    }
                    return res.json(doc);
                }); 
            });

    });
    app.put('/Delete/User/MultipleTenderData', isLoggedIn, function (req, res){ //provide array of ids
        Users
            .findOne({'_id' : req.user._id }, '-password -authToken -isAuthenticated', function(err, doc){
                if (err){
                    console.log(err);
                    res.status(500).send();
                }
                
                req.body._id.forEach(function(_id) {
                    doc.tenders.pull(_id);
                })
                
                doc.save(function (err) {
                    if(err) {
                        console.log(err);
                        res.status(500).send();
                    }
                    return res.json(doc);
                }); 
            });

    });

    app.put('/Update/User/Listings', isLoggedIn, function (req, res) {  
        
        Users
            .findOne({'_id' : req.user._id}, '-password -authToken -isAuthenticated', function (err, doc) {  
                
                if (err){
                    console.log(err);
                    res.status(500).send();
                }

                doc.myListings.push(req.body._id);
                doc.save(function (err, doc){
                    if(err){
                        console.log(err);
                        res.status(500).send();
                    }
                    
                    return res.json(doc);
                });
            });
    });
    app.put('/Create/User/Competitor', isLoggedIn, function (req, res) {  
        Users
            .findOne({'_id' : req.user._id}, '-password -authToken -isAuthenticated', function (err, doc) {  
                
                if (err){
                    console.log(err);
                    res.status(500).send();
                }
                doc.competitors.push(req.body);
                doc.save(function (err, doc){
                    if(err){
                        console.log(err);
                        res.status(500).send();
                    }
                    
                    //return res.json(doc.competitors[doc.competitors.length-1]._id);
                    return res.json(doc);
                });
            });
    });

    app.put('/Create/User/Tender', isLoggedIn, function (req, res){

        newTender = new Tender(req.body);
        newTender.save(function (err, tender){
            if (err) {
                console.log(err);
                res.status(500).send();
            } 

            return res.json(tender);
        })

    });
    app.put('/Edit/User/Tender', isLoggedIn, function (req, res){

        Tender.findByIdAndUpdate(req.body._id, req.body, {new: true, upsert : false}, function (err, tender){
            if (err) {
                console.log(err);
                res.status(500).send();
            } 

            return res.json(tender);
        })

    });

    app.delete('/Delete/User/Tender', isLoggedIn, function (req, res){

        Tender.findByIdAndRemove(req.body._id, function (err, tender){
            if(err){
                console.log(err);
                res.status(500).send();
            }
            return Users.findById(req.user._id, function (err, user){ //remove corresponding user data
                        if (err){
                            console.log(err);
                            res.status(500).send();
                        }
                        
                        user.myListings.pull(req.body._id);
                        user.tenders.pull(req.body._id);

                        user.save(function (err, doc){
                            if(err){
                                console.log(err);
                                res.status(500).send();
                            }
                            return res.json(doc);
                        })

                    });
        });
    });
    
    // Get specific tender detail
    // app.get('/:id', isLoggedIn, function (req, res) {
        
    //     Tender.findById(req.params.id, function (err, doc) {
    //         res.json(doc);
    //     });
    // });
    
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
        req.flash('recaptchaFailed', 'reCAPTCHA : ' + recaptcha.translateErrors(errorCodes));
        res.render('signup', { 
            message : req.flash('recaptchaFailed'),
            alert : 'alert-danger' 
        });
    });
}