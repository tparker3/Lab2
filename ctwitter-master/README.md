ctwitter
=======

ctwitter is a client-side twitter 'streaming' library. It doesn't actually use the Twitter Streaming API,
it uses JSONP polling of the Search API. It integrates with Processing.js so that twitter data can be used
without writing any external JavaScript or server-side code.

Use Cases
=========

ctwitter is designed to be used in client-side web development courses to give students some experience
with real-time data before they learn about client side data.

It also can be used to create prototype processing.js sketches that utilize 'real-time' twitter streaming.


API
===

Documentation coming soon. In the meantime, take a look at the examples in the examples folder. It's designed
to be very similar to the Node.js ntwitter library.

Example
=======

    var twitter = new CTwitter.ctwitter();
    twitter.stream("statuses/filter", { lang:"en", track:["node.js", "javascript"] }, function (stream) {
        stream.on("data", function (tweet) {
            console.log(tweet.text);
        });
    });
