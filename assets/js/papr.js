process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

var request = require('request'), cheerio = require('cheerio')
var baseURL = 'http://images.google.com/search?tbm=isch&q=';
var userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
var defaultReqOpts = {	
	rejectUnauthorized: false,
	strictSSL: false,
    headers: {
		'User-Agent': userAgent
    }
}

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
  var reqOpts = Object.assign(defaultReqOpts, {url})

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

function stylize(cssCode){
	console.log('css', cssCode);
	var s = document.getElementById("stylize");
	if(!s){
		s = document.createElement("style");
		s.type = "text/css";
		s.id = "stylize";
	}
	if(s.styleSheet){
		s.styleSheet.cssText = cssCode;
	} else {
		s.appendChild(document.createTextNode(cssCode));
	}
	document.getElementsByTagName("head")[0].appendChild(s)
}

function doResize(){
	var margin = 20, ratio = screen.width / screen.height, previewWidth = 200, previewHeight = parseInt(previewWidth / ratio), bw = jQuery('body').width(), count = parseInt(bw / (previewWidth + margin)), containerWidth = (count * (previewWidth + margin));
	stylize('.item, .item img { width: '+previewWidth+'px; height: '+previewHeight+'px; } .item-wrap { width: '+(previewWidth + margin)+'px; } .item-options { width: '+previewWidth+'px; } .results section { width: '+containerWidth+'px; } ');
	console.log(parseInt(bw / (previewWidth + margin))+' per line')
}

function home(){
	jQuery('header, body').addClass('initial');
	jQuery('.results section').html('')
}

function setLoading(is){
	if(is){
		jQuery('.qf-go-icon').hide();
		jQuery('.qf-load-icon').show()
	} else {
		jQuery('.qf-load-icon').hide();
		jQuery('.qf-go-icon').show()
	}
}

function setItemState(element, state){
	console.warn('itemstate', state, element, traceback())
	switch(state){
		case 'normal':
			element.find('.item-error,.item-apply,.item-loading,.item-loading-fill').hide();
			element.find('img').css('opacity', 1);
			break;
		case 'working':
			element.find('.item-loading-fill').show();
			element.find('.item-error, .item-apply, .item-loading').hide();
			element.find('img').css('opacity', 0.64);
			break;
		case 'error':
			element.find('.item-error').show();
			element.find('.item-apply, .item-loading, .item-loading-fill').hide();
			element.find('img').css('opacity', 0.64);
			break;
		case 'success':
			element.find('.item-apply').show();
			element.find('.item-error, .item-loading, .item-loading-fill').hide();
			element.find('img').css('opacity', 0.64);
			break;
	}
}

function showResults(error, results) {
	showingFavs = false;
	if (error || !results || !results.length) {
		jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-exclamation-circle"></i>');
		console.error(error)
	} else {
		var html = '<div class="tag-block">';
		results.forEach((result) => {
			if(result.width == screen.width && result.height == screen.height){
				html += '<div class="item-wrap"><a href="javascript:;" class="item result" data-url="'+result.url+'" data-source="'+result.referer+'" title="'+Lang.CLICK_TO_APPLY+'">'+
					'<img src="'+result.thumbnail+'" class="thumb" />'+
					'<i class="fas fa-asterisk fa-spin item-loading item-flag" /></i>'+
					'<i class="fas fa-asterisk fa-spin item-loading-fill item-flag" /></i>'+
					'<i class="fas fa-exclamation-triangle item-error item-flag"></i>'+
					'<i class="fas fa-check-circle item-apply item-flag"></i>'+
				'</a>'+
				'<span class="item-options">'+
					'<a href="javascript:;" class="info" data-url="'+result.referer+'" title="'+Lang.ORIGIN+'"><i class="fas fa-info-circle"></i></a>'+
					'<a href="javascript:;" class="addfav" title="'+Lang.ADD_FAV+'"><i class="fas fa-heart"></i></a>'+
				'</span></div>';
			}
		});
		html += '</div>';
		jQuery('.results section').removeClass('icon-only').html(html);
	}
	setLoading(false)
}

function removeDirIfEmpty(folder){
	fs.readdir(folder, function (err, files){
		if(!files || !files.length){
			fs.rmdir(folder) // we're checkng just to be sure, but rmdir already deletes only if the dir is empty
		}
	})
}

function moveFolder(from, to, _cb) {
	var cb = () => {
		fs.rmdir(from);
		if(typeof(_cb)=='function'){
			_cb()
		}
	}
	fs.mkdir(to, () => {
		fs.readdir(from, (err, files) => {
			if(files && files.length){
				var iterator = 0, tasks = Array(files.length).fill((callback) => {
					var file = files[iterator];
					iterator++;
					var nfile = file;
					while(fs.existsSync(to+'/'+nfile)){
						nfile = '_'+nfile;
					}
					fs.rename(from+'/'+file, to+'/'+nfile, () => {
						callback()
					})
				});
				if(typeof(async) == 'undefined'){
					async = require('async')
				}
				async.parallelLimit(tasks, 1, (err, results) => {
					cb()
				})
			} else {
				cb()
			}
		})
	})
}

function getTags(cb){
	var folder = 'wallpapers/favs';
	fs.readdir(folder, (err, files) => {
		if(!files){
			files = []
		}
		cb(files)
	})
}

var showingFavs = false;
function showFavs(selFocus, noLoader) {
	showingFavs = true;
	jQuery('header, body').removeClass('initial');
	if(!noLoader){
		jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-asterisk fa-spin"></i>')
	}
	var folder = 'wallpapers/favs';
	getTags((files) => {
		if(files.length){
			var html = '', iterator = 0, tasks = Array(files.length).fill((callback) => {
				if(showingFavs){
					var subFolder = folder + '/' + files[iterator];
					iterator++;
					console.log('SCAN', subFolder);
					if(fs.lstatSync(subFolder).isDirectory()){
						return fs.readdir(subFolder, (err, _files) => {
							console.log(_files);
							if(_files && _files.length){
								let tag = path.basename(subFolder);
								html += '<div class="tag-block" data-tag="'+tag+'"><div class="tag-block-header"><i class="fas fa-folder-open" title="'+Lang.OPEN_FOLDER+'" onclick="nw.Shell.showItemInFolder(path.resolve(\''+path.resolve(subFolder).replace(new RegExp('\\\\', 'g'), '/')+'\'))"></i><i class="fas fa-tag"></i> <span class="tag-block-title" title="'+Lang.RENAME_GROUP+'" data-tag="'+tag+'">' + tag + '</span></div>';
								_files.forEach((file) => {
									html += '<div class="item-wrap" data-source="'+subFolder+'/'+file+'"><a href="javascript:;" class="item fav" data-source="'+subFolder+'/'+file+'">'+
											'<img src="'+subFolder+'/'+file+'" class="thumb" />'+
											'<i class="fas fa-exclamation-triangle item-flag item-error"></i>'+
											'<i class="fas fa-check-circle item-flag item-apply"></i>'+
										'</a>'+
										'<span class="item-options">'+
										'<a href="javascript:;" class="retag" data-tag="'+tag+'" title="'+Lang.CHANGE_GROUP+'"><i class="fas fa-tag"></i></a>'+
										'<a href="javascript:;" class="remfav" data-tag="'+tag+'" title="'+Lang.DELETE+'"><i class="fas fa-trash"></i></a>'+
										'</span></div>';
								});
								html += '</div>';
								// console.log(html);
							}
							callback()
						})
					}
				}
				callback()
			})
			async.parallelLimit(tasks, 1, (err, results) => {
				console.log('DONE', tasks.length, html, showingFavs);
				if(showingFavs){
					jQuery('.results > section').removeClass('icon-only').html(html);
					if(selFocus){
						var e = jQuery(selFocus);
						if(e.length){
							window.scrollTo(0, e.offset().top - 48);
						}
					}
				}
			})
		} else {
			jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-exclamation-circle"></i>');
			console.error(err)
		}
	})				
}

function updateFavCount(cb){
	var folder = 'wallpapers/favs';
	getTags((files) => {
		var suggestHTML = '';
		if(files.length){
			var count = 0, iterator = 0, limit = 8, tasks = Array(files.length).fill((callback) => {
				var subFolder = folder + '/' + files[iterator]
				iterator++
				console.log('SCAN', subFolder)
				if(fs.lstatSync(subFolder).isDirectory()){
					return fs.readdir(subFolder, (err, _files) => {
						console.log(_files)
						if(_files && _files.length){
							let tag = path.basename(subFolder)
							if(limit){
								limit--
								suggestHTML += '<a href="javascript:;" onclick="goSearch(\''+tag+'\')"><i class="fas fa-search"></i> '+tag+'</a>';
							}
							count += _files.length
						}
						callback()
					})
				}
				callback()
			});
			if(typeof(async) == 'undefined'){
				async = require('async')
			}
			async.parallelLimit(tasks, 1, (err, results) => {
				console.log('DONE', tasks.length, count);
				jQuery('#option-heart .option-count').html(count);
				jQuery('#suggest > div').html(suggestHTML);
				if(typeof(cb)=='function'){
					cb(count)
				}
			})
		} else {
			jQuery('#option-heart .option-count').html(count);
			if(typeof(cb)=='function'){
				cb(count)
			}
		}
	})
}

function imageBufferToBase64(content, extOrName, cb){    
    var type = '', ext = (getExt(extOrName) || extOrName);
    switch(ext){
        case 'jpg':
            type = 'image/jpeg';
			break;
		default:
			type = 'image/' + ext;
			break;
    }
    if(type){
        cb(null, 'data:'+type+';base64,'+content.toString('base64'))
    } else {
        var fragment = String(content).substr(0, 256);
        cb('Invalid format.', console.warn(fragment))
    }
}

function fileToBase64(file, cb){    
    fs.exists(file, (exists) => {
        if(exists) {
            fs.readFile(file, (err, content) => {
                if(err) {
                    cb('Failed to read file', '')
                } else {
                    imageBufferToBase64(content, file, cb)
                }
            })
        } else {
            cb('Failed to read file', '')
        }
    })
}

var imageChecking = null;
function checkImage(file, success, error){
	fileToBase64(file, (err, b64) => {
		if(!imageChecking){
			imageChecking = document.createElement('img')
			document.body.appendChild(imageChecking)
			imageChecking.className = 'check-image'
		}
		imageChecking.onload = success
		imageChecking.onerror = error
		// console.warn('check', file, b64, err)
		if(!err && b64){
			imageChecking.src = b64
		} else {
			imageChecking.src = file
		}
	})
}

function getTempFilename(url){
	var filename = path.basename(url).split('?')[0].split('#')[0];
	var ext = path.extname(filename);
	if(!ext || ext.length > 5){
		filename += (ext = '.jpg')					
	}
	return 'wallpapers/download/'+filename;
}

function download(uri, path, referer, onProgress, onResponse, onError, onEnd) {
	let opts = Object.assign(defaultReqOpts, {url: uri, throttle: 20, headers: { 'Referer': referer, 'User-Agent': userAgent}})
	progress(request(opts))     				
		.on('progress', onProgress)
		.on('response', onResponse)
		.on('error', onError)
		.on('end', onEnd)
		.pipe(fs.createWriteStream(path))
}

function goSearch(kw){
	jQuery('#q').val(kw);
	jQuery('#qf').trigger('submit')
}

function doSearch(kw){
	jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-asterisk fa-spin"></i>');
	gis(kw+' '+screen.width+'x'+screen.height, showResults)
}

function validateImage(file, _cb){
	let cb = (e, d) => {
		if(typeof(_cb) == 'function'){
			_cb(e, d)
			_cb = null
		}
	}
    fileToBase64(file, (err, b64) => {
        if(err){
            cb(err)
        } else {
            const image = new Image(), err = () => {
                cb('Invalid image.')
            }
            image.onload = () => {
				image.onload = null
                if(image.width){
                    cb(null, file)
                } else {
                    err()
                }
                image.src = null
            }
            image.onerror = err
            image.src = b64
        }
    })
}

function downloadWallpaper(src, referer, item, progress, callback){
	console.warn(src)
	var f = getTempFilename(src)
	download(src, f, referer, (p) => {
		progress(p)
	}, (p) => {
		console.log('response', p)
	}, (e) => {
		console.log('error', e);
		callback(e)
	}, (p) => {
		console.log('end', p, f)
		validateImage(f, (err) => {
			console.log('vimage', err)
			if(err){
				callback(err)
			} else {
				callback(null, f)
			}
		})
	})
}

function setWallpaper(file){
	wallpaper.set(file)
	updateBackground()
}

function updateBackgroundFile(file){
	if(file){
		document.querySelector('div#sublayer-back').style.background = 'transparent url("file:///'+file.replace(new RegExp('\\\\', 'g'), '/')+'?'+(new Date()).getTime()+'")'
	} else {
		document.querySelector('div#sublayer-back').style.background = '#ddeeff'
	}
}

function updateBackground(file){
	if(typeof(file) == 'string'){
		updateBackgroundFile(file)
	} else {
		wallpaper.get().then(updateBackgroundFile)
	}
}

const resolutions = [
	[720, 480],
	[1152, 768],
	[1280, 854],
	[1440, 960],
	[2880, 1920],
	[320, 240],
	[640, 480],
	[800, 600],
	[1024, 768],
	[1152, 864],
	[1280, 960],
	[1400, 1050],
	[1600, 1200],
	[2048, 1536],
	[3200, 2400],
	[4000, 3000],
	[6400, 4800],
	[800, 480],
	[1280, 768],
	[1280, 1024],
	[2560, 2048],
	[5120, 4096],
	[852, 480],
	[1280, 720],
	[1365, 768],
	[1600, 900],
	[1920, 1080],
	[320, 200],
	[640, 400],
	[1280, 800],
	[1440, 900],
	[1680, 1050],
	[1920, 1200],
	[2560, 1600],
	[3840, 2400],
	[7680, 4800],
	[2048, 1080]
]

function similarResolutions(w, h){
	let r = w / h, s = w + h
	return resolutions.filter(u => {
		return ((u[0] / u[1]) == r && (u[0] + u[1]) >= s)
	})
}

jQuery(document).ready(() => {
	jQuery.ajax({
		type: "GET",
		url: 'http://papr.ml/pad.xml',
		dataType: "xml",
		success: (xml) => {
			let v = xml.getElementsByTagName('Program_Version')
			if(v.length){
				let installedVersion, currentVersion = v[0].textContent
				jQuery.get('package.json', (data) => {
					if(typeof(data)=='string'){
						data = data.replace(new RegExp('/\\* .+ \\*/', 'gm'), '');
						data = JSON.parse(data.replace(new RegExp("\\\n", "g"), ""))
					}
					if(data && data.version){
						installedVersion = data.version
						if(installedVersion < currentVersion){
							let url = 'http://papr.ml/?version='+installedVersion
							if(confirm(Lang.NEW_VERSION_AVAILABLE)){
								nw.Shell.openExternal(url)
							} else {
								win.on('close', () => {
									nw.Shell.openExternal(url)									
									win.close(true)
								})
							}
						}
					}
				})
			}
		}
	})
})
	