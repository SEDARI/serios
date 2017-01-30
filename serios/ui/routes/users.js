var passport = require('passport');
var express = require('express');
var login = require('connect-ensure-login');
var tokens = require('../db/tokens');
var querystring = require('querystring');
var request = require('request');
var util = require('./util');

function router(conf, idm_conf, router) {

  var url = idm_conf.protocol + "://" + idm_conf.host + ":" + idm_conf.port + "/idm/api/v1"
  /*
   reading user
  */
  router.route('/read_user').get(login.ensureLoggedIn('/auth/example/'), function (req, res) {
    res.render("find_user", {
      "action": "read"
    });
  });

  router.route('/read_user').post(login.ensureLoggedIn('/auth/example/'), function (req, res) {
    var action = "read user";
    //first we read the token
    tokens.find(req.user.id, function (error, accesstoken) {
      var query = querystring.stringify({
        "auth_type": req.body.auth_type,
        "user_name": req.body.user_name
      });
      //build http options
      var options = {
        url: url + '/user/?' + query,
        headers: {
          'Authorization': 'bearer ' + accesstoken,
          'User-Agent': 'user-agent',
          'Content-type': 'application/json'
        }
      };
      //send request
      /*
       the render view expects  an object called result with the format:
        {"result":[{"label":"label1","value":"value1"},{"label":"label2","value":"value2"},...],"action":"type of action"};
       so here we build it properly with utils and passing the action type.
      */
      request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            var result = JSON.parse(body);
            res.render('result', {
              "result": util.formatOutput(result),
              "action": action
            });

          } catch (error) {
            res.render('result', {
              "result": [{
                "label": "error",
                "value": "unexpected result from IDM  endpoint " + error
              }],
              "action": action
            });
          }
        } else if (!error) {
          res.render('result', {
            "result": [{
              "label": "error",
              "value": "unexpected status code from IDM  endpoint :" + response.statusCode + "error:" + response.body
            }],
            "action": action
          });
        } else {
          res.render('result', {
            "result": [{
              "label": "error",
              "value": "unexpected result from IDM  endpoint " + error
            }],
            "action": action
          });
        }
      });
    });
  });

  /*
    creating user (unrestricted to allow for signup)
  */
  router.route('/create_user').get(function (req, res) {
    res.render("create_user");
  });

  router.route('/create_user').post(function (req, res) {
       
      var host = idm_conf.host;
      var port = idm_conf.port;
      var client = conf.clientID;
      var secret = conf.clientSecret;
      var protocol = idm_conf.protocol;

      var user = {
          "auth_type": req.body.auth_type,
          "user_name": req.body.user_name,
          "role": req.body.role
      };
      if(req.body.password){
          user.password = req.body.password;
      }
        
      var auth = "Basic " + new Buffer(client + ":" + secret).toString("base64");
      request(
          {
              method : "POST",
              url : conf.tokenURL,
              form: {
                  grant_type:'client_credentials'
              },
              headers : {
                  "Authorization" : auth
              }
          },
          function (error, response, body) {
              if(error)
                  throw new Error(error);
              var result = JSON.parse(body);
              var token = result.access_token;
              var type  = result.token_type;
              console.log("kind of token obtained: "+type);
              console.log("token obtained: "+token);

	          var options = {
                  url:  protocol+"://"+host+":"+port+ '/idm/api/v1/user/',
                  body: JSON.stringify(user),
                  headers: {
                      'Authorization': 'bearer ' + token,
                      'User-Agent': 'user-agent',
                      'Content-type': 'application/json'
                  }
              };
              request.post(options, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                      try {
                          var result = JSON.parse(body);
	                      console.log("user created: "+body);
                          res.redirect("/");
                      } catch (error) {
                          console.log(error);
                          res.status(500).send("Unexpected behaviour.").end();
                      }
                  } else if (!error) {
                      console.log( "unexpected status code from IDM  endpoint :" + response.statusCode + "response:" + response.body);
                      res.status(response.statusCode).send(response.body).end();
                  } else {
                      console.log("unexpected result from IDM  endpoint " + error);
                      res.status(500).end();
                  }
              });
              
          });                                 
  });

             /*                       
                                    var action = "create user";
    //first we read the token
    tokens.find(req.user.id, function (error, accesstoken) {
      var user = {
        "auth_type": req.body.auth_type,
        "user_name": req.body.user_name,
        "role": req.body.role
      };
      if(req.body.password){
        user.password = req.body.password;
      }
      //build http options
      var options = {
        url: url + '/user/',
        body: JSON.stringify(user),
        headers: {
          'Authorization': 'bearer ' + accesstoken,
          'User-Agent': 'user-agent',
          'Content-type': 'application/json'
        }
      };
*/
      //send request
      /*
       the render view expects  an object called result with the format:
        {"result":[{"label":"label1","value":"value1"},{"label":"label2","value":"value2"},...],"action":"type of action"};
       so here we build it properly with utils and passing the action type.
      */
/*      request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            var result = JSON.parse(body);
            res.render('result', {
              "result": util.formatOutput(result),
              "action": action
            });

          } catch (error) {
            res.render('result', {
              "result": [{
                "label": "error",
                "value": "unexpected result from IDM  endpoint " + error
              }],
              "action": action
            });
          }
        } else if (!error) {
          res.render('result', {
            "result": [{
              "label": "error",
              "value": "unexpected status code from IDM  endpoint :" + response.statusCode + "response:" + response.body
            }],
            "action": action
          });
        } else {
          res.render('result', {
            "result": [{
              "label": "error",
              "value": "unexpected result from IDM  endpoint " + error
            }],
            "action": action
          });
        }
      });
    });

  });*/

  /*
    deleting user
  */
  router.route('/delete_user').get(login.ensureLoggedIn('/auth/example/'), function (req, res) {
    res.render("find_user", {
      "action": "delete"
    });
  });

  //deleting the user...
  router.route('/delete_user').post(login.ensureLoggedIn('/auth/example/'), function (req, res) {
    var action = "delete user";
    //first we read the token
    tokens.find(req.user.id, function (error, accesstoken) {
      var query = querystring.stringify({
        "auth_type": req.body.auth_type,
        "user_name": req.body.user_name
      });
      //build http options
      var options = {
        url: url + '/user/?' + query,
        headers: {
          'Authorization': 'bearer ' + accesstoken,
          'User-Agent': 'user-agent',
          'Content-type': 'application/json'
        }
      };
      //send request
      /*
       the render view expects  an object called result with the format:
        {"result":[{"label":"label1","value":"value1"},{"label":"label2","value":"value2"},...],"action":"type of action"};
       so here we build it properly with utils and passing the action type.
      */
      request.delete(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            res.render('result', {
              "result": [{
                "value": "user deleted successfully",
                "label": "result"
              }],
              "action": action
            });

          } catch (error) {
            res.render('result', {
              "result": [{
                "label": "error",
                "value": "unexpected result from IDM  endpoint " + error
              }],
              "action": action
            });
          }
        } else if (!error) {
          res.render('result', {
            "result": [{
              "label": "error",
              "value": "unexpected status code from IDM  endpoint :" + response.statusCode + "error:" + response.body
            }],
            "action": action
          });
        } else {
          res.render('result', {
            "result": [{
              "label": "error",
              "value": "unexpected result from IDM  endpoint " + error
            }],
            "action": action
          });
        }
      });
    });
  });
  return router;
}
module.exports = router;
