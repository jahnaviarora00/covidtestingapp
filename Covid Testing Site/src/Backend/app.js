const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const employeeAPI = require("./employeeAPI.js");

let app = express();
app.use('/static_media', express.static('../../Media'))
app.use('/static', express.static('../Frontend'));
app.use('/static_src', express.static('../'));

app.use(express.urlencoded({
	extended: true
}));

let currentLabID = null;

let sqlManager = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "password",
	database: "covidtesting" //Change this to your local database name
});

sqlManager.connect((err) => {
	if (err) throw err;
	console.log("Connected!");
});

app.get("/patientLogin", (req, res) => {
	res.sendFile('patientLogin.html', { root: path.join(__dirname, '../Frontend') });
});

app.get("/labLogin", (req, res) => {
	res.sendFile('labLogin.html', { root: path.join(__dirname, '../Frontend') });
});

app.post("/login/patient", (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	if (email && password) {
		sqlManager.query('SELECT * FROM Employee WHERE email = ? AND passcode = ?', [email, password], function (error, results, fields) {
			if (results != undefined && results.length > 0) {
				// req.session.id = id;
				res.redirect('../static/employeeResults.html');
			} else {
				res.send('Incorrect Username and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

app.post("/login/lab", (req, res) => {
	const id = req.body.labID;
	const password = req.body.password;
	if (id && password) {
		sqlManager.query('SELECT * FROM LabEmployee WHERE labID = ? AND password = ?', [id, password], function (error, results, fields) {
			if (results != undefined && results.length > 0) {
				// req.session.id = id;
				currentLabID = id;
				if (req.body.buttonType == "lab") {
					res.redirect('../static/poolMapping.html');
				} else if (req.body.buttonType == "collection") {
					res.redirect('../static/testCollection.html');
				}
			} else {
				res.send('Incorrect Username and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});


app.use(employeeAPI);
app.listen(8080);
