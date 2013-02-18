if(!window.ctwitter || !window.ctwitter.JSONPPoller || !window.ctwitter.EventEmitter) {
    throw new Error('ctwitter requires JSONPPoller and EventEmitter');
}
(function(package) {
    //EventEmitter && JSONPPoller should already be in package
    var EventEmitter = package.EventEmitter
    , JSONPPoller = package.JSONPPoller;

    function CTwitter() {
	/**
	 * stream
	 * should accept mode, options and callback
	 * options argument is, of course, optional
	 * deliver data to the client one tweet at a time
	 * throws error on
	 *   --mode not a string
	 *   --callback not a function
	 *   --no callback
	 *   --no mode
	 */
	this.stream = function (mode, options, callback) {
            var twitterPoller = new JSONPPoller()
	    , timeout = 25
            , stream = new EventEmitter()
            , buffer = []
            , bufferTimeout
	    , lastID
	    , query = ''
	    , newOptions = []
	    , isStreaming = false
            , deliverData = function (stream) {
		isStreaming = true;
		stream.emit('data',buffer.shift());
		if (buffer.length > 0) {
		    lastID = buffer[0].id_str;
                    bufferTimeout = setTimeout(function () {
			deliverData(stream);
                    }, 750);
		} else {
		    isStreaming = false;
		}
            };
	    
            if (arguments.length === 2) {
		callback = arguments[1];
		options = null;
            }
        
            if (typeof (mode) !== 'string') {
		throw new Error('stream requires mode and it must be a string');
            } else if (typeof (callback) !== 'function') {
		throw new Error('stream requires callback and it must be a function');
            } else if (options !== null && typeof (options) !== 'object') {
		throw new Error('stream requires options parameter to be an object');
            }

            stream.emits(['data', 'error', 'destroy']);
            stream.destroy = function () { stream.emit('destroy'); };
            stream.on('destroy', function () {
		twitterPoller.stop();
		clearTimeout(bufferTimeout);
		isStreaming = false;
            });

            //process modes and options
	    if (mode === 'statuses/filter') {
		//process options for filter
		if (!options.track && !options.location) {
		    throw new Error('statuses/filter mode requires a location or track option');
		} else if (options.track && !(options.track instanceof Array) && typeof(options.track) !== 'string') {
		    throw new Error('statuses/filter track option should be a string or an array of strings');
		} else if(options.track) {
		    //build query part of url
		    if (options.track instanceof Array) {
			newOptions = [];
			options.track.forEach(function (elt, i) {
			    newOptions[i] = escape(elt);
			});
			query += 'q='+newOptions.join('+OR+');
		    } else {
			options.track = escape(options.track);
			query += 'q='+escape(options.track);
		    }
		}
		//process location
		if (options.location) {
		    if (query !== '') {
			query += '&geocode='+options.location;
		    } else {
			query += 'geocode='+options.location;
		    }
		}
		if (options.lang) {
		    query += '&lang='+options.lang;
		}
		//add entities
		query += '&include_entities=true';
	    } else {
		throw new Error("current supported modes: 'statuses/filter'");
	    }


        
            twitterPoller.url('http://search.twitter.com/search.json?rpp=100&'+query+'&result_Type=recent&callback=*')
		.timeout(timeout)
		.process(function (data) {
		    var nextUrl
		    , result = {};
		    
		    if(data.results.length > 0) {
			result.update = true;
		    } else {
			result.update = false;
		    }
		    result.data = data;
		
		    //TODO: check frequency of data to set up bufferTimeout and next polling timeout??
		    
		    //update poller and timeout for next request
		    nextUrl = 'http://search.twitter.com/search.json?rpp=100&result_type=recent' + data.refresh_url + '&callback=*';
		    twitterPoller.url(nextUrl).timeout(timeout);
		    return result;
		})
		.on('data', function (data) {
		    var i;
		    //set up buffer to deliver data
		    for (i = data.results.length - 1; i > 0; i = i - 1) {
			buffer.push(data.results[i]);
		    }

		    //deliver data if it's not already being delivered
		    if (!isStreaming && buffer.length > 0) {
			deliverData(stream);
		    }
		})


            //set up the poller as specified by the client
            callback(stream);
	    
            //start the poller
            twitterPoller.start();
	};
    }

    if(window['Processing']) {
	Processing.prototype.onTweet = function(tweet) {
	    //no by op
	};

	Processing.prototype.twitterStream = function(strings) {
	    var that = this;
	    var ct = new CTwitter();
	    ct.stream('statuses/filter', { track:strings }, function(stream) {
		stream.on('data', function(data) {
		    that.onTweet(data);
		});

		ct.destroy = stream.destroy;
	    });

	    return ct;
	}
    }

    package.CTwitter = CTwitter;
})(window.ctwitter);