var Snare = require('./index');
var context = new AudioContext();
var snare = Snare(context);

document.getElementById('snare').addEventListener('click', function(e) {
  snareNode = snare();
  snareNode.connect(context.destination);
  snareNode.start(context.currentTime + 0.01);
  snareNode.gain.value = 0.5;
});
