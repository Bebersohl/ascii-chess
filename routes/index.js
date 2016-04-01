var express = require('express');
var router = express.Router();
var chess = require('chess.js').Chess;

var game = chess();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { game: game.ascii() });
});

module.exports = router;
