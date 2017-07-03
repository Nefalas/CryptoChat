$(function() {
  var socket = io.connect();

  var $userFormArea = $('#userFormArea');
  var $messageArea = $('#messageArea');
  var $users = $('#users');

  var $userForm = $('#userForm');
  var $username = $('#username');
  var $key = $('#key');

  var $messageForm = $('#messageForm');
  var $message = $('#message');
  var $chat = $('#chat');

  var key;

  $userForm.submit(function(e) {
    e.preventDefault();
    if ($username.val() && $key.val()) {
      socket.emit('new user', $username.val());
      key = $key.val();
      $username.val('');
      $key.val('');
      $userFormArea.hide();
      $messageArea.show();
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
    } catch(err) {
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
  })
});
