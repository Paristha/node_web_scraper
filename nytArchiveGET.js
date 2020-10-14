const axios = require('axios'),
	cheerio = require('cheerio');

const nytURL = new URL('https://api.nytimes.com/svc/archive/v1');
var year = '/' + process.argv[2];
var month = '/' + process.argv[3];
var filetype = '.json'
nytURL.pathname += year + month + filetype;

var param1 = 'api-key';
var param1value = 'CN5KournpYeSByjSG5A3OYrm4RGrPGjs';
nytURL.searchParams.append(param1, param1value);

axios
.get(nytURL.href)
.then((response) => {
	getArchiveArticleURLs(response.data.responce.docs, process.stdout);
	process.stdout.end('');
}).catch((error) => callbackFailure);

function getArchiveArticleURLs(docs, writer) {
	for (i in docs) {
		getArticleBody(docs[i].web_url).then( articleBody => {
			if (!writer.write(articleBody)) {
				stream.once('drain', () => {});
			}
		});
	}
}

async function getArticleBody(URL) {
	axios.get(URL).then( (response) => {
		const $ = cheerio.load(response.data);
		var articleBody = '';
		$('[name=articleBody] p').each(function(i, elm) {
			articleBody += $(this).text() + ' '; // Article text is split between <p> elements, this adds them together
		});
		articleBody = articleBody.replace(/(([^\w\s]|_)*)(\s+)(([^\w\s]|_)*)/g, " ").replace(/\s+/g, " ").trim(); //strips punctuation
		return articleBody
	}).catch((error) => callbackFailure);
}

function callbackFailure(error) {
	process.stderr.write(error);
}


