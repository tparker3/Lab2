describe('Event Emitter', function() {
    var e;
    beforeEach(function() {
	e = new EventEmitter();
    });

    it('should implement the Event Emitter interface', function() {
	var i;
	var interface = ['emits', 'on', 'emit', 'listeners'];
	for(i = 0; i < interface.length; i++) {
	    expect(e[interface[i]]).not.toBeUndefined();
	    expect(typeof(e[interface[i]]) === 'function').toBeTruthy();
	}
    });

    describe('emits method', function() {
	it('should accept an array of events that it emits', function() {
	    e.emits(['event1', 'event2', 'event3']);
	});

	it('should return an array of events that it emits', function() {
	    expect(e.emits()).toEqual([]);
	    e.emits(['event1', 'event2', 'event3']);
	    expect(e.emits()).toEqual(['event1', 'event2', 'event3']);
	});

	it('should throw an error if the argument is not undefined and also not an array', function() {
	    var badCall = function() {
		e.emits('event');
	    }
	    expect(badCall).toThrow(new Error('the argument to emits must be an array of events'));
	});
    });

    describe('listeners method', function() {
	beforeEach(function() {
	    e.emits(['event','event1','event2']);
	});

	it('should return the listeners for a given event', function() {
	    var listener1 = function() {
	    };

	    var listener2 = function() {
	    };
	
	    e.on('event', listener1).on('event', listener2);
	    expect(e.listeners('event').length).toBe(2);
	    expect(e.listeners('event')).toEqual([listener1, listener2]);
	});

	it('should throw an error if the method is called without a string', function() {
	    expect(function() { e.listeners() }).toThrow(new Error('listeners method must be called with the name of an event'));
	});
    });

    describe('on method', function() {
	beforeEach(function() {
	    e.emits(['event','event1','event2']);
	});

	it('should register a callback on an event', function() {
	    e.on('event', function() {});
	    expect(e.listeners('event').length).toBe(1);
	});
	
	it('should register multiple callbacks for a single event', function() {
	    e.on('event', function() { console.log("function 1") });
	    e.on('event', function() { console.log("function 2") });
	    expect(e.listeners('event').length).toBe(2);
	});
	
	it('should register callbacks for multiple events', function() {
	    e.on('event1', function() { });
	    e.on('event2', function() { });
	    expect(e.listeners('event1').length).toBe(1);
	    expect(e.listeners('event2').length).toBe(1);
	});

	it('should return an instance of EventEmitter so the call can be chained', function() {
	   expect(e.on('event', function() {}) instanceof EventEmitter).toBeTruthy();
	});

	it('should register callbacks to be registered in a chain', function() {
	    e.on('event1', function() { })
		.on('event2', function() { });
	    expect(e.listeners('event1').length).toBe(1);
	    expect(e.listeners('event2').length).toBe(1);	    
	});

	it('should register multiple callbacks for a single event in a chain', function() {
	    e.on('event', function() { console.log("function 1") })
		.on('event', function() { console.log("function 2") });
	    expect(e.listeners('event').length).toBe(2);
	});

	it('should throw an error if the event is not emitted', function() {
	    var badCall = function() {
		e.on('event3', function() {});
	    };
	    expect(badCall).toThrow(new Error("'event3' is not emitted by this EventEmitter"));
	});

	it('should throw an error if the event is not a string', function() {
	    var badCall = function() {
		e.on(1, function() { });
	    }
	    expect(badCall).toThrow(new Error("first argument to 'on' should be a string"));
	});
	
	it('should throw an error if the listener is not a function', function() {
	    var badCall = function() {
		e.on('event', 1);
	    }
	    expect(badCall).toThrow(new Error("second argument to 'on' should be a function"));
	});
    }); //end description of 'on method'

    describe('emit method', function() {
	var stubA;
	var stubB;
	beforeEach(function() {
	    e.emits(['event1','event2']);
	    stubA = jasmine.createSpy('stubA');
	    stubB = jasmine.createSpy('stubB');
	});

	it('should respond with a correct listener and data when an event is emitted', function() {
	    e.on('event1', stubA);
	    e.emit('event1');
	    expect(stubA).toHaveBeenCalledWith(undefined);
	    e.emit('event1',5);
	    expect(stubA).toHaveBeenCalledWith(5);
	});

	it('should not respond with incorrect listener when an event is emitted', function() {
	    e.on('event1', stubA);
	    e.on('event2', stubB);
	    e.emit('event1');
	    expect(stubA).toHaveBeenCalledWith(undefined);
	    expect(stubB).not.toHaveBeenCalled();
	});

	it('should respond with all listeners when an event is emitted', function() {
	    e.on('event1', stubA);
	    e.on('event1', stubB);
	    e.emit('event1', 5);
	    expect(stubA).toHaveBeenCalledWith(5);
	    expect(stubB).toHaveBeenCalledWith(5);
	});
    }); //end description of 'emit' method
});