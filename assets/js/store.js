var Store = (() => {
	var dir = 'data/', self = {}, cache = {};
	fs.stat(dir, (err, stat) => {
		if(err !== null) {
			fs.mkdir(dir);
		}
	});
	self.resolve = (key) => {
		return dir + self.prepareName(key) + '.json';
	}
	self.prepareName = (key) => {
		key = key.replace(new RegExp('[^A-Za-z0-9\\._-]', 'g'), '');
		return key;
	}
	self.get = (key) => {
		var f = self.resolve(key), _json = null, val = null; 
		if(typeof(cache[key])!='undefined'){
			return cache[key];
		}
		if(fs.existsSync(f)){
			_json = fs.readFileSync(f, "utf8");
			if(Buffer.isBuffer(_json)){ // is buffer
				_json = String(_json);
			}
			if(typeof(_json)=='string' && _json.length){
				try {
					var r = JSON.parse(_json);
					if(r != null && typeof(r)=='object' && (r.expires === null || r.expires >= time())){
						val = r.data;
					} else {
						//console.error('Expired', r.expires+' < '+time())
					}
				} catch(e){
					console.error(e, f)
				}
			} else {
				//console.error('Bad type', typeof(_json))
			}
		} else {
			//console.error('Not found', typeof(_json))
		}
		cache[key] = val;
		return val;
	}
	self.set = (key, val, expiration) => {
		try {
			var f = self.resolve(key);
			if(fs.existsSync(f)){
				fs.truncateSync(f, 0)
			}
			fs.writeFileSync(f, JSON.stringify({data: val, expires: time() + expiration}), "utf8")
		} catch(e){
			console.error(e)
		}
		cache[key] = val;
	}
	return self;
})(); 
       
var Config = (() => {
	var self = {}, file = 'data/configure.json', loaded = false, defaults = {
		"locale": "",
		"favorite-on-apply": true
	}, data = defaults;
	self.load = () => {
		loaded = true;
		if(fs.existsSync(file)){
			var _data = fs.readFileSync(file, "utf8");
			if(_data){
				if(Buffer.isBuffer(_data)){ // is buffer
					_data = String(_data)
				}
				//console.log('DATA', data)
				if(typeof(_data)=='string' && _data.length > 2){
					_data = _data.replaceAll("\n", "");
					//data = stripBOM(data.replace(new RegExp("([\r\n\t]| +)", "g"), "")); // with \n the array returns empty (?!)
					_data = JSON.parse(_data);
					if(typeof(_data)=='object'){
						data = Object.assign(data, _data)
					}
				}
			}
		}
	}
	self.getAll = () => {
		if(!loaded){
			self.load()
		}
		//console.log('GET', key);
		return data;
	}
	self.get = (key) => {
		if(!loaded){
			self.load()
		}
		//console.log('DATAb', JSON.stringify(data))
		//console.log('GET', key, traceback());
		var t = typeof(data[key]);
		if(t == 'undefined'){
			data[key] = defaults[key];
			t = typeof(defaults[key]);
		}
		if(t == 'undefined'){
			return null;
		} else if(t == 'object') {
			if(jQuery.isArray(data[key])){ // avoid referencing
				return data[key].slice(0)
			} else {
				return Object.assign({}, data[key])
			}
		}
		return data[key];
	}
	self.set = (key, val) => {
		if(!loaded){
			self.load()
		}
		//console.log('SSSET', key, val);
		data[key] = val;
		if(fs.existsSync(file)){
			fs.truncateSync(file, 0)
		}
		fs.writeFileSync(file, JSON.stringify(data, null, 4), "utf8")
	}
	return self;
})()