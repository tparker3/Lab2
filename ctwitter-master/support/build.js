var fs = require('fs');
var deps = ['event_emitter.js', 'jsonp_poller.js', 'ctwitter.js'];

var build = '';

deps.forEach(function (filename) {
    var file = fs.readFileSync('src/'+filename, 'utf8');
    build += file;
});

fs.writeFile('build/ctwitter.js', build, function(err) {
    if (err) {
	console.log('not ok');
    } else {
	console.log('ok');
    }
});



