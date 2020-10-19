const chart = require('chart.js'),
	cheerio = require('cheerio'),
	express = require('express'),
	fs = require('fs').promises,
	http = require('http'),
	connection = require('mysql').createConnection({
		host	 : process.env.RDS_HOSTNAME,
		user	 : process.env.RDS_USERNAME,
		password : process.env.RDS_PASSWORD,
		port	 : process.env.RDS_PORT
	}),
	spawn = require('child_process').spawn;

const log = function(entry) {
	try {
		fs.appendFile('tmp/nyt_webscraper_sqlinput.log', new Date().toISOString() + ' - ' + entry + '\n');
	} catch (error) {
		console.log(error);
	}
};

const insertOrUpdateRowPromise = new Promise((resolve, reject) => {
	connection.connect(function(err) { //initialize db
		if (err) {
			log('Database connection failed: ' + err.stack);
			reject(err); 
			}
		log('Connected to mysql server.');

		var createDB = 'CREATE DATABASE IF NOT EXISTS nyt_webscraper_db';
		connection.query(createDB, function (err, result) {
			if (err) reject(err);
			log('Database created or exists');
		});
		
		var useDB = 'USE nyt_webscraper_db';
		connection.query(useDB, function (err, result) {
			if (err) reject(err);
			log('Database selected');
		});
		
		var createTable = 'CREATE TABLE IF NOT EXISTS word_count (word VARCHAR(255) PRIMARY KEY, count INT(11))';
		connection.query(createTable, function (err, result) {
			if (err) reject(err);
			log('Table created or exists');
		});
		
		resolve(function(params) { //return function used to insert into table
			var query = 'INSERT INTO word_count (word, count) VALUES ? ON DUPLICATE KEY UPDATE count=count+VALUES(count)';
			connection.query(query, [params], (err, result) => {
				if (err) log(err);
				else log(result);
			});
		});
		
	});
});

const app = express();
const html = fs.readFile('index.html').then(renderHTML, renderErrorPage);
var port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', function (req, res) {
	chartHTML('2019', '1')
		.then(function(data) {
			console.log('success');
			log(data);
			res.send(data);
			res.end();
			},
			function(error) {
			log(error);
			throw error;
			});
	});

//	html.then( function (data) {
//		res.send(data);
//		res.end();
//		});
//	});

app.get('/nytArchive/:year/:month', function (req, res) {
	chartHTML(req.params.year, req.params.month)
	.then(function(data) {
		res.send(data);
		res.end();
		},
	function(error) {
		log(error);
		throw error;
	});
});

var server = http.createServer(app).listen(port); // Listen on port 3000, IP defaults to 127.0.0.1
log('Server running at http://127.0.0.1:' + port + '/');

function renderHTML(data) {
	try {
		var $ = cheerio.load(data);
		$('.textColumn').append('<p>This is podracing!</p>');
		return $.root().html();
	} catch (error) {
		callbackFailure(error);
	}
}

async function chartHTML(year, month) {
	try{
		console.log('function called');
		var childProcess = spawn('node', ['nytArchiveGET.js', year, month]);
		var insertOrUpdateRow = await (insertOrUpdateRowPromise);
		var data = await (fs.readFile('chart.html'));
		var $ = cheerio.load(data);
		console.log('ready to receive data');
	} catch(err) {
		log(error);
		throw error;
	}
	var outputStream = childProcess.stdout;
	outputStream.on('data', (data) => {
		console.log('data received');
		data = data.toString();
		log('articleBody received: ' + data);
		log('END of articleBody');
		try { 
			var words = data.split(' ');
		} catch(error) {
			console.log(data);
			throw error;
		}
		let wordcount = {};
		words.forEach(function(word) { wordcount[word] = (wordcount[word] || 0) + 1 }); // create word:#ofTimesItIsInArray set
		let params = Object.entries(wordcount);
		insertOrUpdateRow(params);
	});
	var exitPromise = new Promise( (resolve, reject) => {
		childProcess.once('exit', () => {
			console.log('end called');
			log('END called');
			connection.query('SELECT * FROM word_count ORDER BY count DESC LIMIT 10', (err, result) => {
				if (err) {
					log(err);
					reject(err);
				} else {
					let rows = {};
					result.forEach(function(row) { rows[row.word] = row.count; });
					let words = Object.keys(rows);
					let counts = Object.values(rows);
					console.log('all data organized');
					$('#myChart').attr('data-words', JSON.stringify(words));
					$('#myChart').attr('data-counts', JSON.stringify(counts));
					log($.root().html());
					resolve($.root().html());
					}
				});
			});
		});
	return exitPromise;
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
