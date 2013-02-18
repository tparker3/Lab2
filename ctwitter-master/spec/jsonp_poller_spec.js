describe('JSONP Poller', function() {
    var jp;
    beforeEach(function() {
	jp = new JSONPPoller();
    });

    it('should be an instance of EventEmitter', function() {
	expect(jp instanceof EventEmitter).toBe(true);
    });

    it('should respond to data and error', function() {
	expect(jp.emits().indexOf('error') > -1).toBe(true)
	expect(jp.emits().indexOf('data') > -1).toBe(true);
    });


    it('should implement the JSONP Poller interface', function() {
	var i;
	var interface = ['url', 'start', 'stop', 'process', 'timeout', 'isPolling', 'name'];
	for(i = 0; i < interface.length; i++) {
	    expect(jp[interface[i]]).not.toBeUndefined();
	    expect(typeof(jp[interface[i]]) === 'function').toBe(true);
	}
    });

    describe('url method', function() {
	it('should accept a string that represents the url', function() {
	    jp.url('http://www.thisisajsonfeed.com/feed.json');
	});

	it('should return the object when called as a setter method', function() {
	    expect(jp.url('http://www.thisisajsonfeed.com/feed.json')).toEqual(jp);
	});

	it('should return a string that represents the current url it is polling', function() {
	    jp.url('http://www.thisisajsonfeed.com/feed.json');
	    var u = jp.url();
	    expect(u).toEqual('http://www.thisisajsonfeed.com/feed.json');
	});

	it('should throw an error on a non-string argument', function() {
	    var badCall = function() {
		jp.url(5);
	    };
	    expect(badCall).toThrow(new Error('url only accepts a string argument'));
	});

	it('should throw an error if url is called without url being set previously', function() {
	    var badCall = function() {
		var u = jp.url();
	    };
	    expect(badCall).toThrow(new Error('url needs to be set before you call it as a getter'));
	});
    });

    describe('timeout method', function() {
	it('defaults the timeout to 0', function() {
	    expect(jp.timeout()).toBe(0);
	});

	it('should accept an integer that represents the timeout in seconds and stores it in timeout', function() {
	    jp.timeout(30);
	    expect(jp.timeout()).toBe(30);
	});

	it('should return the object when called as a setter method', function() {
	    expect(jp.timeout(20)).toEqual(jp);
	});

	it('should stop polling if the timeout is set to 0', function() {
	    jp.url('fixtures/public_timeline.json').timeout(20).start();
	    jp.timeout(0);
	    expect(jp.isPolling()).toBe(false);
	});

	it('should throw an error on a non-numeric parameter', function() {
	    var badCall = function() {
		jp.timeout('hello');
	    };
	    expect(badCall).toThrow(new Error('timeout requires the parameter to be an integer'));
	});
    });

    describe('name method', function() {
	it('should return a string that is the name of this poller', function() {
	    expect(typeof(jp.name()) === 'string').toBe(true);
	});
    });

    describe('start method', function() {
	beforeEach(function() {
	    jp.url('fixtures/public_timeline.json').start();
	});

	afterEach(function() {
	    if(jp.isPolling()) {
		jp.stop();
	    }
	});

	it('should start polling', function() {
	    expect(jp.isPolling()).toBe(true);
	});

	it('should add a script tag with URL to DOM', function() {
	    var script = document.getElementById(jp.name()+"_script_tag_id");
	    expect(script.src.match(new RegExp(jp.url().substring(0,jp.url().indexOf('?'))))).toBeTruthy();
	});

	it('should replace the =* in the callback with the name of this process function', function() {
	    var jp2 = new JSONPPoller();
	    jp2.url("fixtures/public_timeline.json?callback=*").start();

	    var script = document.getElementById(jp2.name()+"_script_tag_id");
	    expect(script.src.match(new RegExp("callback="+jp2.callbackName()))).toBeTruthy();
	    jp2.stop();
	});

	it('should remove previous script tag from the DOM if it exists', function() {
	    var scripts = [];
	    var script_tags;
	    var i;
	    jp.start(); //call it a second time to make sure we don't add an extra script tag
	    scripts = [];

	    script_tags = document.getElementsByTagName('script');
	    for(i = 0; i < script_tags.length; i++) {
		if(script_tags[i].id !== 'undefined' && script_tags[i].id.match(jp.name())) {
		    scripts.push(script_tags[i]);
		};
	    };
	    expect(scripts.length).toBe(1);
	});



	it('should throw error if no URL has been specified', function() {
	    var jp2 = new JSONPPoller();
	    var badCall = function() {
		jp2.start();
	    };
	    expect(badCall).toThrow(new Error('start requires a url to have been specified'));
	});
    });

    describe('stop method', function() {
	var jp2;
	beforeEach(function() {
	    jp2 = new JSONPPoller();
	    jp2.url('fixtures/public_timeline.json').timeout(2).start();
	});

	it('should stop polling', function() {
	    jp2.stop();

	    expect(jp2.isPolling()).toBe(false);
	});

	it('should cancel the expected next call to start', function() {
	    jp2.stop();
	    waits(3000);
	    runs(function() {
		expect(jp2.count()).not.toBe(2);
	    });
	});

	it('should remove the script tag from the head', function() {
	    var script_tags;
	    var i;
	    jp2.stop()
	    script_tags = document.getElementsByTagName('script');
	    for(i = 0; i < script_tags.length; i++) {
		expect(script_tags[i].id === jp2.name()+'_script_tag_id').toBe(false);
	    };
	});
    });

    describe('process method', function()  {
	var processStub = jasmine.createSpy('processStub');
	beforeEach(function() {
	    jp.process(function(o) {
		o.data = {hello:"world"};
		o.update = true;
		return o;
	    });

	    processStub = jasmine.createSpy('processStub');
	});

	it('should accept a function as an argument', function() {
	    jp.process(function(data) {
		//this is the process function
	    });
	});

	it('should accept an object as an argument', function() {
	    jp.process({hello:'world',key2:'value2'});
	});

	it('should return the object when called as a setter method', function() {
	    expect(jp.process(function(){ })).toEqual(jp);
	});

	it('should be called after polling starts and data is returned from the URL', function() {
	    var temp = function() { alert('hello!') };
	    jp.url("fixtures/empty_object_with_callback.json").process(processStub);
	    jp.start();
	    waits(500);
	    runs(function() {
		expect(processStub).toHaveBeenCalledWith({});
		jp.stop();
	    });
	});

	it('should accept a data object and then processes it according to the process function', function() {
	    var obj = {};
	    jp.process(obj);
	    expect(obj.data).toEqual({hello:'world'});
	});

	it('should emit data when update is set to true', function() {
	    jp.on('data', processStub).process({});
	    runs(function() {
		expect(processStub).toHaveBeenCalledWith({hello:'world'});
	    });
	});

	it('should not emit data when update is set to false', function() {
	    jp.process(function(data) {
		var result = {};
		result.data = data;
		result.update = false;
		return result;
	    });
	    jp.on('data', processStub).process({});
	    expect(processStub).not.toHaveBeenCalled();
	});

	it('should emit error if an error is returned', function() {
	    jp.process(function(data) {
		var result = {};
		result.data = data;
		result.error = 'this is the error';
		result.update = false;
		return result;
	    });
	    jp.on('error', processStub).process({});
	    expect(processStub).toHaveBeenCalled();
	});

	it('should reload the data after the specified timeout', function() {
	    var jp2 = new JSONPPoller();
	    jp2.url('fixtures/empty_object_with_callback.json').timeout(1);
	    expect(jp2.count()).toBe(0);
	    jp2.start();
	    expect(jp2.count()).toBe(1);
	    runs( function() {
		waitsFor(function() {
		    var result = (jp2.count() === 2);
		    return result;
		}, "start never called a second time", 2000);
	    });
	    runs( function() {
		jp2.stop();
	    });
	});

	it('should throw an error if the argument is not a function or an object', function() {
	    expect(function() {jp.process(5)}).toThrow(new Error('process requires the parameter to be an object or a function'));
	});
    });

    describe('isPolling method', function() {
	it('should return false if it has not started', function() {
	    expect(jp.isPolling()).toBe(false);
	});

	it('should return true if it has started', function() {
	    jp.url("fixtures/public_timeline.json");
	    jp.start();
	    expect(jp.isPolling()).toBe(true);
	});

	it('should toggle true and false between calls', function() {
	    expect(jp.isPolling()).toBe(false);
	    jp.url("fixtures/public_timeline.json");
	    jp.start();
	    expect(jp.isPolling()).toBe(true);
	    jp.stop();
	    expect(jp.isPolling()).toBe(false);
	});
    });
});