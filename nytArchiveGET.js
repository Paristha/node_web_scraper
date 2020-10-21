const axios = require('axios'),
	cheerio = require('cheerio'),
	fs = require('fs');

const log = function(entry) {
		fs.appendFileSync('tmp/nytArchiveGET.log', new Date().toISOString() + ' - ' + entry + '\n');
};

const nytURL = new URL('https://api.nytimes.com/svc/archive/v1');
var year = '/' + process.argv[2];
var month = '/' + process.argv[3];
var filetype = '.json'
nytURL.pathname += year + month + filetype;

var param1 = 'api-key';
var param1value = 'M9ttHPRA6h5DX7shqsF12L3AOyzvqvtN';
nytURL.searchParams.append(param1, param1value);
log('archive api request: ' + nytURL.href);

var sampling = parseInt(process.argv[4]);
if (isNaN(sampling)) { sampling = 0; }
var numArticlesRec = 0;

axios
.get(nytURL.href)
.then((response) => {
	log('archive data received');
	getArchiveArticles(response.data.response.docs, process.stdout, sampling)
	.then(function(success) {
				process.stdout.end('');
				log('articles received: ' + numArticlesRec);
				log('END called, success');
				},
			function(failure) {
				log(failure);
				process.stdout.end('');
				log('END called, failure');
				});
}).catch((error) => {
	log(error);
	process.stdout.end('');
	log('END called, failure');
});



function getArchiveArticles(docs, writer, numArticlesReq) {

	var randomChoices = getRandomChoices(docs, numArticlesReq);
	var promiseArray = [];
	var articlesPromise = new Promise( (resolve, reject) => {
		for (i in randomChoices) {
			let index = i;
			log('chosen URL: ' + randomChoices[index].web_url);
			promiseArray[index] = getArticleBody(randomChoices[index].web_url)
			.then( (articleBody) => {
				log('received data from: ' + randomChoices[index].web_url);
				log(articleBody);
				log('END of data from: ' + randomChoices[index].web_url);
				numArticlesRec++;
				if (!writer.write(articleBody)) {
					writer.once('drain', () => {});
				}
				if (index == (promiseArray.length-1)) {
					log('resolving Promise');
					resolve(true);
				}
			})
			.catch((error) => {
				log(error);
				reject(error);
			});
		}
	});
	log('exiting function getArchiveArticles');
	return articlesPromise;
}

function waitUntilEqual(var1, var2) {
	if(var1 === var2){
		log('waiting');
		return true;
	}
	setTimeout(waitUntilEqual, 250);
}

function getRandomChoices(array, numberOfChoices) {
	var choices = [];
	for (i = 0; i < numberOfChoices; i++) {
		let randomIndex = Math.floor(Math.random() * array.length);
		choices[i] = array[randomIndex];
	}
	return choices;
}

function getArticleBody(articleURL) {
	log('attempting to get article from ' + articleURL);
	return axios.get(articleURL).then( (response) => {
		log('data received from ' + articleURL);
		const $ = cheerio.load(response.data);
		var articleBody = '';
		$('[name=articleBody] p').each(function(i, elm) {
			articleBody += $(this).text() + ' '; // Article text is split between <p> elements, this adds them together
		});
		articleBody = articleBody
			.replace(/(([^\w\s]|_)*)(\s+)(([^\w\s]|_)*)/g, " ") //strips punctuation
			.replace(/\s+/g, " ") //multiple whitespaces => one space
			.trim().toLowerCase();
		log('ready to return article body from ' + articleURL);
		return articleBody;
	});
}


