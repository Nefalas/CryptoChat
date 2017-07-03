var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/client'));

users = [];
connections = [];

server.listen(3000);
console.log('Server running');

app.get('/', serve);

io.sockets.on('connection', handleConnection);

function serve(req, res) {
  res.sendFile(__dirname + '/client/index.html');
};

function handleConnection(socket) {
  connections.push(socket);
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
    socket.username = data;
    users.push(socket.username);
    updateUsernames();
  })

  function updateUsernames() {
    io.sockets.emit('get users', users);
  }
};
