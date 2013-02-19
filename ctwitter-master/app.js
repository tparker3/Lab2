var main = function () {
    console.log("hello world");
  
    var twitter = new ctwitter.CTwitter();
    twitter.stream("statuses/filter", { lang:"en", track:["Social Media"] }, function (stream) {
        stream.on("data", function (tweet) {
              //$("#tweets").append("<img src='"+tweet.profile_image_url+"' />");
             var tweet = $("<p>"+tweet.text+"</p>") 
            tweet.hide();
              $("#tweets").append(tweet);
              console.log(tweet.text);
               tweet.fadeIn();
                tweet.fadeOut(10000);
                  tweet.slideDown();
                
        });
    });
}


$(document).ready(main);