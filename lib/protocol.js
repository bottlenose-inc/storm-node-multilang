var fs = require('fs');
var util = require('util');

var Protocol = module.exports.Protocol = function(callback, input, output) {
  this.callback = callback;
  this.input = input || process.stdin;
  this.output = output || process.stdout;

  this.ready = false;
  this.buffer = [];
};

Protocol.prototype = {
  readStream: function() {
    var self = this;

    this.input.setEncoding('utf8');
    this.input.on('data', function(chunk) {
      self._readChunk(chunk)
    });

    this.input.resume();
  },
  _readChunk: function(chunk) {
    var chunks = chunk.toString().split("\n");
    var buffer = this.buffer.concat(chunks);

    var message;
    var tail = 0;
    for (var i = 0; i < buffer.length; i++) {
      if (buffer[i] == "end") {
        message = buffer.slice(tail, i).join("").trim();
        this._readMessage(message);
        tail = i + 1;
      }
    }

    buffer.splice(0, tail);
    this.buffer = buffer;
  },
  _readMessage: function(message) {
    if (!message) return;
    message = JSON.parse(message);

    if (!this.ready) {
      this.context = message;
      this._sendPid();

      this.ready = true;
    }
    else {
      return this.callback(message);
    }
  },
  _sendPid: function(pidDir) {
    if (!pidDir) pidDir = this.context.pidDir;

    var pid = process.pid;
    this.sendMessage({ pid: pid });

    fs.open(pidDir + '/' + pid, 'w', function(err, fd) {
      if (!err) {
        fs.close(fd);
      }
    });
  },
  sendMessage: function(message) {
    var string = JSON.stringify(message);
    this.output.write(string + "\nend\n");
  },
  sendLog: function(message) {
    this.sendMessage({
      command: 'log',
      msg: message
    })
  }
};
