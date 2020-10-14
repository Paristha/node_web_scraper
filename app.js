const cheerio = require('cheerio'),
	app = require('express')(),
	fs = require('fs').promises,
	http = require('http'),
	mysql = require('mysql');
//	spawn = require("child_process").spawn;

var port = process.env.PORT || 3000;

var html = fs.readFile('index.html').then(renderHTML, renderErrorPage);

var log = function(entry) {
	try {
		fs.appendFile('tmp/nyt_webscraper_sqlinput.log', new Date().toISOString() + ' - ' + entry + '\n');
	} catch (error) {
		console.log(error);
	}
};

app.get('/', function (req, res) {
	html.then( function (data) {
		res.send(data);
		res.end();
		});
	});

var server = http.createServer(app).listen(port);


//const childProcess = spawn('node', ['nytArchiveGET.js', '2019', '1']);
//childProcess.stdout.on('data', (data) => {
//	var words = data.split(' ');
//});

//var server = http.createServer(function (req, res) {
//	if (req.method === 'POST') {
//		var body = '';
//
//		req.on('data', function(chunk) {
//			body += chunk;
//		});
//
//		req.on('end', function() {
//			if (req.url === '/') {
//				log('Received message: ' + body);
//			} else if (req.url = '/scheduled') {
//				log('Received task ' + req.headers['x-aws-sqsd-taskname'] + ' scheduled at ' + req.headers['x-aws-sqsd-scheduled-at']);
//			}
//
//			res.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
//			res.end();
//		});
//	} else {
//		res.writeHead(200);
//		html.then( function (data) {
//			res.write(data, function (error) {
//				res.end();
//			});
//		});
//	}
//});

function renderHTML(data) {
	try {
		var $ = cheerio.load(data);
		$('.textColumn').append('<p>This is podracing!</p>');
		return $.root().html();
	} catch (error) {
		callbackFailure(error);
	}
}

function renderErrorPage(error) {
	return fs.readFile('error.html').then(getHTML, callbackFailure);
}

function getHTML(data) {
	return data;
}

function callbackFailure(error) {
	log(error);
	throw error;
}

// Listen on port 3000, IP defaults to 127.0.0.1
//server.listen(port);

// Put a friendly message on the terminal
log('Server running at http://127.0.0.1:' + port + '/');

const connection = mysql.createConnection({
	host	 : process.env.RDS_HOSTNAME,
	user	 : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port	 : process.env.RDS_PORT
});

connection.connect(function(err) { //initialize db
	if (err) {
		log('Database connection failed: ' + err.stack);
		return; 
		}
	log('Connected to mysql server.');

	var createDB = 'CREATE DATABASE nyt_webscraper_db';
	connection.query(createDB, function (err, result) {
		if (err) log('Database already created');
		else log('Database created');
	});
	
	var useDB = 'USE nyt_webscraper_db';
	connection.query(useDB, function (err, result) {
		if (err) throw err;
		log('Database selected');
	});
	
	var createTable = 'CREATE TABLE word_count (word VARCHAR(255), count INT(11))';
	connection.query(createTable, function (err, result) {
		if (err) log('Table already created');
		else log('Table created');
	});
});