describe('ctwitter', function() {
    var ct;
    beforeEach(function() {
	ct = new CTwitter();
    });

    describe('processingjs integration', function() {
	xit('should not add processing to the window if it is undefined', function() {
	    if(window['Processing'] === undefined) {
		expect(window['Processing']).toBe(undefined);
	    }
	});

	it('should add the twitterStream function to Processing if Processing is defined', function() {
	    if(window['Processing']) {
		expect(window.Processing.prototype.twitterStream).not.toBe(undefined);
	    }
	});

	it('should add the onTweet function to Processing if Processing is defined', function() {
	    if(window['Processing']) {
		expect(window.Processing.prototype.onTweet).not.toBe(undefined);
	    }
	});
    });


    describe('stream method', function() {
	it('should accept mode, options and callback', function() {
	    var goodCall = function() {
		ct.stream('statuses/filter', { track:['bieber'] }, function(stream) { 
		    stream.destroy();
		});
	    };
	    expect(goodCall).not.toThrow();
	});

	//this is only if we can find a mode that doesn't require options
	xit('should accept mode and callback with no options', function() {
	    var goodCall = function() {
		ct.stream('statuses/filter', function() {
		    stream.destroy();
		});
		expect(goodCall).not.toThrow();
	    };
	});

	it('should deliver data to the client one tweet at a time', function() {
	    var stubA = jasmine.createSpy()
	    , tweet;
	    ct.stream('statuses/filter', { track:['bieber'] }, function (stream) {
		stream.on('data', stubA);
		setTimeout(stream.destroy, 3000);
	    });

	    waits(1000);
	    runs(function () {
		expect(stubA).toHaveBeenCalled();
		tweet = stubA.mostRecentCall.args[0];
		expect(tweet.text).not.toBe(undefined);
		expect(tweet.created_at).not.toBe(undefined);

	    });
	    waits(1000);
	    runs(function () {
		expect(stubA.callCount).toBeGreaterThan(1);
		tweet = stubA.mostRecentCall.args[0];
		expect(tweet.text).not.toBe(undefined);
		expect(tweet.created_at).not.toBe(undefined);
	    });

	});

	it('should throw an error in the statuses/filter method if no track or location option is specified', function() {
	    var badCall = function() {
		ct.stream('statuses/filter', { }, function(stream) {
		    stream.destroy();
		});
	    }
	    expect(badCall).toThrow(new Error('statuses/filter mode requires a location or track option'));
	});

	it('should throw an error if the statuses/filter track option is not an array or a string', function() {
	    var badCall = function() {
		ct.stream('statuses/filter', { track:5 }, function(stream) {
		    stream.destroy();
		});
	    }
	    expect(badCall).toThrow(new Error('statuses/filter track option should be a string or an array of strings'));
	});

	it('should throw an error if options exists but is not an object', function() {
	    var badCall = function() {
		ct.stream('statuses/filter', 156, function() {
		    stream.destroy();
		});
	    };
	    expect(badCall).toThrow('stream requires options parameter to be an object');
	});

	it('should throw an error when no mode is specified', function() {
	    var badCall = function() {
		ct.stream();
	    };
	    expect(badCall).toThrow(new Error('stream requires mode and it must be a string'));
	});

	it('should throw an error when no callback is specified', function() {
	    var badCall = function() {
		ct.stream('statuses/filter', { track:['bieber']});
	    };
	    expect(badCall).toThrow(new Error('stream requires callback and it must be a function'));
	});

	it('should throw an error when callback is not a function', function() {
	    var badCall = function() {
		ct.stream('statuses/filter', {track:['bieber']}, 5);
	    };
	    expect(badCall).toThrow(new Error('stream requires callback and it must be a function'));
	});

	it('should throw an error when mode is not a string', function() {
	    var badCall = function() {
		ct.stream(5, { }, function(stream) { 
		    stream.destroy();
		});
	    };
	    expect(badCall).toThrow(new Error('stream requires mode and it must be a string'));
	});
    });
});