var context = new AudioContext();
var Snare = require('../index');
var snare = Snare(context);

document.getElementById('play').addEventListener('click', function(e) {
  var snareNode = snare();

  snareNode.detune.value = parseInt(document.getElementById('detune').value);
  snareNode.duration = parseFloat(document.getElementById('duration').value);

  snareNode.connect(context.destination);
  snareNode.start(context.currentTime);
});

var interval = false;
document.getElementById('loop').addEventListener('click', function(e) {
  if (typeof interval === 'number') {
    clearInterval(interval);
    interval = false;
  } else {
    interval = setInterval(function() {
      document.getElementById('play').click();
    }, 150);
    document.getElementById('play').click();
  }
});
