var socket = io.connect();

$(function() {

  var $userFormArea = $('#userFormArea');
  var $messageArea = $('#messageArea');
  var $users = $('#users');

  var $userForm = $('#userForm');
  var $username = $('#username');
  var $password = $('#password');
  var $key = $('#key');

  var $messageForm = $('#messageForm');
  var $message = $('#message');
  var $chat = $('#chat');

  var key;

  loadStyleSheet();

  $userForm.submit(function(e) {
    e.preventDefault();
    if ($username.val() && $key.val() && $password.val()) {
      socket.emit('protected username', {
        username: $username.val(),
        password: $password.val()
      });
    } else if ($username.val() && $key.val()) {
      socket.emit('new user', $username.val());
    }
  });

  $messageForm.submit(handleSubmit).keydown(function(e) {
    if (e.keyCode == 13) {
      handleSubmit(e);
    }
  });

  function handleSubmit(e) {
    e.preventDefault();
    if ($message.val()) {
      var encrypted = CryptoJS.AES.encrypt($message.val(), key);
      socket.emit('send message', encrypted.toString());
      $message.val('');
    }
  }

  socket.on('new message', function(data) {
    var decrypted;
    try {
      decrypted = CryptoJS.AES.decrypt(data.message, key).toString(CryptoJS.enc.Utf8);
    } catch (err) {
      decrypted = data.message;
    }
    if (!decrypted) {
      decrypted = data.message;
    }
    $chat.append('<div class="well"><strong>' + data.username +
      '</strong>: ' + decrypted + '</div>');
  });

  socket.on('get users', function(data) {
    var html = '';
    for (i = 0; i < data.length; i++) {
      html += '<li class="list-group-item">' + data[i] + '</li>'
    }
    $users.html(html);
  });

  socket.on('login accepted', function(data) {
    key = $key.val();
    $username.val('');
    $key.val('');
    $userFormArea.hide();
    $messageArea.show();
  });

  socket.on('ask password', function(data) {
    $('#password-input').show();
  });
});

function swapStyleSheet(sheet) {
  $('#stylesheet').attr('href', '/styles/' + sheet);
  saveStyleSheet(sheet);
}

function saveStyleSheet(sheet) {
  if (typeof(Storage !== "undefined")) {
    localStorage.setItem("CryptoChatStyleSheet", sheet);
  }
}

function loadStyleSheet() {
  if (localStorage.getItem("CryptoChatStyleSheet")) {
    swapStyleSheet(localStorage.getItem("CryptoChatStyleSheet"));
  }
}

function toggleFullScreen() {
  if ((document.fullScreenElement && document.fullScreenElement !== null) ||
    (!document.mozFullScreen && !document.webkitIsFullScreen)) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
}

function addUser() {
  socket.emit('add user');
}
