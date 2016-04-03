var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Stopwatch = require('timer-stopwatch');
var chess = require('chess.js').Chess;
var routes = require('./routes/index');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var games = [];
var players = [];

io.on('connection', function(socket){
  socket.on('join game', function(username){

    //check to make sure player hasn't already joined
    if(checkPlayers(this.id) === -1){
      players.push({username: username, socket: this, socketId: this.id});
    }

    //if there are 2 players start the game
    if(players.length >= 2){
      startGame();
    }

  });
  socket.on('disconnect', function(){

    //check to see if the socket that d/c was a player, if so remove from players
    var i = checkPlayers(this.id);
    if(i !== -1){
      players.splice(i, 1);
    }
    //TODO: check players in game.
    var dc = checkGames(this.id);
    if(dc === -1){
      console.log('error d/c');
    }else{
      io.to(games[dc.game].room).emit('game over', {winner: 'd/c', winningId: 'd/c'});
      //remove game from games
      //games.splice(dc.game, 1);
    }
  });
  socket.on('new move', function(state){
    //get game
    var index = getGame(state.room);
    //check whose move it is
    var currentTurn = (games[index].game.turn() === 'w') ? 0 : 1;
    //get current player
    var currentPlayer = (games[index].players[0].socketId === this.id) ? 0 : 1;
    //get waiting player
    var waitingPlayer = (currentPlayer === 1) ? 0 : 1;
    //check if right player
    if(currentPlayer === currentTurn){
      //get possible moves
      var possibleMoves = games[index].game.moves();
      //validate move
      if(possibleMoves.indexOf(state.move) > -1 || state.move === 'random' || state.move === 'Random'){
        //make move
        if(state.move === 'random' || state.move === 'Random'){
          //random move
          games[index].game.move(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
        }else{
          games[index].game.move(state.move);
        }
        //reset timer
        games[index].timer.reset(60000);
        games[index].timer.start();
        //check if game is over
        if(games[index].game.game_over()){
          var winner = "";
          var winningId = "";
          //check for draw
          if(games[index].game.in_draw()){
            winner = "draw";
          }else if(games[index].game.in_stalemate()){
          //check for stalemate
            winner = "stalemate";
          }else if(waitingPlayer === 0){
            winner = "white";
            winningId = games[index].players[currentPlayer].socketId;
          }else{
            winner = "black";
            winningId = games[index].players[currentPlayer].socketId;
          }
          //send game over event
          io.to(state.room).emit('game over', {winner: winner, winningId: winningId.substring(2)});
          //remove game from games
          games.splice(index, 1);
        }else{
          //send board to both players
          io.to(state.room).emit('board update', {ascii: games[index].game.ascii(), turn: games[index].game.turn()});
          //send your turn event to other player
          games[index].players[waitingPlayer].socket.emit('your turn', games[index].game.moves());
        }
      }
    }
  });
});

//creates game, adds it to games, adds players to room, resets player count
var startGame = function(){
  console.log('game start');
  games.push({players: players, game: new chess(), room: 'game' + games.length, timer: new Stopwatch(60000, {refreshRateMS: 1000})});
  var index = games.length - 1;
  games[index].players[0].socket.join('game' + index);
  games[index].players[1].socket.join('game' + index);

  //timer
  games[index].timer.onDone(function(){
    var currentTurn = games[index].game.turn();
    if(currentTurn === 'w'){
      var winningId = games[index].players[1].socketId;
    }else{
      var winningId = games[index].players[0].socketId;
    }
    io.to(games[index].room).emit('game over', {winner: 'timeout', winningId: winningId.substring(2)});
    console.log('done')
  });
  games[index].timer.onTime(function(time) {

    io.to(games[index].room).emit('tick', time.ms);
    
  });
  games[index].timer.start();
  io.to('game' + index).emit('game start', 
    {
      ascii: games[index].game.ascii(), 
      p1: games[index].players[0].username, 
      p2: games[index].players[1].username, 
      room: 'game' + index
    });
  games[index].players[0].socket.emit('your turn', games[index].game.moves());
  players = [];
}
var checkGames = function(socketId){
  for(var i = 0; i < games.length; i++){
    if(games[i].players[0].socketId === socketId){
      return {game: i, player: 0};
    }else if(games[i].players[1].socketId === socketId){
      return {game: i, player: 1};
    }
  }
  return -1;
}
var checkPlayers = function(socketId){
  for(var i = 0; i < players.length; i++){
    if(players[i].socketId === socketId){
      return i;
    }
  }
  return -1;
}
var getGame = function(room){
  for(var i = 0; i < games.length; i++){
    if(games[i].room === room){
      return i;
    }
  }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = {app: app, server: server};
