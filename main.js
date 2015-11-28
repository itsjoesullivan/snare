var context = new AudioContext();
var snare = require('./index');
document.getElementById('snare').addEventListener('click', function(e) {
  snareNode = snare(context);
  snareNode.connect(context.destination);
  snareNode.start(context.currentTime + 0.01);
  snareNode.gain.value = 0.1;
});
