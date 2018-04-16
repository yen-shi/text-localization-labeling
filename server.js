var express = require('express');
var app = express();
var http = require('http').Server(app);

app.use('/src', express.static(__dirname + '/src'));
app.use('/cases', express.static(__dirname + '/cases'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
  console.log('Listen on localhost:3000');
});

