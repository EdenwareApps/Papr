

var async = require('async')

function moveFile(from, to, callback){
    if(from == to){
        callback(to)
    } else {
        copyFile(from, to, function (err){
            if (err){
                fs.unlink(to);
                if(callback){
                    callback(from)
                }
            } else {
                fs.unlink(from, function (){
                    if(callback){
                        callback(to)
                    }
                })
            }
        })
    }
}

function checkPermission(file, mask, cb){ // https://stackoverflow.com/questions/11775884/nodejs-file-permissions
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

function time(){
	return ((new Date()).getTime()/1000);
}


function isWritable(path, cb){
	checkPermission(path, 2, cb);
}

function filesize(filename) {
	const stats = fs.statSync(filename);
	const fileSizeInBytes = stats.size;
	return fileSizeInBytes;
}

function copyFile(source, target, cb) {
	var cbCalled = false;
	var targetDir = path.dirname(target);
	fs.mkdir(targetDir, () => {});
	var done = function (err) {
		if (!cbCalled && typeof(cb)=='function') {
			if(typeof(err)=='undefined'){
				err = false;
			}
			cb(err);
			cbCalled = true;
		}
	}
	var rd = fs.createReadStream(source)
	rd.on("error", function(err) {
		done(err)
	})
	var wr = fs.createWriteStream(target)
	wr.on("error", function(err) {
		done(err)
	})
	wr.on("close", function(ex) {
		done()
	})
	rd.pipe(wr)
}

function getExt(url){
    return String(url).split('?')[0].split('#')[0].split('.').pop().toLowerCase() 
}

function imageBufferToBase64(content, extOrName, cb){    
    var type = '', ext = (getExt(extOrName) || extOrName);
    switch(ext){
        case 'png':
            type = 'image/png';
            break;
        case 'jpg':
        case 'jpeg':
            type = 'image/jpeg';
            break;
        case 'mp4':
            type = 'video/mp4';
            break;
        case 'webm':
            type = 'video/webm';
            break;
    }
    if(type){
        cb(null, 'data:'+type+';base64,'+content.toString('base64'))
    } else {
        var fragment = String(content).substr(0, 256);
        cb('Invalid format.', console.warn(fragment))
    }
}

function removeFolder(location, itself, next) {
    location = path.resolve(location)
    console.log(itself?'REMOVING':'CLEANING', location);
    if (!next) next = jQuery.noop;
    fs.readdir(location, function(err, files) {
        async.each(files, function(file, cb) {
            file = location + '/' + file;
            fs.stat(file, function(err, stat) {
                if (err) {
                    return cb(err);
                }
                if (stat.isDirectory()) {
                    removeFolder(file, true, cb);
                }
                else {
                    fs.unlink(file, function(err) {
                        if (err) {
                            return cb(err);
                        }
                        return cb();
                    })
                }
            })
        }, function(err) {
            if(itself && !err){
                fs.rmdir(location, function(err) {
                    return next(err)
                })
            } else {
                return next(err)
            }
        })
    })
}

$.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();
  
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
  
    return elementBottom > viewportTop && elementTop < viewportBottom;
};