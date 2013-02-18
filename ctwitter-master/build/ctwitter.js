if(!window.ctwitter) window.ctwitter = { };
(function(package) {
    function EventEmitter() {
	var listeners, emits;
	listeners = {};
	emits = [];
	
	//specifies the events that the emitter emits
	//or returns an array of events that the emitter emits
	this.emits = function(events) {
	    var i;
	    
	    if(events !== undefined) {
		if(!(events instanceof Array)) {
		    throw new Error('the argument to emits must be an array of events');
		} else {
		    emits = events;
		    for(i = 0; i < events.length; i=i+1) {
			listeners[events[i]] = [];
		    }
		}
	    } else {
		return emits;
	    }
	};

	//registers an event and an observer
	this.on = function(event, listener) {
	    if(typeof(event) !== "string") {
		throw new Error("first argument to 'on' should be a string");
	    }
	    if(typeof(listener) !== "function") {
		throw new Error("second argument to 'on' should be a function");
	    }
	    if(listeners[event] === undefined) {
		throw new Error("'"+event +"' is not emitted by this EventEmitter"); 
	    }
	    listeners[event].push(listener);
	    return this;
	};
    
	//emits an event
	this.emit = function(event, data) {
	    var i;
	    if(listeners[event] !== undefined) {
		for(i = 0; i < listeners[event].length; i=i+1) {
		    listeners[event][i](data);
		}
	    }
	};
    
	//get the listeners for an event
	this.listeners = function(event) {
	    if(typeof(event) !== 'string') {
		throw new Error('listeners method must be called with the name of an event');
	    } else if(listeners[event] === undefined) {
		throw new Error("event '" + event + "' has not yet been registered");
	    }
	    return listeners[event];
	};
    }//end EventEmitter

    package.EventEmitter = EventEmitter;
})(window.ctwitter);if(!window.ctwitter || !window.ctwitter.EventEmitter) {
    throw new Error('JSONPPoller requires EventEmitter');
}
(function(package) {
    var EventEmitter = package.EventEmitter
    , i
    , packageString;
    //find package name?
    for(i in window) {
	if(window[i] === package) {
	    packageString = i;
	}
    }

    function JSONPPoller() {
	var url
	, count = 0 //number of requests made
	, timer = null //timeout for next request
	, polling = false
	, timeout = 0
	, processor = function(data) { return {update:true, data:data}; } //default process implementation
	, prefix = "__jp_"
	, name
	, callbackName;

	JSONPPoller.instanceCount = JSONPPoller.instanceCount+1;
	name = prefix+JSONPPoller.instanceCount;
	window[packageString]['JSONPPoller'][name] = this;
	callbackName = 'window.'+packageString+'.JSONPPoller.'+name+'.process';
	
	this.emits(['error','data']);
    
	/**
	 * url setter/getter
	 * accepts a string that sets the URL of the JSONP feed
	 * returns the current URL if called with no parameter
	 * throws an error if:
	 *   --non-string argument
	 *   --called as a getter before the url is set
	 */
	this.url = function(u) {
	    var result = this; //for chaining
	    if(u === undefined && url === undefined) {
		throw new Error('url needs to be set before you call it as a getter');
	    } else if(u === undefined) {
		result = url;
	    } else if(typeof(u) !== 'string') {
		throw new Error('url only accepts a string argument');
	    } else {
		url = u;
	    }
	    return result;
	};
    
	/**
	 * name
	 * returns the global name of this object
	 */
	this.name = function() {
	    return name;
	};

	/**
	 * callbackname
	 * returns the callback name of this object
	 */
	this.callbackName = function() {
	    return callbackName;
	};
    
	/**
	 * start
	 * starts polling
	 * adds a script with the URL to the DOM
	 * replaces callback=* with the actual callback based on the name
	 * removes the previous script tag if it exists
	 * throws error if
	 *   --url has not been specified
	 */
	this.start = function() {
	    var thisPoller = this
	    , head = document.getElementsByTagName('head')[0] //assuming there is only 1 head?
	    , script = document.getElementById(this.name()+'_script_tag_id');
	    try {
		this.url();
	    } catch(e) {
		throw new Error('start requires a url to have been specified');
	    }
	
	    polling = true;
	    count=count+1;
	    
	    if(script) {
		head.removeChild(script);
	    }
	    script = document.createElement('script');
	    script.type = 'text/javascript';
	    script.id = this.name()+'_script_tag_id';
	    //script.src = this.url().replace('=%',"="+this.name()+'.process');
	    script.src = this.url().replace('=*',"="+callbackName);
	    //add random num to fix caching problem
	    if(script.src.match(/\?/)) {
		script.src = script.src+'&random='+Math.floor(Math.random()*10000);
	    } else {
		script.src = script.src+'?random='+Math.floor(Math.random()*10000);
	    }

	    head.appendChild(script);
	};
    
	/**
	 * stop
	 * stops polling
	 * cancels the next call to start
	 * removes script tag from head
	 */
	this.stop = function() {
	    var script = document.getElementById(this.name()+'_script_tag_id')
	    , head;
	    polling = false;
	    if(timer) {
		clearTimeout(timer);
	    }
	    
	    if(script !== null) {
		head = document.getElementsByTagName('head')[0];
		head.removeChild(script);
	    }
	};
    
	//method only used for testing
	//keeps track of the number of times the
	//URL has been polled
	this.count = function() {
	    return count;
	};
    
	/**
	 * process
	 * accepts a function as an argument and sets it to the pre-processor
	 * accepts an object as an argument and processes it, emitting new data
	 *   if it is available
	 * reloads and reprocesses the data after the timeout
	 * throws an error if
	 *   --argument is not a function or an object
	 */
	this.process = function(f) {
	    var processorResult
	    , thisPoller = this
	    , result = thisPoller;
	    if(typeof(f) === 'function') {
		processor = f;
	    } else if (typeof(f) === 'object') {
		//do object stuff
		processorResult = processor(f);
		if(processorResult && processorResult.error) {
		    this.emit('error', processorResult.error);
		} else if(processorResult && processorResult.update) {
		    this.emit('data', processorResult.data);
		}
		
		//set up the next request
		if(this.timeout() > 0) {
		    timer = setTimeout(function() {
			thisPoller.start();
		    }, thisPoller.timeout()*1000);
		}
	    } else {
		throw new Error('process requires the parameter to be an object or a function');
	    }
	    return result;
	};
    
	/**
	 * timeout
	 * the default timeout is set to 0
	 * accepts an integer that represents a timeout and stores it in timeout
	 * returns the timeout when called with no parameters
	 * throws error on:
	 *   --non numeric parameter
	 */
	this.timeout = function(t) {
	    var result = this;
	    if(t === undefined) {
		result = timeout;
	    } else if(typeof(t) !== 'number') {
		throw new Error('timeout requires the parameter to be an integer');
	    } else {
		timeout = t;
		if(timeout === 0 && polling) {
		    this.stop();
		}
	    }
	    return result;
	};
	
	this.isPolling = function() {
	    return polling;
	};
    }
    JSONPPoller.prototype = new EventEmitter();
    JSONPPoller.instanceCount = 0;
    package.JSONPPoller = JSONPPoller;
})(window.ctwitter);if(!window.ctwitter || !window.ctwitter.JSONPPoller || !window.ctwitter.EventEmitter) {
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