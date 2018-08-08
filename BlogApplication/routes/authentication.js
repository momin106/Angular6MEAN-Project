const User = require('../models/user'); // Import User Model Schema
const jwt = require('jsonwebtoken'); // Compact, URL-safe means of representing claims to be transferred between two parties.
const config = require('../config/database'); // Import database configuration
const nodemailer = require('nodemailer');

module.exports = (router) => {

  /* =================
     Register Route
  ==================== */
  router.post('/register', (req, res) => {
    // Check if email was provided
    if (!req.body.email) {
      res.json({ success: false, message: 'You must provide an e-mail' }); // Return error
    } else {
      // Check if username was provided
      if (!req.body.username) {
        res.json({ success: false, message: 'You must provide a username' }); // Return error
      } else {
        // Check if password was provided
        if (!req.body.password) {
          res.json({ success: false, message: 'You must provide a password' }); // Return error
        } else {
          // Create new user object and apply user input
          var user = new User({
            email: req.body.email.toLowerCase(),
            username: req.body.username.toLowerCase(),
            password: req.body.password,
            temporarytoken: jwt.sign({ username: 'user.username', email: 'user.email' }, config.secret, { expiresIn: '24h' })
          });
          // Save user to database
          user.save((err) => {
            // Check if error occured
            if (err) {
              // Check if error is an error indicating duplicate account
              if (err.code === 11000) {
                res.json({ success: false, message: 'Username or e-mail already exists' }); // Return error
              } else {
                // Check if error is a validation rror
                if (err.errors) {
                  // Check if validation error is in the email field
                  if (err.errors.email) {
                    res.json({ success: false, message: err.errors.email.message }); // Return error
                  } else {
                    // Check if validation error is in the username field
                    if (err.errors.username) {
                      res.json({ success: false, message: err.errors.username.message }); // Return error
                    } else {
                      // Check if validation error is in the password field
                      if (err.errors.password) {
                        res.json({ success: false, message: err.errors.password.message }); // Return error
                      } else {
                        res.json({ success: false, message: err }); // Return any other error not already covered
                      }
                    }
                  }
                } else {
                  res.json({ success: false, message: 'Could not save user. Error: ', err }); // Return error if not related to validation
                }
              }
            } else {
              // Create e-mail object to send to user            
              nodemailer.createTestAccount((err, account) => {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                  host: 'smtp.gmail.com',
                  port: 587, //587
                  secure: false, // true for 465, false for other ports
                  auth: {
                    user: "", // your own gmail eg abc@gmail.com
                    pass: ""  // Enter secret gmail password not gmail login password
                  }
                });
                const email = {
                  from: 'Localhost Staff, staff@localhost.com',
                  to: user.email,
                  subject: 'Localhost Activation Link',
                  text: 'Hello ' + user.username + ', thank you for registering at localhost.com. Please click on the following link to complete your activation: http://localhost:8080/activation/' + user.temporarytoken,
                  html: 'Hello<strong> ' + user.username + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activation/' + user.temporarytoken + '">http://localhost:8080/activation/</a>'
                };
                transporter.sendMail(email, (error, info) => {
                  if (error) {
                    return console.log(error);
                  }
                  console.log('Message sent: %s', info.messageId);
                  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });
              });
              res.json({ success: true, message: 'Acount registered! Please check your e-mail for activation link.' }); // Return success
            }
          });
        }
      }
    }
  });

  /* ============================================================
     Route to check if user's email is available for registration
  ============================================================ */
  router.get('/checkEmail/:email', (req, res) => {
    // Check if email was provided in paramaters
    if (!req.params.email) {
      res.json({ success: false, message: 'E-mail was not provided' }); // Return error
    } else {
      // Search for user's e-mail in database;
      User.findOne({ email: req.params.email }, (err, user) => {
        if (err) {
          res.json({ success: false, message: err }); // Return connection error
        } else {
          // Check if user's e-mail is taken
          if (user) {
            res.json({ success: false, message: 'E-mail is already taken' }); // Return as taken e-mail
          } else {
            res.json({ success: true, message: 'E-mail is available' }); // Return as available e-mail
          }
        }
      });
    }
  });

  /* ===============================================================
     Route to check if user's username is available for registration
  =============================================================== */
  router.get('/checkUsername/:username', (req, res) => {
    // Check if username was provided in paramaters
    if (!req.params.username) {
      res.json({ success: false, message: 'Username was not provided' }); // Return error
    } else {
      // Look for username in database
      User.findOne({ username: req.params.username }, (err, user) => {
        // Check if connection error was found
        if (err) {
          res.json({ success: false, message: err }); // Return connection error
        } else {
          // Check if user's username was found
          if (user) {
            res.json({ success: false, message: 'Username is already taken' }); // Return as taken username
          } else {
            res.json({ success: true, message: 'Username is available' }); // Return as vailable username
          }
        }
      });
    }
  });

  /* ========
  LOGIN ROUTE
  ======== */
  router.post('/login', (req, res) => {
    // Check if username was provided
    if (!req.body.username) {
      res.json({ success: false, message: 'No username was provided' }); // Return error

    } else {
      // Check if password was provided
      if (!req.body.password) {
        res.json({ success: false, message: 'No password was provided.' }); // Return error
      } else {
        // Check if username exists in database
        User.findOne({ username: req.body.username.toLowerCase() }, (err, user) => {
          // Check if error was found
          if (err) {
            res.json({ success: false, message: err }); // Return error
          } else {
            // Check if username was found
            if (!user) {
              res.json({ success: false, message: 'Username not found.' }); // Return error
            } else {
              const validPassword = user.comparePassword(req.body.password); // Compare password provided to password in database
              // Check if password is a match
              if (!validPassword) {
                res.json({ success: false, message: 'Password invalid' }); // Return error
              }//comment portion
              else if (!user.active) {
                res.json({ success: false, message: 'Account is not yet activated. Please check your e-mail for activation link.', expired: true }); // Account is not activated 
              }
              else {
                const token = jwt.sign({ userId: user._id, username: user.username, permission: user.permission }, config.secret, { expiresIn: '24h' }); // Create a token for client
                res.json({ success: true, message: 'User authenticated', token: token, user: { username: user.username, permission: user.permission } }); // Return success and token to frontend
              }
            }
          }
        });
      }
    }
  });

  /* ============================================
  Route to send user's username to e-mail
  =============================================== */

  router.get('/resendUsername/:email', (req, res) => {
    User.findOne({ email: req.params.email }).select('email username').exec((err, user) => {
      if (err) {
        res.json({ success: false, message: 'Something Went Wrong. Please Try Again' }); // Error if cannot connect
      }
      else if (!user) {
        res.json({ success: false, message: 'E-mail was not found' }); // Return error if e-mail cannot be found in database
      }
      else {
        nodemailer.createTestAccount((err, account) => {
          // create reusable transporter object using the default SMTP transport
          let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587, //587
            secure: false, // true for 465, false for other ports
            auth: {
              user: "", // eg john@gmail.com
              pass: ""  // eg password asdjdfshfjkas
            }
          });
          const email = {
            from: 'Localhost Staff, mominskybird@gmail.com',
            to: user.email,
            subject: 'Localhost Username Request',
            text: 'Hello ' + user.email + ', You recently requested your username. Please save it in your files: ' + user.username,
            html: 'Hello<strong> ' + user.email + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
          };
          transporter.sendMail(email, (error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
          });
        });
        res.json({ success: true, message: 'Username has been sent to e-mail! ' }); // Return success message once e-mail has been sent
      }
    });
  });


  /* ==============================================
  Route to send password reset link to the user
  ================================================= */

  router.put('/resetpassword', (req, res) => {
    User.findOne({ email: req.body.email }).select('username active email').exec((err, user) => {
      if (err) throw err; // Throw error if cannot connect
      if (!user) {
        res.json({ success: false, message: 'Email was not found' }); // Return error if username is not found in database
      } else if (!user.active) {
        res.json({ success: false, message: 'Account has not yet been activated' }); // Return error if account is not yet activated
      } else {
        //NOTE CHECK THE BELOW LINE NUMBER
        user.resettoken = jwt.sign({ username: user.username, email: user.email }, config.secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail
        // Save token to user in database
        user.save((err) => {
          if (err) {
            res.json({ success: false, message: err }); // Return error if cannot connect
          } else {
            nodemailer.createTestAccount((err, account) => {
              // create reusable transporter object using the default SMTP transport
              let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587, //587
                secure: false, // true for 465, false for other ports
                auth: {
                  user: "", // eg john@gmail.com
                  pass: ""  // eg password jkfakfdhajfha
                }
              });
              const email = {
                from: 'Localhost Staff, mominskybird@gmail.com',
                to: user.email,
                subject: 'Localhost Reset Password Request',
                text: 'Hello ' + user.email + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br> <a href="http://localhost:8080/resetpassword/' + user.resettoken,
                html: 'Hello<strong> ' + user.email + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/resetpassword/' + user.resettoken + '">http://localhost:8080/resetpassword/</a>'
              };
              transporter.sendMail(email, (error, info) => {
                if (error) {
                  return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
              });
            });
            res.json({ success: true, message: 'Please check your e-mail for password reset link' }); // Return success message
          }
        });
      }
    });
  });

  /* ==============================================
  Route to verify user's e-mail activation link
  ================================================= */

  router.get('/resetpassword/:token', (req, res) => {

    User.findOne({ resettoken: req.params.token }).select().exec((err, user) => {
      if (err) throw err; // Throw err if cannot connect
      var token = req.params.token; // Save user's token from parameters to variable
      // Function to verify token
      //      jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        res.json({ success: false, message: 'Password Link Has Expired!!' });  // Token has expired or is invalid
      } else {
        if (!user) {
          res.json({ success: false, message: 'Password Link Has Expired' });  // Token is valid but not no user has that token anymore
        } else {
          res.json({ success: true, user: user, message: 'User Has Been Sent' });// Return user object to controller
        }
      }
    });
    //    });
  });

  /* ======================================
  Save user's new password to database
  ========================================= */
  router.put('/savepassword/', (req, res) => {
    User.findOne({ username: req.body.username }).select('email username password resettoken').exec((err, user) => {
      if (err) throw err; // Throw error if cannot connect
      if (!user) {
        res.json({ success: false, message: 'User was not found' }); // Return error if user is not found in database
      }
      else if (!req.body.password || req.body.password == null || req.body.password == '') {
        res.json({ success: false, message: 'Password not provided' });
      } else {
        user.password = req.body.password; // Save user's new password to the user object
        user.resettoken = false; // Clear user's resettoken 
        // Save user's new data
        user.save((err) => {
          if (err) {
            res.json({ success: false, message: err });
          } else {
            nodemailer.createTestAccount((err, account) => {
              // create reusable transporter object using the default SMTP transport
              let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587, //587
                secure: false, // true for 465, false for other ports
                auth: {
                  user: "", // eg john@gmail.com
                  pass: ""  // eg password jhsdajlkfhasj
                }
              });
              // Create e-mail object to send to user
              var email = {
                from: 'Localhost Staff, staff@localhost.com',
                to: user.email,
                subject: 'Localhost Reset Password',
                text: 'Hello ' + user.username + ', This e-mail is to notify you that your password was recently reset at localhost.com',
                html: 'Hello<strong> ' + user.username + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at localhost.com'
              };
              transporter.sendMail(email, (error, info) => {
                if (error) {
                  return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
              });
            });
            res.json({ success: true, message: 'Password has been reset!' }); // Return success message
          }
        });
      }
    });

  });

  /* ======================================
   Router To Activate User Account
   ======================================== */
  router.put('/activate/', (req, res) => {
    User.findOne({ temporarytoken: req.body.token }).select('email username temporarytoken active').exec((err, user) => {
      if (err) throw err; // Throw error if cannot login
      var token = req.body.token; // Save the token from URL for verification 
      // Function to verify the user's token
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          res.json({ success: false, message: 'Activation Link Has Expired.' });// Token is expired
        } else if (!user) {
          res.json({ success: false, message: 'Link Has Been Expired.' });// Token may be valid but does not match any user in the database
        } else if (user.active == true) {
          res.json({ success: false, message: 'Account Is Already Activated.' });// If account already activated
        }
        else {
          token = null; // Remove temporary token
          user.active = true; // Change account status to Activated
          // Mongoose Method to save user into the database
          user.save((err) => {
            if (err) {
              res.json({ success: false, message: 'Unable to save the user' });
              console.log(err); // If unable to save user, log error info to console/terminal
            } else {
              // If save succeeds, create e-mail object // Create e-mail object to send to user            
              nodemailer.createTestAccount((err, account) => {
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                  host: 'smtp.gmail.com',
                  port: 587, //587
                  secure: false, // true for 465, false for other ports
                  auth: {
                    user: "", // eg john@gmail.com
                    pass: ""  // hjdkalsfajs
                  }
                });
                const email = {
                  from: 'Localhost Staff, staff@localhost.com',
                  to: user.email,
                  subject: 'Account Activated',
                  text: 'Hello ' + user.username + ', Your account has been successfully activated!',
                  html: 'Hello<strong> ' + user.username + '</strong>,<br><br>Your account has been successfully activated!'
                };
                transporter.sendMail(email, (error, info) => {
                  if (error) {
                    return console.log(error);
                  }
                });
              });
              res.json({ success: true, message: 'Account activated!' }); // Return success message to controller
            }
          });
        }
      });
    });
  });

  /* ===================================================================
  Route to verify user credentials and re-sending a new activation link	
  ====================================================================== */

  router.post('/resend', (req, res) => {
    User.findOne({ username: req.body.username }).select('email username password temporarytoken active').exec((err, user) => {
      if (err) throw err; // Throw error if cannot connect
      // Check if username is found in database
      if (!user) {
        res.json({ success: false, message: 'Could not authenticate user' }); // Username does not match username found in database
      } else if (user) {
        // Check if password is sent in request
        if (req.body.password) {
          var validPassword = user.comparePassword(req.body.password); // Password was provided. Now check if matches password in database
          if (!validPassword) {
            res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password found in database
          } else if (user.active) {
            res.json({ success: false, message: 'Account is already activated.' }); // Account is already activated
          } else {
            // If save succeeds, create e-mail object // Create e-mail object to send to user            
            nodemailer.createTestAccount((err, account) => {
              // create reusable transporter object using the default SMTP transport
              let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587, //587
                secure: false, // true for 465, false for other ports
                auth: {
                  user: "",
                  pass: ""
                }
              });
              // If user successfully saved to database, create e-mail object
              var email = {
                from: 'Localhost Staff, staff@localhost.com',
                to: user.email,
                subject: 'Localhost Activation Link Request',
                text: 'Hello ' + user.username + ', You recently requested a new account activation link. Please click on the following link to complete your activation: http://localhost:8080/activation/' + user.temporarytoken,
                html: 'Hello<strong> ' + user.username + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activation/' + user.temporarytoken + '">http://localhost:8080/activation/</a>'
              };
              // Function to send e-mail to user
              transporter.sendMail(email, (error, info) => {
                if (error) {
                  return console.log(error);
                }
              });
            });
            res.json({ success: true, message: 'Activation link has been sent to ' + user.email + '!' }); // Return success message to controller
          }
        }
      }
    });
  });

  /* ================================================
  MIDDLEWARE - Used to grab user's token from headers
  ================================================ */

  router.use((req, res, next) => {
    var token = req.headers['authorization']; // Create token found in headers
    // Check if token was found in headers
    if (!token) {
      res.json({ success: false, message: 'No token provided' }); // Return error
    } else {
      // Verify the token is valid
      jwt.verify(token, config.secret, (err, decoded) => {
        // Check if error is expired or invalid
        if (err) {
          res.json({ success: false, message: 'Token invalid: ' + err }); // Return error for token validation
        } else {
          req.decoded = decoded; // Create global variable to use in any request beyond
          next(); // Exit middleware
        }
      });
    }
  });
  /* ============================================
  Route to get the curremt user;s permission level
  =============================================== */

  router.get('/permission', (req, res) => {
    User.findOne({ username: req.decoded.username }, (err, user) => {
      if (err) {
        res.json({ success: false , message: "Something went wrong!"});
      }
      else if (!user){
        res.json({ success: false, message: 'No user was found'});
      }
      else {
        res.json({ success: true, permission: user.permission});
      }
    });
});
  /* ===============================================================
      Route to get user's profile data
   =============================================================== */

  router.get('/profile', (req, res) => {
    // Search for user in database
    User.findOne({ _id: req.decoded.userId }).select('username email permission').exec((err, user) => {
      // Check if error connecting
      if (err) {
        res.json({ success: false, message: err }); // Return error
      } else {
        // Check if user was found in database
        if (!user) {
          res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
        } else {
          res.json({ success: true, user: user }); // Return success, send user object to frontend for profile
        }
      }
    });
  });

  /* ===============================================
      Route to get all users for dashboard page
  ================================================== */

  router.get('/getUsers', (req, res) => {

    //  var pageNo = parseInt(req.query.pageNo)
    //  var size = parseInt(req.query.size)
    var pageNo = 1;
    var size = 10;
    var query = {}
    if (pageNo < 0 || pageNo === 0) {
      res.json({ success: false, message: "Invalid page number, should start with 1" });
      //    response = {"error" : true,"message" : "invalid page number, should start with 1"};
      //    return res.json(response)
    }
    query.skip = size * (pageNo - 1)
    query.limit = size
    // Find some documents
    User.count({}, function (err, totalCount) {
      if (err) {
        //  response = {"error" : true,"message" : "Error fetching data"}
        res.json({ success: false, message: err });
      }
      User.find({}, {}, query, function (err, users) {

        if (err) {
          res.json({ success: false, message: err });
        } else {

          User.findOne({ _id: req.decoded.userId }, (err, mainUser) => {

            // Check if logged in user was found in database
            if (!mainUser) {
              res.json({ success: false, message: 'No user found' }); // Return error
            } else {
              // Check if user has editing/deleting privileges 
              if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                // Check if users were retrieved from database
                if (!users) {
                  res.json({ success: false, message: 'Users not found' }); // Return error
                } else {
                  var totalPages = Math.ceil(totalCount / size)
                  res.json({ success: true, users: users, permission: mainUser.permission, "pages": totalPages }); // Return users, along with current user's permission
                }
              } else {
                res.json({ success: false, message: 'Insufficient Permissions' }); // Return access error
              }
            }
          });
        }
      }).sort({ '_id': -1 });


      // Mongo command to fetch all data from collection.
      //            if(err) {
      //              res.json({ success: false, message: "Error fetching data" });
      //            } else {
      //                var totalPages = Math.ceil(totalCount / size)
      //                response = {"error" : false,"message" : users,"pages": totalPages};
      //            }
      //            res.json(response);
      //         });
    })

  });


  /* ===============================================
      Route to get single user for delete page
  ================================================== */

  router.get('/singleUser/:id', (req, res) => {
    if (!req.params.id) {
      res.json({ success: false, message: 'No User ID Was Provided' });
    }
    else {
      User.findOne({ _id: req.params.id }).select('_id username email permission').exec((err, user) => {
        if (err) {
          res.json({ success: false, message: 'Not A Valid User ID' });
        } else {
          if (!user) {
            res.json({ success: false, message: 'User Not Found' });
          } else {
            res.json({ success: true, user: user });
          }
        }
      });
    }
  });


  /* ===============================================
     Route to delete Single User in Delete User(ID)
 ================================================== */

  router.delete('/deleteSingleUser/:id', (req, res) => {
    if (!req.params.id) {
      res.json({ success: false, message: 'No User ID Was Provided' });
    } else {
      var deletedUser = req.params.id; // Assign the username from request parameters to a variable
      User.findOne({ _id: req.params.id }, (err, mainUser) => {
        if (err) {
          res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
        } else {
          // Check if current user was found in database
          if (!mainUser) {
            res.json({ success: false, message: 'No user found' }); // Return error
          } else {
            // Check if curent user has admin access
            if (mainUser.permission === 'admin') {
              res.json({ success: false, message: 'Admin Can Not Be Deleted' }); // Return error
            } else {
              // Fine the user that needs to be deleted
              User.findOneAndRemove({ _id: deletedUser }, (err, user) => {
                if (err) {
                  res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                }
                else if (user.permission !== 'admin') {
                  res.json({ success: true, message: 'User Has Been Successfully Deleted' });
                }
              });
            }
          }
        }
      });
    }
  });

  /*
      // Route to update/edit a user
      router.put('/editUser', function (req, res) {
       var editUser = req.body._id; // Assign _id from user to be editted to a variable
    
      //  var editUser = req.params.id;
       // if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
        if (req.body.username) var newUsername = req.body.username; // Check if a change to username was requested
        if (req.body.email) var newEmail = req.body.email; // Check if a change to e-mail was requested
        if (req.body.permission) var newPermission = req.body.permission; // Check if a change to permission was requested
        // Look for logged in user in database to check if have appropriate access
        User.findOne({ username: req.decoded.username }, function (err, mainUser) {
          if (err) {
            res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
          } else {
            // Check if logged in user is found in database
            if (!mainUser) {
              res.json({ success: false, message: "No User Found" }); // Return error
            } else {
              // Check if a change to name was requested
              /*
              if (newName) {
                // Check if person making changes has appropriate access
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                  // Look for user in database
                  User.findOne({ _id: editUser }, function (err, user) {
                    if (err) {
                      res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                    } else {
                      // Check if user is in database
                      if (!user) {
                        res.json({ success: false, message: 'No user found' }); // Return error
                      } else {
                        user.name = newName; // Assign new name to user in database
                        // Save changes
                        user.save(function (err) {
                          if (err) {
                            console.log(err); // Log any errors to the console
                          } else {
                            res.json({ success: true, message: 'Name has been updated!' }); // Return success message
                          }
                        });
                      }
                    }
                  });
                } else {
                  res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
              }
              
              
              // Check if a change to username was requested
              if (newUsername) {
                // Check if person making changes has appropriate access
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                  // Look for user in database
                  User.findOne({ _id: editUser }, function (err, user) {
                    if (err) {
                      res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                    } else {
                      // Check if user is in database
                      if (!user) {
                        res.json({ success: false, message: 'No user found!' }); // Return error
                      } else {
                        user.username = newUsername; // Save new username to user in database
                        // Save changes
                        user.save(function (err) {
                          if (err) {
                            console.log(err); // Log error to console
                          } else {
                            res.json({ success: true, message: 'Username has been updated' }); // Return success
                          }
                        });
                      }
                    }
                  });
                } else {
                  res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
              }
    
              // Check if change to e-mail was requested
              if (newEmail) {
                // Check if person making changes has appropriate access
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                  // Look for user that needs to be editted
                  User.findOne({ _id: editUser }, function (err, user) {
                    if (err) {
                      res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                    } else {
                      // Check if logged in user is in database
                      if (!user) {
                        res.json({ success: false, message: 'No user found!!' }); // Return error
                      } else {
                        user.email = newEmail; // Assign new e-mail to user in databse
                        // Save changes
                        user.save(function (err) {
                          if (err) {
                            console.log(err); // Log error to console
                          } else {
                            res.json({ success: true, message: 'E-mail has been updated' }); // Return success
                          }
                        });
                      }
                    }
                  });
                } else {
                  res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
              }
    
              // Check if a change to permission was requested
              if (newPermission) {
                // Check if user making changes has appropriate access
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                  // Look for user to edit in database
                  User.findOne({ _id: editUser }, function (err, user) {
                    if (err) {
                      res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                    } else {
                      // Check if user is found in database
                      if (!user) {
                        res.json({ success: false, message: 'No user found' }); // Return error
                      } else {
                        // Check if attempting to set the 'user' permission
                        if (newPermission === 'user') {
                          // Check the current permission is an admin
                          if (user.permission === 'admin') {
                            // Check if user making changes has access
                            if (mainUser.permission !== 'admin') {
                              res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade an admin.' }); // Return error
                            } else {
                              user.permission = newPermission; // Assign new permission to user
                              // Save changes
                              user.save(function (err) {
                                if (err) {
                                  console.log(err); // Long error to console
                                } else {
                                  res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                }
                              });
                            }
                          } else {
                            user.permission = newPermission; // Assign new permission to user
                            // Save changes
                            user.save(function (err) {
                              if (err) {
                                console.log(err); // Log error to console
                              } else {
                                res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                              }
                            });
                          }
                        }
                        // Check if attempting to set the 'moderator' permission
                        if (newPermission === 'moderator') {
                          // Check if the current permission is 'admin'
                          if (user.permission === 'admin') {
                            // Check if user making changes has access
                            if (mainUser.permission !== 'admin') {
                              res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade another admin' }); // Return error
                            } else {
                              user.permission = newPermission; // Assign new permission
                              // Save changes
                              user.save(function (err) {
                                if (err) {
                                  console.log(err); // Log error to console
                                } else {
                                  res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                                }
                              });
                            }
                          } else {
                            user.permission = newPermission; // Assign new permssion
                            // Save changes
                            user.save(function (err) {
                              if (err) {
                                console.log(err); // Log error to console
                              } else {
                                res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                              }
                            });
                          }
                        }
    
                        // Check if assigning the 'admin' permission
                        if (newPermission === 'admin') {
                          // Check if logged in user has access
                          if (mainUser.permission === 'admin') {
                            user.permission = newPermission; // Assign new permission
                            // Save changes
                            user.save(function (err) {
                              if (err) {
                                console.log(err); // Log error to console
                              } else {
                                res.json({ success: true, message: 'Permissions have been updated!' }); // Return success
                              }
                            });
                          } else {
                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level' }); // Return error
                          }
                        }
                      }
                    }
                  });
                } else {
                  res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
                }
              }
            }
          }
        });
      });
    */

  /* ===============================================
     Route to update Single User(ID)
   ================================================== */
  router.put('/editUser', function (req, res) {
    var editUser = req.body._id; // Assign _id from user to be editted to a variable

    // var editUser = req.params.id;
    // if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
    if (req.body.username) var newUsername = req.body.username; // Check if a change to username was requested

    // Look for logged in user in database to check if have appropriate access
    User.findOne({ username: req.decoded.username }, function (err, mainUser) {
      if (err) {
        res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
      } else {
        // Check if logged in user is found in database
        if (!mainUser) {
          res.json({ success: false, message: "No User Found" }); // Return error
        } else {
          if (newUsername) {
            // Check if person making changes has appropriate access
            if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
              // Look for user in database
              User.findOne({ _id: editUser }, function (err, user) {
                if (err) {
                  res.json({ success: false, message: 'Something went wrong. This error has been logged and will be addressed by our staff. We apologize for this inconvenience!' });
                } else {
                  // Check if user is in database
                  if (!user) {
                    res.json({ success: false, message: 'No user found!' }); // Return error
                  }
                  else {
                    // user.username = newUsername; // Save new username to user in database
                    user.username = req.body.username.toLowerCase();
                    user.email = req.body.email.toLowerCase();
                    user.permission = req.body.permission;
                    // Save changes
                    user.save(function (err) {
                      if (err) {
                        // Check if error is an error indicating duplicate account
                        if (err.code === 11000) {
                          res.json({ success: false, message: 'Username or e-mail already exists' }); // Return error
                        } else {
                          // Check if validation error is in the username field
                          if (err.errors.username) {
                            res.json({ success: false, message: err.errors.username.message }); // Return error
                          }
                          else {
                            res.json({ success: false, message: err }); // Return any other error not already covered
                          }
                        }
                      }
                      else {
                        res.json({ success: true, message: 'Successfully updated' }); // Return success
                      }
                    });
                  }
                }
              });
            } else {
              res.json({ success: false, message: 'Insufficient Permissions' }); // Return error
            }
          }
        }
      }
    });
  });

  return router; // Return router object to main index.js
}
