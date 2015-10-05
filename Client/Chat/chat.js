angular.module('glitch.chat', ['luegg.directives'])
.controller('chatController', function ($scope, socket) {

  $scope.messages = [];
  $scope.username = 'anonymous';

  $scope.sendMessage = function (keyEvent) {
    // console.log($scope.messageText);
    socket.emit('chat message', {
      username: $scope.username,
      text: $scope.messageText
    });
    $scope.messageText = '';
  };

  socket.on('chat message', function (msg) {
    $scope.messages.push(msg);
  });
});


