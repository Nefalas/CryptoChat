var jwt = require('jsonwebtoken');

module.exports.test = (req, res) => {
  var user = {
    email: "test@test"
  }
  var token = jwt.sign(user, process.env.SECRET_KEY, {
    expiresIn: 5000
  });
  res.json({
    success: true,
    token: token
  })
}

module.exports.addUser = (req, res) => {
  res.send("it works");
}
