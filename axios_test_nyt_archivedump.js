/**
 * http://usejsdoc.org/
 */
const axios = require('axios')
const fs = require('fs');
const cheerio = require('cheerio');
const pos = require('pos');

const nytURL = new URL('https://api.nytimes.com/svc/archive/v1');
var year = '/2019';
var month = '/12';
var filetype = '.json'
nytURL.pathname += year + month + filetype;

var param1 = 'api-key';
var param1value = 'CN5KournpYeSByjSG5A3OYrm4RGrPGjs';
nytURL.searchParams.append(param1, param1value);

var articleURL;

axios
.get(nytURL.href)
.then((response) => {
	//console.log(JSON.stringify(response.data.response.docs));
	//fs.writeFile('archivedump.json', JSON.stringify(response.data.response.docs[1]), function (err) {
	//	  if (err) return console.log(err);
	//	  console.log('success');
	//	});
	articleURL = new URL(response.data.response.docs[2].web_url);
	console.log(response.data.response.docs[2].web_url);
	console.log(response.data.response.docs[2].word_count);
	axios.get(articleURL.href)
	.then((response) => {
		//console.log(response)
		const $ = cheerio.load(response.data);
		//console.log($('[name=articleBody]').text());
		var articleBody = '';
		$('[name=articleBody] p').each(function(i, elm) {
		    articleBody += $(this).text() + ' ';// for testing do text() 
		    console.log('here');
		});
		articleBody = articleBody.replace(/(([^\w\s]|_)*)(\s+)(([^\w\s]|_)*)/g, " ").replace(/\s+/g, " ");
//		var words = articleBody.split(' ');
		fs.writeFile('worddump.txt', articleBody, function (err) {
			if (err) return console.log(err);
			console.log('success');
		});
	})
	.catch((error) => {
		console.error(error)
	});
})
.catch((error) => {
	console.error(error)
});


