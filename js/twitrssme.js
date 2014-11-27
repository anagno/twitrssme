/*
              (c) Copyright 2014 Charlie Harvey

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// TODO: memoize here
function tweetsFor(user,jQueryElem,fn,asHTML,handler) {
  var yql  = "http://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D%22https%3A%2F%2Ftwitter.com%2F"
             + user
             + "%22%20AND%20xpath%3D%22%2F%2Fdiv%5Bcontains(%40class%2C'js-stream-item')%5D%22&format=json"
  $.ajax({ type: 'GET'
     , url: yql
     , dataType: 'jsonp'
     , success: function(data, textStatus) {
         if(null==data.query.results) {
           alert("Couldn't retrieve anything for " + user);
           return;
         }
         tweets = extractTweets(data.query.results,5);
         if(asHTML)
           jQueryElem.html(fn(user,tweets));
         else
           jQueryElem.text(fn(user,tweets));
      }
    , failure: function(status,err){ alert("Problems running query" + err); }
    , complete: function() {
        if(handler)
          handler(jQueryElem)
      }
  });
}
function showFeed(jQueryElem) {
    rss = encodeURIComponent($('#rss-result').text());
    window.location.assign('data:text/xml,'+rss);
}
function makeHTML(user,tweets) {
  html = "<h2>Twitter feed for " 
          + user 
          + "</h2>\n"
          + "<ul>";
  for (i=0;i<tweets.length;i++) {
    t=tweets[i];
    html += "\n\t<li>\n\t\t<blockquote>"
           + t.tweetHTML
           + "</blockquote>\n\t\t<p>Posted: "
           + t.tweetDate 
           + ' by <a href="'
           + t.authorTwitterURL
           + '">'
           + t.authorTwitterName 
           + ' ('
           + t.authorFullName
           + ')</a> | <a href="'
           + t.tweetURL
           + '">Original Tweet</a>\n\t</li>\n'
  }
  return html + "</ul>"
}

function makeRSS (user,tweets) {
  rss = '<?xml version="1.0" encoding="UTF-8"?>'
        + "\n"
        + '<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:georss="http://www.georss.org/georss" xmlns:twitter="http://api.twitter.com" version="2.0">'
        + "\n"
        + "<channel>\n\t<title>Twitter Search / "
        + user 
        + "</title>\n\t<link>http://twitter.com/" 
        + user 
        + "</link>\n\t<description>Twitter feed for: "
        + user 
        + ". Generated by TwitRSS.me/JS</description>\n\t<language>en-us</language>\n\t<ttl>40</ttl>\n\n";
  for (i=0;i<tweets.length;i++) {
    t=tweets[i];
    rss += "<item>\n\t<title><![CDATA["
           + t.authorTwitterName
           + ' '
           + t.tweetHTML
           + "]]></title>\n\t<description><![CDATA["
           + t.tweetHTML
           + "]]></description>\n\t<pubDate>"
           + t.tweetDate 
           + "</pubDate>\n\t<guid>"
           + t.tweetURL 
           + "</guid>\n\t<link>"
           + t.tweetURL 
           + "</link>\n\t<twitter:source />\n\t<twitter:place />\n</item>\n";
  }
  rss += "</channel>\n</rss>";
  return rss;
}

function extractTweets (tweets, max) {
  toReturn = [];
  for(i=0;i<max;i++) {
    if(tweets.div[i]) {
      tweet=tweets.div[i].div;
      header = tweet.div[0];
      body   = tweet.div[1];
      if(header.div.a) { // we have a normal tweet
        metadiv = header.div;
        rt      = 0;
      }
      else {  // Its a RT
        metadiv = header.div[1];
        rt      = 1;
      }
      authorFullName    = metadiv.a.span.strong.content;
      authorTwitterName = '@' + metadiv.a.span.span.content.replace(/\s+/,'');
      authorTwitterURL  = "https://twitter.com" + metadiv.a.href;
      tweetURL          = "https://twitter.com" + metadiv.span[1].a.href;
      tweetDate         = metadiv.span[1].a.title;
      tweetHTML         = body.p.content;
      tweetAs           = body.p.a;
      tweetImg          = "";
      if(body.div[0] && body.div[0].class.indexOf("js-tweet-details-fixer")>-1) {
          tweetImg          = body.div[0].div.div.div.a.img;
      }
      if(tweetImg) {
        tweetHTML = tweetHTML + '<br /><img src="'+tweetImg.src+'" />';
      }
      if(tweetAs) {
        for(j=0;j<tweetAs.length;j++) {
          link = '<a href="#">UNDEFINED LINK TYPE!</a> ';
          if(tweetAs[j].class=="twitter-timeline-link") {
            link = '<a href="'+tweetAs[j].title+'">'+tweetAs[j].title+'</a> ';
          }
          else if (tweetAs[j].class.indexOf('twitter-hashtag')>-1){
            link = '<a href="https://twitter.com/'+tweetAs[j].href+'">#'+tweetAs[j].strong+'</a> ';
          }
          else if (tweetAs[j].class.indexOf('twitter-atreply')>-1){
            link = '<a href="https://twitter.com'+tweetAs[j].href+'">@'+tweetAs[j].strong+'</a> ';
          }
          tweetHTML = tweetHTML.replace(/\n\s*/,link);
        }
      } 
      toReturn[i] = {
          'authorFullName' : authorFullName
        , 'authorTwitterName' : authorTwitterName
        , 'authorTwitterURL' : authorTwitterURL
        , 'tweetURL' : tweetURL
        , 'tweetDate' : tweetDate
        , 'tweetHTML' : tweetHTML
        , 'tweetAs' : tweetAs
        , 'tweetImg' : tweetImg
      }
    } // if
  } //for
  return toReturn;
}