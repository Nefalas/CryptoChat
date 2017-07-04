var fs = require('fs');

Whitelist = function() {
  this.whitelist = {};
  this.fillList();
}

Whitelist.prototype.fillList = function() {
  fs.readFile(__dirname + '/storage/whitelist', 'utf8', (err, data) => {
    if (err) throw err;
    this.whitelist = JSON.parse(data);
  });
}

Whitelist.prototype.hasUsername = function(username) {
  for (var i = 0; i < this.whitelist.length; i++) {
    if (this.whitelist[i].username == username) {
      return true;
    }
  }
  return false;
}

Whitelist.prototype.match = function(username, password) {
  for (var i = 0; i < this.whitelist.length; i++) {
    if (this.whitelist[i].username == username) {
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
  var currentWhitelist = fs.readFileSync(__dirname + '/storage/whitelist', 'utf8');
  console.log(currentWhitelist);
}

module.exports = Whitelist;
