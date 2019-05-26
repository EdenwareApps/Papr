var request = require('request'), cheerio = require('cheerio')

var baseURL = 'http://images.google.com/search?tbm=isch&q=';

function gis(opts, done) {
  var searchTerm;
  var queryStringAddition;
  var filterOutDomains;

  if (typeof opts === 'string') {
    searchTerm = opts;
  }
  else {
    searchTerm = opts.searchTerm;
    queryStringAddition = opts.queryStringAddition;
    filterOutDomains = opts.filterOutDomains;
  }

  var url = baseURL + searchTerm;

  if (filterOutDomains) {
    url += encodeURIComponent(' ' + filterOutDomains.map(addSiteExcludePrefix).join(' '));
  }

  if (queryStringAddition) {
    url += queryStringAddition;
  }
  var reqOpts = {
    url: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    }
  };

  // console.log(reqOpts.url);
  request(reqOpts, parseGISResponse);

  function parseGISResponse(error, response, body) {
    if (error) {
      done(error);
    }
    else {
      var $ = cheerio.load(body);
      var metaLinks = $('.rg_meta');
      var gisURLs = [];
      metaLinks.each(collectHref);
      done(error, gisURLs);
    }

    function collectHref(i, element) {
      if (element.children.length > 0 && 'data' in element.children[0]) {
        var metadata = JSON.parse(element.children[0].data);
        if (metadata.ou) {
          //console.log(metadata);
          var result = {
            url: metadata.ou,
            width: metadata.ow,
            height: metadata.oh,
            thumbnail: metadata.tu,
            thumbnail_width: metadata.tw,
            thumbnail_height: metadata.th,
            referer: metadata.ru
          };
          if (domainIsOK(result.url)) {
            gisURLs.push(result);
          }
        }
        // Elements without metadata.ou are subcategory headings in the results page.
      }
    }
  }

  function domainIsOK(url) {
    if (!filterOutDomains) {
      return true;
    }
    else {
      return filterOutDomains.every(skipDomainIsNotInURL);
    }

    function skipDomainIsNotInURL(skipDomain) {
      return url.indexOf(skipDomain) === -1;
    }
  }
}

function addSiteExcludePrefix(s) {
  return '-site:' + s;
}

window.addEventListener('beforeunload', () => {
  console.log('Cleaning temp folder')
  removeFolder('wallpapers/download', false, () => {
    console.log('Temp folder clean')
  })
})
