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

var exclusionList = [];
const localList = fs.readFile('exclusion_list.csv');

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

app.get('/nytArchive/:year/:month/:sampling', async function (req, res, next) {
	chart_page = await chartHTML(req.params.year, req.params.month, req.params.sampling, false).then().catch((error) => {
		var $ = cheerio.load(htmldata);
		$("#error").text(error.stack);
		res.send($.root().html());
		res.end();
		});
	res.send(chart_page);
	});

app.get('/nytArchiveExc/:year/:month/:sampling', async function (req, res, next) {
	if (exclusionList.length == 0) {
		populateList();
	}
	chart_page = await chartHTML(req.params.year, req.params.month, req.params.sampling, true).then().catch((error) => {
		var $ = cheerio.load(htmldata);
		$("#error").text(error.stack);
		res.send($.root().html());
		res.end();
		});;
	res.send(chart_page);
	});

const multer = require('multer');
var storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const stream = require('stream');
var parse = require('csv-parse');

app.post('/wordExclusionList', upload.single('list'), (req, res) => {
	console.log(req.body.wordExclusion);
	var readable = new stream.Readable();
	var csvData=[];
	readable._read = ( () => {
		readable.push(req.file.buffer); 
		readable.push(null);
		});
	readable.pipe(parse({bom: true})).on('data', function(csvrow) {
		csvData.push(csvrow[0].trim());  
	}).on('end',function() {
		console.log(csvData);
		exclusionList = csvData;
		});
	
	res.sendStatus(200);
	});

var server = http.createServer(app).listen(port); // Listen on port 3000, IP defaults to 127.0.0.1
log('Server running at http://127.0.0.1:' + port + '/');

function populateList() {
	localList.then(
		function(data) {
			exclusionList = data.toString().split('\n');
			for (i in exclusionList) {
				exclusionList[i] = exclusionList[i].trim(); //in case of \r\n or other shenanigans
				}
			},
		(error) => callbackFailure);
}

function checkInput(year, month, sampling) {
	if (year % 1 > 0 || month % 1 > 0 || sampling % 1 > 0) {
		throw new Error("Invalid input: not a whole number");
	}
	if (year < 2009 || year > 2019) {
		throw new Error("Invalid input: year not within bounds");
	}
	if (month < 1 || month > 12) {
		throw new Error("Invalid input: month not within bounds");
	}
	if (sampling < 1 || sampling > 100) {
		throw new Error("Invalid input: # of articles not within bounds");
	}
}

async function chartHTML(year, month, sampling, excl) {
	try {
		checkInput(year, month, sampling);
	
		console.log('function called');
		var childProcess = spawn('node', ['nytArchiveGET.js', year, month, sampling]);
		resetTable();
		var insertOrUpdateRow = await (insertOrUpdateRowPromise);
		var $ = cheerio.load(htmldata);
		console.log('ready to receive data');
	}
	catch(error) {
		callbackFailure(error);
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
		words.forEach(function(word) { // create word:#ofOccurrences set
			if (excl) { //exclude common words option
				if (!exclusionList.includes(word)) {
					wordcount[word] = (wordcount[word] || 0) + 1 
					}
			} else {
					wordcount[word] = (wordcount[word] || 0) + 1 
				}
			});
		let params = Object.entries(wordcount);
		insertOrUpdateRow(params);
	});
	var exitPromise = new Promise( (resolve, reject) => {
		childProcess.once('exit', () => {
			console.log('end called');
			log('END called');
//			connection.query('SELECT COUNT(*) FROM word_count', (error, result) => {
//				if (error) {
//					callbackFailure(error)
//				} else {
//					console.log('result:');
//					console.log(result[0]['COUNT(*)']);
//				}
//			});
			connection.query('SELECT * FROM word_count ORDER BY count DESC LIMIT 25', (error, result) => {
				if (error) {
					callbackFailure(error);
				} else {
					let rows = {};
					result.forEach(function(row) { rows[row.word] = row.count; });
					if (rows.length == 0) {
						reject('Article had no body.'); //Some articles are images with captions and no body.
					}
					let words = Object.keys(rows);
					let counts = Object.values(rows);
					console.log('all data organized');
					
					$('#occurrence').attr('data-words', JSON.stringify(words));
					$('#occurrence').attr('data-counts', JSON.stringify(counts));
					$("#occurrence").css('display', 'block');
					
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
