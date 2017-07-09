var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var Whitelist = require('./whitelist.js');

var secureRoute = express.Router();
var authRoute = express.Router();

var wl = new Whitelist;
var mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cryptochat.auto@gmail.com',
    pass: '&@2FS?7q8TqR989%ts4Z?2y+Vj872kcK'
  }
});

var users = [];
var userKeys = {};

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use('/secure-api', secureRoute);
app.use('/auth', authRoute);
app.use(express.static(__dirname + '/client'));

process.env.SECRET_KEY = randomKey(32);

secureRoute.use((req, res, next) => {
  var token = req.query.token;
  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
      if (err) {
        return res.status(500).send("Invalid token");
      }
      next();
    });
  } else {
    res.status(500).send("No token");
  }
});

authRoute.use((req, res, next) => {
  var token = req.body.token;
  var username = req.body.username;
  if (token && username) {
    jwt.verify(token, userKeys.username, (err, decode) => {
      if (err) {
        return res.status(500).send("Invalid token");
      }
      if (username.toLowerCase() == decode.username.toLowerCase()) {
        next();
      } else {
        res.status(500).send("Invalid token");
      }
    });
  } else {
    res.status(500).send("Invalid request");
  }
});

secureRoute.get('/new-user', (req, res) => {
  res.sendFile(__dirname + '/client/add-user.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client/index.html');
});

server.listen(80);
console.log('Server running');

io.sockets.on('connection', handleConnection);

function handleConnection(socket) {
  console.log('User %s connected', socket.id);

  app.post('/login', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
      if (wl.match(username, password)) {
        userKeys.username = randomKey(32);
        var token = jwt.sign({
          username: username
        }, userKeys.username);
        res.send(token);
        users.push(username);
        updateUsernames();
      } else {
        res.status(500).send("Invalid password or username");
      }
    } else {
      res.status(500).send("Invalid request");
    }
  });

  app.post('/send-message', (req, res) => {
    var message = req.body.message;
    var username = req.body.username;
    if (wl.hasUsername(username)) {
      return res.status(500).send("Password protected username");
    }
    if (message && username) {
      io.sockets.emit('new message', {
        message: message,
        username: username
      });
      res.send("Message sent");
    } else {
      res.status(500).send("Invalid request");
    }
  });

  authRoute.post('/send-message', (req, res) => {
    var message = req.body.message;
    var username = req.body.username;
    if (message && username) {
      io.sockets.emit('new message', {
        message: message,
        username: username
      });
      res.send("Message sent");
    } else {
      res.status(500).send("Invalid request");
    }
  });

  // Disconnection
  socket.on('disconnect', (data) => {
    if (!socket.username) return;
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    console.log('User %s disconnected', socket.id);
  });

  // Send message
  socket.on('send message', (data) => {
    console.log('New message: %s', data);
    io.sockets.emit('new message', {
      message: data,
      username: socket.username
    });
  });

  // New user
  socket.on('new user', (data) => {
    if (wl.hasUsername(data)) {
      socket.emit('ask password');
    } else {
      socket.emit('login accepted');
      socket.username = data;
      users.push(socket.username);
      updateUsernames();
    }
  });

  socket.on('send invitation', (data) => {
    var token = jwt.sign({
      email: data
    }, process.env.SECRET_KEY, {
      expiresIn: 3600
    });

    var mailOptions = {
      from: 'cryptochat.auto@gmail.com',
      to: data,
      subject: 'Invitation to CryptoChat',
      text: 'http://cryptochat.serveftp.com/secure-api/new-user?token=' + token
    }

    mailer.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Invitation sent: ' + info.response);
      }
    })
  });

  socket.on('protected username', (data) => {
    if (wl.match(data.username, data.password)) {
      socket.emit('login accepted');
      socket.emit('admin granted');
      socket.username = data.username;
      users.push(socket.username);
      updateUsernames();
    }
  });

  socket.on('add user', (data) => {
    if (wl.hasUsername(data.username)) {
      socket.emit('invalid username');
    } else {
      wl.addUser(data.username, data.password);
      socket.emit('user added');
      process.env.SECRET_KEY = randomKey(32);
    }
  });

  function updateUsernames() {
    io.sockets.emit('get users', users);
  }
};

function randomKey(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
