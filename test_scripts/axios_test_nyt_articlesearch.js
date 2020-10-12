/**
 * http://usejsdoc.org/
 */

const axios = require('axios')
const querystring = require('querystring');

var nytASURL = "https://api.nytimes.com/svc/search/v2/articlesearch.json";

var searchURL = nytASURL + '?' + querystring.stringify({
	'api-key': "CN5KournpYeSByjSG5A3OYrm4RGrPGjs",
	'q': "CAS9",
	'fq': "news_desk:(\"Science\")"
});

axios
	.get(searchURL)
	.then((response) => {
		console.log(response.data.response)
	})
	.catch((error) => {
		console.error(error)
	});