var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { game: 

'   +------------------------+\n'+
' 8 | r  n  b  q  k  b  n  r |\n'+
' 7 | p  p  p  p  p  p  p  p |\n'+
' 6 | .  .  .  .  .  .  .  . |\n'+
' 5 | .  .  . ascii  .  .  . |\n'+
' 4 | .  .  . chess  .  .  . |\n'+
' 3 | .  .  .  .  .  .  .  . |\n'+
' 2 | P  P  P  P  P  P  P  P |\n'+
' 1 | R  N  B  Q  K  B  N  R |\n'+
'   +------------------------+\n'+
'   a  b  c  d  e  f  g  h'
	});
});

module.exports = router;
