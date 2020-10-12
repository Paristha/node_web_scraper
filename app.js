const cheerio = require('cheerio'),
	fs = require('fs').promises,
	http = require('http'),
	spawn = require("child_process").spawn;

var port = process.env.PORT || 3000;

var htmlPromise = fs.readFile('index.html');

var log = function(entry) {
	fs.appendFileSync('/tmp/sample-app.log', new Date().toISOString() + ' - ' + entry + '\n');
};


//const childProcess = spawn('node', ["test_scripts/axios_test_nyt_archivedump.js"]);
//childProcess.stdout.on('data', (data) => {
//	// Do something with the data returned from script
//});

var server = http.createServer(function (req, res) {
	if (req.method === 'POST') {
		var body = '';

		req.on('data', function(chunk) {
			body += chunk;
		});

		req.on('end', function() {
			if (req.url === '/') {
				log('Received message: ' + body);
			} else if (req.url = '/scheduled') {
				log('Received task ' + req.headers['x-aws-sqsd-taskname'] + ' scheduled at ' + req.headers['x-aws-sqsd-scheduled-at']);
			}

			res.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
			res.end();
		});
	} else {
		res.writeHead(200);
		var html = htmlPromise.then(renderHTML, renderErrorPage);
		res.write(html);
		res.end();
	}
});

function renderHTML(data) {
	try {
		var $ = cheerio.load(data);
		$('.textColumn').append('<p>This is podracing!</p>');
		return getHTML($.root().text());
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
	throw error;
}

// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + port + '/');

var mysql = require('mysql');

var connection = mysql.createConnection({
	host	 : process.env.RDS_HOSTNAME,
	user	 : process.env.RDS_USERNAME,
	password : process.env.RDS_PASSWORD,
	port	 : process.env.RDS_PORT
});

connection.connect(function(err) {
	if (err) {
		console.error('Database connection failed: ' + err.stack);
		return; 
		}
	console.log('Connected to database.'); 
	}
);

connection.end();