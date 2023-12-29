process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const wpPath = paths.data.replace(new RegExp('\\\\', 'g'), '/') + '/wallpapers'
const search = require('duckduckgo-images-api')

var defaultDownloadHeaders = {
	'User-Agent': navigator.userAgent
}

function stylize(cssCode){
	console.log('css', cssCode)
	var s = document.getElementById("stylize")
	if(!s){
		s = document.createElement("style")
		s.type = "text/css";
		s.id = "stylize";
	}
	if(s.styleSheet){
		s.styleSheet.cssText = cssCode;
	} else {
		s.appendChild(document.createTextNode(cssCode))
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
	var folder = wpPath + '/favs';
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
	var folder = wpPath + '/favs';
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
				console.log('DONE', tasks.length, html, showingFavs)
				if(showingFavs){
					jQuery('.results > section').removeClass('icon-only').html(html)
					if(selFocus){
						var e = jQuery(selFocus)
						if(e.length){
							window.scrollTo(0, e.offset().top - 48)
						}
					}
				}
			})
		} else {
			jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-ellipsis-h"></i>')
		}
	})				
}

function updateFavCount(cb){
	var folder = wpPath + '/favs';
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
                    cb('Failed to read file. #1', '')
                } else {
                    imageBufferToBase64(content, file, cb)
                }
            })
        } else {
            cb('Failed to read file. #2', '')
        }
    })
}

function validateImage(file, _cb){
	console.log('Validating', file, traceback())
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
			if(b64){
				image.src = b64
			} else {
				image.src = file
			}
        }
    })
}

function getTempFilename(url){
	var filename = path.basename(url).split('?')[0].split('#')[0];
	var ext = path.extname(filename);
	if(!ext || ext.length > 5){
		filename += (ext = '.jpg')					
	}
	return wpPath + '/download/'+filename;
}

function download(uri, path, Referer, onProgress, onResponse, onError, onEnd) {
	let opts = {url: uri, throttle: 20}
	opts.headers = Object.assign({Referer}, defaultDownloadHeaders)
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
	jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-asterisk fa-spin"></i>')
	alreadyListedImages = []
	currentKeywords = kw
	hasMorePages = true
	currentPage = 0
	search.image_search({ query: kw+' '+screen.width+'x'+screen.height, moderate: true }).then(ret => showResults(null, ret)).catch(showResults)
}

function showResults(error, results) {
	showingFavs = false;
	if (error || !results || !results.length) {
		jQuery('.results > section').addClass('icon-only').html('<i class="fas fa-exclamation-circle"></i>');
		console.error(error)
	} else {
		var html = '', section = jQuery('.results section').removeClass('icon-only')
		results.forEach(result => {
			if(alreadyListedImages.includes(result.image)) return
			alreadyListedImages.push(result.image)
			if(result.width == screen.width && result.height == screen.height){
				html += '<div class="item-wrap"><a href="javascript:;" class="item result" data-url="'+result.image+'" data-source="'+result.url+'" title="'+Lang.CLICK_TO_APPLY+'">'+
					'<img src="'+result.thumbnail+'" class="thumb" />'+
					'<i class="fas fa-asterisk fa-spin item-loading item-flag" /></i>'+
					'<i class="fas fa-asterisk fa-spin item-loading-fill item-flag" /></i>'+
					'<i class="fas fa-exclamation-triangle item-error item-flag"></i>'+
					'<i class="fas fa-check-circle item-apply item-flag"></i>'+
				'</a>'+
				'<span class="item-options">'+
					'<a href="javascript:;" class="info" data-url="'+result.url+'" title="'+Lang.ORIGIN+'"><i class="fas fa-info-circle"></i></a>'+
					'<a href="javascript:;" class="addfav" title="'+Lang.ADD_FAV+'"><i class="fas fa-heart"></i></a>'+
				'</span></div>';
			}
		});
		
		if(currentPage < 2){
			section.html('<div class="tag-block result-block">' + html + '</div>')
		} else {
			section.find('.result-block').append(html)
		}
	}
	setLoading(false)
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

function checkFilePermission(file, mask, cb){ // https://stackoverflow.com/questions/11775884/nodejs-file-permissions
    fs.stat(file, function (error, stats){
        if (error){
            cb (error, false);
        } else {
            var v = false;
            try {
                v = !!(mask & parseInt ((stats.mode & parseInt ("777", 8)).toString (8)[0]));
            } catch(e) {
                console.error(e)
            }
            cb (null, v)
        }
    })
}

function isDir(path){
    var isFolder = false;
    try{
        isFolder = fs.lstatSync(path).isDirectory()
    } catch(e) {
        isFolder = false;
    }
    return isFolder;
}

function isWritable(_path, cb){
    var isFolder = isDir(_path);
    if(isFolder){
        var testFile = _path + path.sep + 'test.tmp';
        fs.writeFile(testFile, '1', (err) => {
            if (err){
                cb(null, false)
            } else {
                cb(null, true)
            }
            fs.unlink(testFile, jQuery.noop)
        })
    } else {
        checkFilePermission(_path, 2, cb)
    }
}

function notify(txt, cb){
	var options = {
		icon: "default_icon.png",
		body: txt
	}
	var notification = new Notification(nw.App.manifest.window.title, options)
	notification.onclick = () => {
		if(typeof(cb) == 'function'){
			cb()
		}
	}
	//document.getElementById("sound-magic").play()
	notification.onshow = () => {
		document.getElementById("sound-magic").play()
	}
	setTimeout(() => {
		notification.close()
	}, 3500)
  }

function saveFileDialog(file, callback){
    var _callback = (file) => {
        isWritable(path.dirname(file), (err, writable) => {
            if(writable){
                callback(file)
            } else {
                alert(Lang.FOLDER_NOT_WRITABLE)
                saveFileDialog(file, callback)
            }
        })
    }
    if(!file) file = '';
    jQuery('<input id="saveas" type="file" nwsaveas />').
        prop('nwsaveas', path.basename(file)).
        prop('nwworkingdir', path.dirname(file)).
        one('change', function (){
            var chosenFile = this.value
            if(!chosenFile){
                chosenFile = file
            }
            _callback(chosenFile)
        }).
        trigger('click')
} 

var openFileDialogChooser = false
function openFileDialog(callback, accepts) {
    if(!openFileDialogChooser){ // JIT
        openFileDialogChooser = jQuery('<input type="file" />');
    }
    openFileDialogChooser.get(0).value = "";
    if(accepts){
        openFileDialogChooser.attr("accept", accepts)
    } else {
        openFileDialogChooser.removeAttr("accept")
    }
    openFileDialogChooser.off('change')
    openFileDialogChooser.on('change', function(evt) {
        callback(openFileDialogChooser.val())
    });    
    openFileDialogChooser.trigger('click')  
    return openFileDialogChooser
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

[
	wpPath,
	wpPath + '/download',
	wpPath + '/favs'
].forEach(d => {
	fs.mkdir(d, {recursive: true}, () => {})
})

jQuery(window).on('close', () => {
	let location = dataPath + '/cache'
    fs.readdirSync(location, (err, files) => {
        files.forEach(file => {
            file = location + '/' + file
			let stat = fs.statSync(file)
			if (!stat.isDirectory()) {
                fs.unlinkSync(file)
            }
        })
    })
})

jQuery(document).ready(() => {
	jQuery.ajax({
		type: "GET",
		url: 'http://edenware.app/papr/pad.xml',
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
							let url = 'http://edenware.app/papr/?version='+installedVersion
							if(confirm(Lang.NEW_VERSION_AVAILABLE)){
								nw.Shell.openExternal(url)
							} else {
								jQuery(window).on('close', () => {
									nw.Shell.openExternal(url)									
								})
							}
						}
					}
				})
			}
		}
	})
})
	
win.on('close', () => {
	jQuery(window).trigger('close')								
	win.close(true)
})