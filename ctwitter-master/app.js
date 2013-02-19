var main = function () {
    console.log("hello world");
  
    var twitter = new ctwitter.CTwitter();
    twitter.stream("statuses/filter", { lang:"en", track:["New Media"] }, function (stream) {
        stream.on("data", function (tweet) {
              $("#tweets").append("<img src='"+tweet.profile_image_url+"' />");
              console.log(tweet.profile_image_url);

        });
    });
}


$(document).ready(main);