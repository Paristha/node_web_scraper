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
		console.log(new Date().toISOString() + entry);
	}
};

function resetTable() {
	var dropTable = 'DROP TABLE IF EXISTS word_count';
	connection.query(dropTable, function (error, result) {
		if (error) {
			callbackFailure(error);
		}
	});
	
	var createTable = 'CREATE TABLE word_count (word VARCHAR(255) PRIMARY KEY, count INT(11))';
	connection.query(createTable, function (error, result) {
		if (error) {
			callbackFailure(error);
		}
	});
}

const insertOrUpdateRowPromise = new Promise((resolve, reject) => {
	connection.connect(function(error) { //initialize db
		if (error) {
			log('Database connection failed: ' + error.stack);
			reject(error); 
			}
		log('Connected to mysql server.');

		var createDB = 'CREATE DATABASE IF NOT EXISTS nyt_webscraper_db';
		connection.query(createDB, function (error, result) {
			if (error) reject(error);
			log('Database created or exists');
		});
		
		var useDB = 'USE nyt_webscraper_db';
		connection.query(useDB, function (error, result) {
			if (error) reject(error);
			log('Database selected');
		});
		
		resolve(function(params) { //return function used to insert into table
			var query = 'INSERT INTO word_count (word, count) VALUES ? ON DUPLICATE KEY UPDATE count=count+VALUES(count)';
			connection.query(query, [params], (error, result) => {
				if (error) log(error);
				else log(result);
			});
		});
		
	});
});




const app = express();
const html = fs.readFile('app.html');
var port = process.env.PORT || 3000;
var htmldata = '';

app.use(express.static('public'));

app.get('/', function (req, res) {
	html.then(
		function(data) {
			htmldata = data.toString();
			res.send(htmldata);
			res.end();
			},
		(error) => callbackFailure);
	});

app.get('/nytArchive/:year/:month/:sampling', function (req, res) {
	log('req: ' + JSON.stringify(req.body));
	chartHTML(req.params.year, req.params.month, req.params.sampling)
	.then(function(data) {
		console.log('success');
		res.send(data);
		res.end();
		setTimeout(() => {}, 30000);
		},
		(error) => callbackFailure);
	});

var server = http.createServer(app).listen(port); // Listen on port 3000, IP defaults to 127.0.0.1
log('Server running at http://127.0.0.1:' + port + '/');

async function chartHTML(year, month, sampling) {
	try{
		console.log('function called');
		var childProcess = spawn('node', ['nytArchiveGET.js', year, month, sampling]);
		resetTable();
		var insertOrUpdateRow = await (insertOrUpdateRowPromise);
		var $ = cheerio.load(htmldata);
		console.log('ready to receive data');
	} catch(error) {
		callbackFailure(error)
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
			connection.query('SELECT * FROM word_count ORDER BY count DESC LIMIT 10', (error, result) => {
				if (error) {
					callbackFailure(error);
				} else {
					let rows = {};
					result.forEach(function(row) { rows[row.word] = row.count; });
					let words = Object.keys(rows);
					let counts = Object.values(rows);
					console.log('all data organized');
					
					$('#myChart').attr('data-words', JSON.stringify(words));
					$('#myChart').attr('data-counts', JSON.stringify(counts));
					$("#myChart").css('display', 'block');
					
					$("#year-select dt a span span").text(year.toString());
					$("#month-select dt a span span").text(month.toString());
					$("#sampling-select dt a span span").text(sampling.toString());
					
					resolve($.root().html());
					}
				});
			});
		});
	return exitPromise;
}

function callbackFailure(error) {
	log(error);
	throw error;
}
