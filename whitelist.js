var fs = require('fs');

var path = __dirname + '/storage/whitelist';
var encoding = 'utf8';

Whitelist = function() {
  this.whitelist = {};
  this.fillList();
}

Whitelist.prototype.fillList = function() {
  this.whitelist = JSON.parse(fs.readFileSync(path, encoding));
}

Whitelist.prototype.hasUsername = function(username) {
  this.fillList();
  for (var i = 0; i < this.whitelist.length; i++) {
    if (this.whitelist[i].username.toLowerCase() == username.toLowerCase()) {
      return true;
    }
  }
  return false;
}

Whitelist.prototype.match = function(username, password) {
  this.fillList();
  for (var i = 0; i < this.whitelist.length; i++) {
    if (this.whitelist[i].username.toLowerCase() == username.toLowerCase()) {
      if (this.whitelist[i].password == password) {
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
}

Whitelist.prototype.addUser = function(username, password) {
  var newWhitelist = JSON.parse(fs.readFileSync(path, encoding));
  newWhitelist.push({
    "username": username,
    "password": password
  });
  this.whitelist = newWhitelist;
  fs.writeFile(path, JSON.stringify(this.whitelist), encoding, (err) => {
    if (err) {
      console.log('Could not save whitelist: ' + err);
    }
  });
}

module.exports = Whitelist;
