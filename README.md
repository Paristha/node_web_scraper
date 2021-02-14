<!--
*** Thanks for checking out this README Template. If you have a suggestion that would
*** make this better, please fork the repo and create a pull request or simply open
*** an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** Paristha, node_web_scraper, twitter_handle, tmp2121@caa.columbia.edu
-->





<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<p align="center">

  <h3 align="center">New York Times Word-Occurrence Grapher</h3>

  <p align="center">
    This project aims to use the <a href="https://developer.nytimes.com/">NYT Developer's APIs</a> to gather word-occurrence data from past years and graph it to demonstrate <a href="https://en.wikipedia.org/wiki/Zipf%27s_law">Zipf's Law</a>
    <br />
    <a href="https://github.com/Paristha/node_web_scraper"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/Paristha/node_web_scraper">View Demo</a>
    ·
    <a href="https://github.com/Paristha/node_web_scraper/issues">Report Bug</a>
    ·
    <a href="https://github.com/Paristha/node_web_scraper/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)
<!-- * [Acknowledgements](#acknowledgements) -->



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://tinyurl.com/timeswordgrapher/)


### Built With

* [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/)
* [Nodejs](https://nodejs.org/en/)
* [Axios](https://github.com/axios/axios)
* [Chart.js](https://www.chartjs.org/)
* [Cheerio](https://cheerio.js.org/)
* [csv-parse](https://csv.js.org/parse/)
* [Express](https://expressjs.com/)
* [JQuery](https://jquery.com/)
* [Multer](https://github.com/expressjs/multer)
* [MySQL](https://www.mysql.com/)
* [MySQLjs](https://github.com/mysqljs/mysql)



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
```sh
npm install npm@latest -g
```

### Installation

1. Clone the repo
```sh
git clone https://github.com/Paristha/node_web_scraper.git
```
2. Install NPM packages
```sh
npm install
```



<!-- USAGE EXAMPLES -->
## Usage

The three dropdown lists control the year, month, and sampling in that order from top to bottom.
Years from 2009-2019 are included. The Times changed the layout of their articles at some point before 2009, and articles before 2002 are archived. 2009 was chosen as a cutoff point to ensure reliability.

The sampling offers three options: 10, 50, and 100. When common words are being excluded, 10 does not ensure good results. Originally 1 and 5 were options, however there is a chance an article without words (a slideshow) is picked, so 10 was picked as a minimum for providing a reasonable corpus.

The app functions by making a call to the [New York Times Archive API](https://developer.nytimes.com/docs/archive-product/1/overview) with the chosen month and year. This returns a json with information on every NYT article from that year. A sampling of these is taken using Math.random() to retrieve as many article URLs as requested, which are then visited. The text of the articles is extracted by taking all inner html from elements with the name 'articleBody'. The text is split into word counts and used to update a MySQL database with a column for 'word' (which is a string and the key) and a column for 'word-count' (which is a number). After all articles are visited, the top 50 rows of the database, descending on 'word-count', are extracted and inserted into the html so that they may be used to render the chart when the webpage is loaded.

The [default word exclusion list](https://github.com/Paristha/node_web_scraper/blob/master/exclusion_list.csv) is the most common 150 words as found [here](https://en.wikipedia.org/wiki/Most_common_words_in_English). Custom word exclusion lists should follow the same format.

The Word-Occurrence bar graph uses the words as labels, for the Log-Log scatter plot you can see the word by scrolling over the point. The natural log is used; any log would function the same. The scatter plot should show a downwards linear trend, demonstrating Zipf's Law.

Example graphs (taken from 10-2016, 100 articles sampled, excluding common words):
[![Word Occurrence Graph][wcgraph-screenshot]]
[![Zipf's Law Graph][zlgraph-screenshot]]


N.B.: The example word-exclusion list is not exhaustive. 'Common' words can be seen here still. Future updates may include better common word lists, but the ability to tailor your own to your needs should suffice.

ROADMAP
## Roadmap

-Improved common word list
-Ability to download MySQL db created to store data for graph

Feel free to email me suggestions!

See the [open issues](https://github.com/Paristha/node_web_scraper/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Thana Paris - tmp2121@caa.columbia.edu

Project Link: [https://github.com/Paristha/node_web_scraper](https://github.com/Paristha/node_web_scraper)



<!-- ACKNOWLEDGEMENTS 
## Acknowledgements

* []()
* []()
* []() -->





<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/Paristha/node_web_scraper.svg?style=flat-square
[contributors-url]: https://github.com/Paristha/node_web_scraper/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Paristha/node_web_scraper.svg?style=flat-square
[forks-url]: https://github.com/Paristha/node_web_scraper/network/members
[stars-shield]: https://img.shields.io/github/stars/Paristha/node_web_scraper.svg?style=flat-square
[stars-url]: https://github.com/Paristha/node_web_scraper/stargazers
[issues-shield]: https://img.shields.io/github/issues/Paristha/node_web_scraper.svg?style=flat-square
[issues-url]: https://github.com/Paristha/node_web_scraper/issues
[license-shield]: https://img.shields.io/github/license/Paristha/node_web_scraper.svg?style=flat-square
[license-url]: https://github.com/Paristha/node_web_scraper/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/thanaparis
[product-screenshot]: https://github.com/Paristha/node_web_scraper/blob/master/node_web_scraper.PNG?raw=true
[wcgraph-screenshot]: https://github.com/Paristha/node_web_scraper/blob/master/node_web_scraper_word-occurrence_graph.PNG?raw=true
[zlgraph-screenshot]: https://github.com/Paristha/node_web_scraper/blob/master/node_web_scraper_zipf_graph.PNG?raw=true