/*Socket handling initialization and listener functions which are used by the server to initialize and handle communication
between the client and the server.  All chat-related and video-related communication between the client and server should
be handled via sockets.*/

var moment = require('moment');
var app = require(__dirname + "/../server.js");
var youtube = require(__dirname + "/youtubeUtilities.js");

// Initializes io socket server
// var ioPort = 1337;

var io = module.exports.io = require('socket.io').listen(app.server);
console.log("Socket.io server listening");

// Keeps track of active clients
module.exports.activeSockets = [];
module.exports.numActiveClients = 0;

// Handles all behavior specific to a given socket
module.exports.setUpSockets = function () {
  io.on('connection', function (socket) {
    module.exports.activeSockets.push(socket);
    console.log("Connection established");
    module.exports.numActiveClients++;

    //This if statement stops the server from emitting a "play" message to the clients before the video data has been retrieved via Youtube API
    var currentVideo = app.getCurrentVideo();
    if (currentVideo.startMoment !== null) {
       //The 'time' property is the number of milliseconds that the client should skip ahead when it plays the Youtube video
      socket.emit('play', {
        url: currentVideo.url,
        title: currentVideo.title,
        time: moment().diff(currentVideo.startMoment)
      });
    }

    socket.on('disconnect', function (socket) {
      var sockIdx = module.exports.activeSockets.indexOf(socket);
      module.exports.activeSockets.splice(sockIdx, 1);
      module.exports.numActiveClients--;
    });

    // Handle incoming chat messages

    socket.on('chat message', function (msg) {
      app.addMessage(msg);
      io.emit('chat message', msg);
   });

    // Echo messages back to client (for use in debugging & testing)
    socket.on('echo', function (obj) {
      socket.emit(obj.name, obj.data);
    });
  });
  console.log('sockets established...');
};

// Attaches video info to the playlist and emits it to client
module.exports.emitPlaylist = function () {
  var playlist = app.getPlaylist();
  var fetchedEntries = 0;
  var playlistWithInfo = [];
  for (var i = 0; i < playlist.length; i++) {
    var playlistEntry = playlist[i];
    var parsedEntry = playlistEntry.split('=');

    // Retrieve video information for every video in the playlist
    youtube.getVideoInfo(parsedEntry[1], function (position, err, result) {
      fetchedEntries++;
      var snippet = result.items[0].snippet;

      var newVideo = {};
      newVideo.id = parsedEntry[1];
      newVideo.url = playlistEntry;
      newVideo.title = snippet.title;

      playlistWithInfo[position] = newVideo;

      // Once we have retrieved information for every video, emit the playlist
      if (fetchedEntries === playlist.length) {
        io.emit('playlist', {
          playlist: playlistWithInfo
        });
      }
    }.bind(null, i));
  }
};
