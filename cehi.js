var Stomp = require('stomp-client');
var destination = '/topic/myTopic';
var client = new Stomp('127.0.0.1', 61613, 'admin', 'admin');
 
client.connect(function(sessionId) {
    client.subscribe(destination, function(body, headers) {
      console.log('From MQ:', body);
    });
 
    client.publish(destination, 'Hello World!');
});