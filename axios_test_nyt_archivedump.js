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
		var words = new pos.Lexer().lex(articleBody);
		var tagger = new pos.Tagger();
		words = words.filter(function (word) {
			word = word.replace(/[^\w\s]|_/g, "").replace(/\s+/g, "");
			return word != "";
		});
		var taggedWords = tagger.tag(words);
		var taggedArticleBody = '';
		for (i in taggedWords) {
		    var taggedWord = taggedWords[i];
		    var word = taggedWord[0];
		    var tag = taggedWord[1];
		    taggedArticleBody += word + " /" + tag + ' ';
		}
		fs.writeFile('tagdump.txt', taggedArticleBody, function (err) {
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


