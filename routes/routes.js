//routes/routes.js 
var async = require('async');
var crypto = require('crypto');

var Tender = require('../models/tender');
var Users = require('../models/users');
var nodemailer = require('nodemailer');
var reCAPTCHA=require('recaptcha2');
 
recaptcha = new reCAPTCHA({
    siteKey: process.env.RECAPTCHA_SITEKEY,
    secretKey: process.env.RECAPTCHA_SECRETKEY
});

var gmailCredentials = {
    user: process.env.NODEMAILUSER,
    pass: process.env.NODEMAILPASS
}

var rememberFor = 30; // cookie validity
var hours = 24; // token validity time frame

module.exports = function (app, passport) {
    /* Define http endpoints */
    
    app.get('/login', function(req, res) {
        res.render('login', { 
            message: req.flash('loginMessage'),
            alert : 'danger' 
        });
    });
    
    app.get('/signup', function(req, res) {
        res.render('signup', { 
            message: req.flash('signupMessage'),
            alert : 'danger' 
        });
    });
    
    app.get('/forgot', function(req, res) {
        res.render('forgot', {
            message : req.flash('forgotMessage'),
            alert : 'danger'
        });
    });

    app.get('/sendmail', function(req, res) {
        if(!req.user){
            return res.redirect('/');
        }
        
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: gmailCredentials.user,
                pass: gmailCredentials.pass
            }
        });
        //var recipient = req.user.email + '@rudra.com.np';
        var recipient = req.user.email;
        var userid = recipient.match(/^([^@]*)@/)[1];
        var html = "Dear "+ userid +",<br><br>You have been registered for Tender Portal @ Rudra International. Please click the following link to verify your e-mail address:<br><br><a target=_blank href=\'http://tenders.rudra.com.np/verify?token=" + req.user.authToken + "\'>Confirm your e-mail</a><br><br>Once your e-mail is verified, you can login using the credentials you provided.<br><br>Thank you,<br>Rudra International";
        var mailOptions = {
            from: 'Rudra International<no-reply@rudra.com.np>', // sender address
            to: recipient, // list of receivers
            subject: 'Verification Required - Tender Portal', // Subject line
            html: html
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                res.status(500).send();
            }else{
                req.flash('signupMessage', 'An e-mail with verification link has been sent to '+ recipient +'. Please follow the link in your mail to verify your account before logging in. For security reasons please close this browser window.');
                //res.json({ message: info.response});
                res.render('signup', { 
                    message : req.flash('signupMessage'),
                    alert : 'info' 
                });
                /* Following hack is required from keeping user authenticated after signup (not verfied yet)*/
                req.logOut(); 
                req.session.destroy();
                return;
            };
        });
        
        
    });
    
    // Reset password form
    app.get('/reset', function(req, res){
        Users.findOne({ resetToken : req.query.token, resetExpires : { $gte : Date.now() } }, function(err, user){
            if(!user) {
                req.flash('resetMessage', 'Password reset token is invalid or has expired');
                return res.render('forgot', {
                    message : req.flash('resetMessage'),
                    alert : 'danger'
                })
            }

            return res.render('reset', {
                message : req.flash('resetMessage'),
                alert : 'danger',
                token : req.query.token,
                email : user.email
            });
        });
    });

    // Verification email api
    app.get('/verify', function(req, res) {

        Users.findOne({ authToken: req.query.token }, function(err, user) {
            if (err) { return console.error(err); }
            //console.dir(user);
            
            if(user){
                user.isAuthenticated = true;
                user.authToken = undefined;
                user.save(function (err) {
                    if (err) return console.error(err);
                    
                    req.flash('userverifiedMessage', 'Account ' + user.email + ' is verified. Enter your credentials to sign in.')
                    res.render('login', { 
                        message : req.flash('userverifiedMessage'),
                        alert : 'success' 
                    });
                });   
            }
            else{
                req.flash('invalidtokenMessage', 'Invalid token')
                res.render('login', { 
                    message: req.flash('invalidtokenMessage'),
                    alert : 'danger' 
                });
            }
            
        });
    });
    
    app.get('/', isLoggedIn, function(req, res) {
        req.flash('reset', 'Password reset successful');
        res.render('home', {
            user : { // get the user out of session and pass to template
                _id :  req.user._id, 
                email : req.user.email
            },
            message : req.session.reset ? req.flash('reset') : false
        });
        delete req.session.reset;
       
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

    app.post('/Change/User/Password', isLoggedIn, function(req, res){
        Users.findById(req.user._id, 'password', function(err, user){
            if(err){
                console.log(err);
                res.status(500).send();
            }
            if(!user.validPassword(req.body.oldPassword)){
                return res.json({result : 'danger', text : 'Old password is incorrect'});
            }
            user.password = user.generateHash(req.body.newPassword);
            user.save(function(err){
                if(err) {
                    console.log(err);
                    res.status(500).send();
                }
                return res.json({result : 'success', text : 'Password successfully changed'});
            })
        })
    });
    
    app.get('/User', isLoggedIn, function(req, res){
        
        Users
            .findById(req.user._id)
            .select('-password -isAuthenticated')
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
        
        Users.findByIdAndUpdate(req.user._id, req.body, {new: true, upsert : false, select : '-password -isAuthenticated'}, function (err, user){
            if (err) {
                console.log(err);
                res.status(500).send();
            } 

            return res.json(user);
        })

    });
    
    app.put('/Update/User/TenderData', isLoggedIn, function (req, res) {  
        Users
            .findOne({'_id' : req.user._id }, '-password -isAuthenticated', function(err, doc){
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
            .findOne({'_id' : req.user._id }, '-password -isAuthenticated', function(err, doc){
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
            .findOne({'_id' : req.user._id }, '-password -isAuthenticated', function(err, doc){
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
            .findOne({'_id' : req.user._id}, '-password -isAuthenticated', function (err, doc) {  
                
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
            .findOne({'_id' : req.user._id}, '-password -isAuthenticated', function (err, doc) {  
                
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

    app.put('/Update/User/Competitor', isLoggedIn, function (req, res){
        Users
            .findOneAndUpdate({'_id' : req.user._id, 'competitors._id' : req.body._id},
            {
                $set : {'competitors.$.name' : req.body.name, 
                    'competitors.$.address' : req.body.address, 
                    'competitors.$.contactPerson' : req.body.contactPerson,
                    'competitors.$.phone' : req.body.phone
                }
            },
            {new: true, upsert : false, select : '-password -isAuthenticated'},
            function (err, userData){
                if(err){
                    console.log(err);
                    res.status(500).send();
                }

                // update corresponding name in competitors bidding information
                userData.tenders.forEach(function(tender){
                    tender.participationInfo.competitorsBid.forEach(function(compBid){
                        
                        if(compBid._id.equals(req.body._id)){
                            compBid.name = req.body.name;
                        }
                    })
                })

                userData.save(function (err, doc){
                    if(err){
                        console.log(err);
                        res.status(500).send();
                    }
                    return res.json(doc);
                })

                
            }
        );
    });

    app.delete('/Delete/User/Competitor', isLoggedIn, function (req, res) {
        Users
            .findOne({'_id' : req.user._id}, '-password -isAuthenticated', function (err, doc) {  
                
                if (err){
                    console.log(err);
                    res.status(500).send();
                }
                doc.competitors.pull(req.body._id);
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

        Tender.findByIdAndUpdate(req.body._id, {
            $set : {
                'owner' : req.user._id,
                'caller' : req.body.caller,
                'item' : req.body.item,
                'pubDate'  : req.body.pubDate,
                'subDate' : req.body.subDate,
                'pubDaily' : req.body.pubDaily,
                'remarks' : req.body.remarks,
                'category' : req.body.category
            }
        }, {new: true, upsert : false}, function (err, tender){
            if (err) {
                console.log(err);
                res.status(500).send();
            } 

            return Users.findOneAndUpdate({'_id' : req.user._id, 'tenders._id' : tender._id}, 
                {
                    $set : {
                        'tenders.$.item' : tender.item
                    }
                },
                {new: true, upsert : false, select : '-password -isAuthenticated'},
                function (err, userData){
                    if(err){
                        console.log(err);
                        res.status(500).send();
                    }
                    
                    return res.json(userData);
                })
            
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
    
    //Get specific tender detail
    app.get('/Tender/:id', isLoggedIn, function (req, res) {
        
        Tender.findById(req.params.id, function (err, doc) {
            res.json(doc);
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
            //successRedirect : '/', // redirect to the secure home section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }),
        function(req, res, user){
            // check if 'remember' is checked
            if(req.body.remember){
                req.session.cookie.maxAge = rememberFor * 24 * 60 * 60 * 1000; //30 days default
            } else {
                req.session.cookie.expires = false;
            }
            //req.session.user = req.user;
            //console.log(JSON.stringify(req.session.user));
            res.redirect('/');
        }

    );

    // reset password
    app.post('/reset', function(req,res){
        
        async.waterfall([
            function(done){
                Users.findOne({ resetToken : req.body.token, resetExpires : { $gte : Date.now() } }, function(err, user){
                    if(!user){
                        req.flash('resetMessage', 'Password reset token is invalid or has expired');
                        return res.render('forgot', {
                            message : req.flash('resetMessage'),
                            alert : 'danger'
                        });
                    }

                    user.password = user.generateHash(req.body.password);
                    user.resetToken = undefined;
                    user.resetExpires = undefined;

                    user.save(function(err){
                        req.logIn(user, function(err){
                            done(err, user);
                        })
                    })
                })
            },

            function(user, done){

                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: gmailCredentials.user,
                        pass: gmailCredentials.pass
                    }
                });
                var recipient = user.email;
                var userid = recipient.match(/^([^@]*)@/)[1];
                var html = "Dear "+ userid +",<br><br>Your password has been reset.<br><br>Thank you,<br>Tender Portal Team,<br>Rudra International";
                var mailOptions = {
                    from: 'Rudra International<no-reply@rudra.com.np>', // sender address
                    to: recipient, // list of receivers
                    subject: 'Password Reset Successful- Tender Portal', // Subject line
                    html: html
                };
                transporter.sendMail(mailOptions, function(error, info){
                    //req.flash('resetMessage', 'Password reset successful');
                    done(error);
                });
            }

        ],  function (err) {
                req.session.reset = true;
                res.redirect('/');
        });
    });
    // send password reset email
    app.post('/forgot', function(req, res, next){
        
        async.waterfall([ //execute http requests one after another passing responses
            function(done) {
                crypto.randomBytes(20, function(err, buff){
                    var resetToken = buff.toString('hex');
                    done(err, resetToken);
                });
            },
            function(resetToken, done){
                Users.findOne({email : req.body.email}, function(err, user){
                    if(!user){
                        req.flash('forgotMessage', 'Account '+req.body.email+' does not exist');
                        return res.render('forgot', { 
                            message : req.flash('forgotMessage'),
                            alert : 'danger' 
                        });
                        
                    }
                    user.resetToken = resetToken;
                    user.resetExpires = Date.now() + (hours*60*60*1000); // expires

                    user.save(function(err){
                        done(err, resetToken, user);
                    });
                });
            },
            function(resetToken, user, done){
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: gmailCredentials.user,
                        pass: gmailCredentials.pass
                    }
                });
                var recipient = user.email;
                var userid = recipient.match(/^([^@]*)@/)[1];
                var html = "Dear "+ userid +",<br><br>We received a requested to reset the password for your Tender Portal account.<br><br>To reset your password, click on the following link: <br><br><a target=_blank href=\'http://tenders.rudra.com.np/reset?token=" + resetToken + "\'>Reset your password</a><br><br>If you did not request to have your password reset, you can safely ignore this message.<br><br>Thank you,<br>Tender Portal Team,<br>Rudra International";
                var mailOptions = {
                    from: 'Rudra International<no-reply@rudra.com.np>', // sender address
                    to: recipient, // list of receivers
                    subject: 'Password Reset Request - Tender Portal', // Subject line
                    html: html
                };
                transporter.sendMail(mailOptions, function(error, info){
                    
                    req.flash('forgotMessage', 'An e-mail has been sent to ' + user.email + ' with further instructions to reset your password. For security reasons please close this browser window.');
                    
                    done(error, 'done');
                });
            }

        ], function(err){
            if(err) return next(err);
            return res.render('forgot', { 
                    message : req.flash('forgotMessage'),
                    alert : 'info' 
            });
            //res.redirect('/reset');
        });
    })
}
  
  // route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()){
        return next();
    } 
    // if they aren't redirect them to the login page
    return res.redirect('/login');
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
        return res.render('signup', { 
            message : req.flash('recaptchaFailed'),
            alert : 'danger' 
        });
    });
}