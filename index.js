'use strict';

var express = require('express'),
jwt = require('jsonwebtoken'),
expressJwt = require('express-jwt'),
router = express.Router(),
cors = require('cors'),
bodyParser = require('body-parser'),
request = require('request'),
config = require('./config.js');

var app = express();

// CORS setup
var corsOption = {
	origin: true,
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
	credentials: true,
	exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));

// Accept JSON from the client side
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());


// Creates a JWT
var createToken = function(auth) {
	return jwt.sign({
		id: auth.id
	}, 'my-secret',
	{
		expiresIn: 60 * 60 * 24 * 30
	});
};


// Middleware for generating a token
var generateToken = function (req, res, next) {
	req.token = createToken(req.auth);
	return next();
};


// Get the token from Twitter
app.post('/auth/twitter/request', function(req, res) {
	request.post({
		url: 'https://api.twitter.com/oauth/request_token',
		oauth: {
			oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
			consumer_key: config.consumerKey,
			consumer_secret: config.consumerSecret
		}
	}, function (err, r, body) {
		if (err) {
			return res.send(500, { message: err.message });
		}
		var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
		res.send(JSON.parse(jsonStr));
	});
});

app.post('/auth/twitter/login', function(req, res, next) {
	request.post({
		url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
		oauth: {
			consumer_key: config.consumerKey,
			consumer_secret: config.consumerSecret,
			token: req.query.oauth_token
		},
		form: { oauth_verifier: req.query.oauth_verifier }
	}, function (err, r, body) {
		if (err) {
			return res.send(500, { message: err.message });
		}

		const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
		const parsedBody = JSON.parse(bodyString);
		res.json(parsedBody);
	});
});

app.listen(process.env.PORT || 4444);