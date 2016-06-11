//routes/routes.js 
var async = require('async');
var crypto = require('crypto');

//models
var Tender = require('../models/tender');
var Users = require('../models/users');
var Notify = require('../models/notification');

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

var rememberFor = 30; // cookie validity days
var hours = 24; // token validity time frame for password reset

module.exports = function (app, passport) {
    /* Define http endpoints */
    
    app.head('/', function (req, res){  
        req.session.destroy();
        res.status(200).end(); 
    });
    
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
        var html = "Dear "+ userid +",<br><br>You have been registered for Tender Portal @ Rudra International. Please click the following link to verify your e-mail address:<br><br><a target=_blank href=\'http://tenders.rudra.com.np/verify?token=" + req.user.authToken + "\'>Confirm your e-mail</a><br><br>Once your e-mail is verified, you can login using the credentials you provided.<br><br>Thank you,<br><a href='http://tenders.rudra.com.np'>Tender Portal Team</a>,<br><a href='http://www.rudra.com.np'>Rudra International</a><br><br><img src='http://www.rudra.com.np/images/tender_logo_mail.png' alt='Tender Portal'>";
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
    // Get only e-tenders
    app.get('/ETender', isLoggedIn, function(req, res){
        var now = new Date();
        now.setHours(0,0,0,0);
        
        Tender.find({subDate : {$gte : now}, remarks : 'E-Tender'}, function(err, docs){
            res.json(docs);
        });


        // Tender.find({subDate : {$gte : now}}, function(err, docs){
        //     res.json(docs);
        // });
        
    });
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

    //Notifications
    app.put('/Update/User/Notification', isLoggedIn, function(req, res, next){

        Notify.remove({email : req.body.email, 'tender._id' : req.body.tender._id}, function(err, count){
            if(err){
                console.log(err);
                res.status(500).send();
            }

            var data = [];
            req.body.dates.forEach(function(date){
                data.push({
                    'date' : date,
                    'email' : req.body.email,
                    'tender' : req.body.tender
                })
            });

            if(data.length){
                Notify.insertMany(data, function(err, docs){
                    if(err){
                        console.log(err);
                        res.status(500).send();
                    }
                    return res.send();
                });
            }

            return res.send();

        })  
    });


    /************** Uer updates  ***************/
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
    
    // Admin api
    app.put('/Edit/Tender', isLoggedIn, function (req, res) {  
       Tender.findByIdAndUpdate(req.body._id, {
           $set : {
               'caller' : req.body.caller,
                'item' : req.body.item,
                'pubDate'  : req.body.pubDate,
                'subDate' : req.body.subDate,
                'pubDaily' : req.body.pubDaily,
                'remarks' : req.body.remarks,
                'category' : req.body.category,
                'link' : req.body.link,
                'img' : req.body.img
           }
       }, {new : true, upsert : false}, function (err, tender) {
                if (err) {
                    console.log(err);
                    res.status(500).send();
                }
                
                return Users.update({'tenders._id' : tender._id},{
                    $set : {
                        'tenders.$.item' : tender.item
                    }
                },
                {new: true, upsert : false, select : '-password -isAuthenticated', multi: true},
                function(err, user){
                    if(err){
                        console.log(err);
                        res.status(500).send();
                    }
                    return Notify.update({'tender._id' : tender._id},{
                        $set : {
                            'tender.item' : tender.item
                        }
                    },
                    {new: true, upsert : false, multi: true},
                    function(err, notify){
                        if(err){
                            console.log(err);
                            res.status(500).send();
                        }
                        res.send();
                    }) 
                    
                });
       }) 
    });
    
    // Admin api
    app.delete('/Delete/Tender', isLoggedIn, function(req, res){
        Tender.findByIdAndRemove(req.body._id, function(err, tender){
            if(err){
                console.log(err);
                res.status(500).send();
            }
            return Notify.remove({'tender._id' : req.body._id}, function(err, count){
                if(err){
                    console.log(err);
                    res.status(500).send();
                }
                return res.send();
            })
        })
    })
    
    app.put('/Edit/User/Tender', isLoggedIn, function (req, res){

        Tender.findByIdAndUpdate(req.body._id, {
            $set : {
                'owner' : req.body.owner,
                'caller' : req.body.caller,
                'item' : req.body.item,
                'pubDate'  : req.body.pubDate,
                'subDate' : req.body.subDate,
                'pubDaily' : req.body.pubDaily,
                'remarks' : req.body.remarks,
                'category' : req.body.category,
                'link' : req.body.link,
                'img' : req.body.img
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
                    
                    return Notify.update({'tender._id' : tender._id},{
                        $set : {
                            'tender.item' : tender.item
                        }
                    },
                    {new: true, upsert : false, multi: true},
                    function(err, notify){
                        if(err){
                            console.log(err);
                            res.status(500).send();
                        }
                        return res.json(userData);
                    }) 
                    
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
                            
                            Notify.remove({'tender._id' : tender._id}, function(err, count){
                                //console.log('Removed: '+count);
                                if(err){
                                    console.log(err);
                                    res.status(500).send();
                                }
                                return res.json(doc);    
                            }); 
                            
                           
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

    //Peek
    app.get('/Peek/:id', function (req, res) {
        Tender.findById(req.params.id, function (err, doc) {
            if(req.isAuthenticated()){
                doc.loggedIn = true;
            }
            else doc.loggedIn = false;
            console.log(JSON.stringify(doc));
            res.render('peek', doc);
        });
    })
    
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
    
    // send tender error report
    app.put('/Tender/Error', function(req, res){
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: gmailCredentials.user,
                pass: gmailCredentials.pass
            }
        });
        var recipient = 'thethakuri@gmail.com'; //admin

        var html = "Error reported : <br><br>";
        html += "<ul style='list-style-type: none; padding:0; margin:0;'>";
        html += "<li>Reported by: " + req.user.email + "</li>";
        html += "<li>Reporter's id: " + req.user._id + "</li>";
        html += "<li>&nbsp;</li>"
        html += "<li>Listing title: " + req.body.item + "</li>";
        html += "<li>Listing's id: " + req.body._id + "</li>";
        html += "<li>&nbsp;</li>";
        html += "<li>Error detail: " + req.body.error + "</li>";
        html += "</ul>";
        html += "<br><br>Thank you,<br><a href='http://tenders.rudra.com.np'>Tender Portal Team</a>,<br><a href='http://www.rudra.com.np'>Rudra International</a><br><br><img src='http://www.rudra.com.np/images/tender_logo_mail.png' alt='Tender Portal'>";
        var mailOptions = {
            from: 'Rudra International<no-reply@rudra.com.np>', // sender address
            to: recipient, // list of receivers
            subject: 'Error reported - Tender Portal', // Subject line
            html: html
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                res.status(500).send();
            }   
            return res.send();
        });
    })

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
                var html = "Dear "+ userid +",<br><br>Your password has been reset.<br><br>Thank you,<br><a href='http://tenders.rudra.com.np'>Tender Portal Team</a>,<br><a href='http://www.rudra.com.np'>Rudra International</a><br><br><img src='http://www.rudra.com.np/images/tender_logo_mail.png' alt='Tender Portal'>";
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
                var html = "Dear "+ userid +",<br><br>We have received a request to reset the password for your Tender Portal account.<br><br>To reset your password, click on the following link: <br><br><a target=_blank href=\'http://tenders.rudra.com.np/reset?token=" + resetToken + "\'>Reset your password</a><br><br>If you did not request to have your password reset, you can safely ignore this message.<br><br>Thank you,<br><a href='http://tenders.rudra.com.np'>Tender Portal Team</a>,<br><a href='http://www.rudra.com.np'>Rudra International</a><br><br><img src='http://www.rudra.com.np/images/tender_logo_mail.png' alt='Tender Portal'>";
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
    });

    //cron job
    app.get('/cron/notification', function (req, res){

        var now = Date.now();
        var oneDay = ( 1000 * 60 * 60 * 24 ),
            today = new Date( now - ( now % oneDay ) ),
            tomorrow = new Date( today.valueOf() + oneDay);
        
        // var start = new Date();
        // start.setHours(0,0,0,0);
        // var end = new Date();
        // end.setHours(23,59,59,999);

        /** Maybe due to server-locale timezone difference, using $lte : now caused a delay of one day. So used tomorrow instead **/
        Notify.find({ date : { $lte : tomorrow }}, function(err, notifications) { 

            if(err){
                console.log(err);
                res.status(500).send();
            }

            // sort tenders and assign them to their corresponding email address 
            var notifyList = [];
            notifications.forEach(function(notification){

                var emailList = notifyList.map(function(o){ return o.email});
                var emailIndex = emailList.indexOf(notification.email);
                if(emailIndex !== -1){

                    notifyList[emailIndex].tender.push(notification.tender);
                    
                } else {

                    var notify = {
                        email : '',
                        tender : []
                    }

                    notify.email = notification.email;
                    notify.tender.push(notification.tender);

                    notifyList.push(notify);
                      
                }
            })

            // send mail to each of those email
            notifyList.forEach(function(notify){
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: gmailCredentials.user,
                        pass: gmailCredentials.pass
                    }
                });
                var recipient = notify.email;
                var userid = recipient.match(/^([^@]*)@/)[1];

                var tenderlist = '<ul style="list-style-type: none; padding:0; margin:0;">';
                notify.tender.forEach(function(tender){
                    tenderlist += "<li><strong><a target=_blank href=\'http://tenders.rudra.com.np/Peek/" + tender._id + "\'>" + tender.item + "</a></strong></li>";
                    tenderlist += '<li> Submission Date: ' + new Date(tender.subDate).toLocaleDateString() + '</li>';
                    tenderlist += '<li>&nbsp;</li>';
                })
                tenderlist += '</ul>';

                var html = "Dear "+ userid +",<br><br>Following listings are nearing their submission deadline:<br><br>";
                html += tenderlist;
                html += "<br>Thank you,<br><a href='http://tenders.rudra.com.np'>Tender Portal Team</a>,<br><a href='http://www.rudra.com.np'>Rudra International</a><br><br><img src='http://www.rudra.com.np/images/tender_logo_mail.png' alt='Tender Portal'><br><br><span style='font-size:11px'>You are receiving these notifications as per your settings. Please edit your setting from the listings' page if you do not wish to receive further notification.</span>";
                
                var mailOptions = {
                    from: 'Rudra International<no-reply@rudra.com.np>', // sender address
                    to: recipient, // list of receivers
                    subject: 'Notification - Tender Portal', // Subject line
                    html: html
                };
                transporter.sendMail(mailOptions, function(error, info){

                    // remove sent notification collections from the database 
                    Notify.remove({ date : { $lte : now }}, function(err, count){
                        if(err){
                            console.log(err);
                            res.status(500).send();
                        }
                        return res.send();
                    })
    
                });

            });

            // console.log(JSON.stringify(notifyList));
            // console.log(notifyList.length);
            res.send();

        })
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