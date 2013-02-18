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
})(window.ctwitter);