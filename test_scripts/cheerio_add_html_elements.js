/**
 * http://usejsdoc.org/
 */
const cheerio = require('cheerio'),
	fs = require('fs').promises;

fs.readFile('index.html')
.then(modifyHTML, failureCallback)
.then(createOutputHTML, failureCallback);

async function modifyHTML(data) {
	try {
		var $ = cheerio.load(data);
		$('.textColumn').append('<p>This is podracing!</p>');
		return $;
	} catch (error) {
		return error;
	}
}

function createOutputHTML($) {
	try {
	fs.writeFile('outputIndex.html', $.root().html());
	} catch (error) {
		failureCallback(error);
	}
}

function failureCallback(error) {
	console.log(error);
}
// fs.writeFile('outputIndex.html', html, function (err) {
//	if (err) return console.log(err);
//	console.log('success');
//	});


