var Protocol = require('./protocol').Protocol;

var Bolt = module.exports.Bolt = function(execute, input, output) {
  this.execute = execute;
  var callback = this.delegate(execute);

  this.ready = false;
  this.protocol = new Protocol(callback, input, output);
};

Bolt.prototype = {
  delegate: function(execute) {
    var self = this;
    return function(tuple) {
      if (tuple && tuple.tuple) {
        // pass self as collector
        return execute(tuple, self);
      }
    };
  },
  run: function() { /* run */
    this.ready = true;
    this.protocol.run();
  },
  emit: function(tuple, anchors, stream, task) { /* emitBolt */
    var message = {
      command: 'emit'
    };

    if (anchors) {
      message.anchors = anchors;
    }
    if (stream) {
      message.stream = stream;
    }
    if (task) {
      message.task = task;
    }

    message.tuple = tuple;

    this.protocol.sendMessage(message);
  },
  ack: function(tuple) { /* ack */
    this.protocol.sendMessage({
      command: 'ack',
      id: tuple.id
    });
  },
  fail: function(tuple) { /* fail */
    this.protocol.sendMessage({
      command: 'fail',
      id: tuple.id
    });
  }
};
