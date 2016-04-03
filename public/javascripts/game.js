"use strict";

var $userIN = $("#user-in");
var $userBTN = $("#user-btn");
var $userTA = $("#user-ta");
var $moves = $("#moves");
var $status = $("#status");
var loadingInterval = 0;
var username = "";
var room = "";
var inLobby = true;
var socket = io();
var $p1time = $("#p1time");
var $p2time = $("#p2time");

socket.on('game start', function(state){
  loadingStop();
  console.log('game start');
  addText(state.ascii);
  $('#player1').text(state.p1 + ' (white)');
  $('#player2').text(state.p2 + ' (black)');
  $userIN.attr("placeholder", "enter move...");
  $userBTN.prop('value', 'move');
  room = state.room;
  inLobby = false;
  $status.text("white's turn");
  $p2time.hide();
});

socket.on('your turn', function(moves){
  $moves.text("moves: " + moves + ',random');
});
socket.on('tick', function(time){
  $p1time.text(Math.ceil(time / 1000) + 's');
  $p2time.text(Math.ceil(time / 1000) + 's');
});
socket.on('board update', function(state){
  addText(state.ascii);
  if(state.turn === 'w'){
    $status.text("white's turn");
    $p1time.show();
    $p2time.hide();
  }else{
    $status.text("black's turn");
    $p2time.show();
    $p1time.hide();
  }
});

socket.on('game over', function(state){
  $status.text('');
  room = "";
  username = "";
  inLobby = true;
  $moves.text('');
  $userIN.attr("placeholder", "enter username ...");
  $userBTN.prop('value', 'play');
  if(state.winner === 'd/c'){
    //d/c
    $userTA.text('game over: opponent left\nplay again!');
  }else if(state.winner === 'timeout'){
    //timeout
    if(this.id === state.winningId){
      //you win
      $userTA.text('game over: timeout - you win\nplay again!');
    }else{
      //you lose
      $userTA.text('game over: timeout - you lose\nplay again!');
    }
  }
  else if(state.winner === 'draw'){
    //draw
    $userTA.text('game over: draw\nplay again!');
  }else if(state.winner === 'stalemate'){
    $userTA.text('game over: stalemate\nplay again!');
  }else{
    //not draw
    if(this.id === state.winningId){
      //you win
      $userTA.text('game over: you win\nplay again!');
    }else{
      //you lose
      $userTA.text('game over: you lose\nplay again!');
    }
  }
});

$('form').on('submit', function(e){
  e.preventDefault();
  if(inLobby){
    username = $userIN.val();
    $userTA.text('welcome, ' + username + '!');
    socket.emit('join game', username);
    loadingStart();
  }else{
    //in game
    socket.emit('new move', {move: $userIN.val(), room: room});
  }
  $userIN.val('');
});

var addText = function(text){
  $userTA.text(text.replace(/\n$/, ""));
  $userTA.append('&nbsp;&nbsp;');
}
var loadingStop = function(){
  clearInterval(loadingInterval);
}
var loadingStart = function(){
  var frames = [
  "\n"+
  "Waiting for opponent\n" +
  "╔════╤╤╤╤════╗\n" +
  "║    │││ \\   ║\n" +
  "║    │││  O  ║\n" +
  "║    OOO     ║",
"\n"+
  "Waiting for opponent\n" +
  "╔════╤╤╤╤════╗\n" +
  "║    ││││    ║\n" +
  "║    ││││    ║\n" +
  "║    OOOO    ║",
"\n"+
  "Waiting for opponent\n" +
  "╔════╤╤╤╤════╗\n" +
  "║   / │││    ║\n" +
  "║  O  │││    ║\n" +
  "║     OOO    ║",
"\n"+
  "Waiting for opponent\n" +
  "╔════╤╤╤╤════╗\n" +
  "║    ││││    ║\n" +
  "║    ││││    ║\n" +
  "║    OOOO    ║"
  ]
  var i = 0;
  clearInterval(loadingInterval);
  loadingInterval = setInterval(function() {
    i = ++i % 4;
    $userTA.text(frames[i]);
  }, 800);
}

