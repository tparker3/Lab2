if(!window.ctwitter || !window.ctwitter.EventEmitter) {
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
})(window.ctwitter);