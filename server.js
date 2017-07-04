var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var Whitelist = require('./whitelist.js');
var wl = new Whitelist;

app.use(express.static(__dirname + '/client'));

users = [];

server.listen(80);
console.log('Server running');

app.get('/', serve);

io.sockets.on('connection', handleConnection);

function serve(req, res) {
  res.sendFile(__dirname + '/client/index.html');
};

function handleConnection(socket) {
  console.log('User %s connected', socket.id);

  // Disconnection
  socket.on('disconnect', function(data) {
    if (!socket.username) return;
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    console.log('User %s disconnected', socket.id);
  });

  // Send message
  socket.on('send message', function(data) {
    console.log('New message: %s', data);
    io.sockets.emit('new message', {
      message: data,
      username: socket.username
    });
  });

  // New user
  socket.on('new user', function(data) {
    if (wl.hasUsername(data)) {
      socket.emit('ask password');
    } else {
      socket.emit('login accepted');
      socket.username = data;
      users.push(socket.username);
      updateUsernames();
    }
  });

  socket.on('protected username', function(data) {
    if (wl.match(data.username, data.password)) {
      socket.emit('login accepted');
      socket.username = data.username;
      users.push(socket.username);
      updateUsernames();
    }
  });

  socket.on('add user', function(data) {
    wl.addUser('böa', 'böa');
  });

  function updateUsernames() {
    io.sockets.emit('get users', users);
  }
};
