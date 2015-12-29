var Snare = require('./index');
var context = new AudioContext();

document.getElementById('snare').addEventListener('click', function(e) {
  var snare = Snare(context, {
    snappy: parseInt(document.getElementById('snappy').value)
  });
  snareNode = snare();
  snareNode.connect(context.destination);
  snareNode.start(context.currentTime + 0.01);
  snareNode.gain.value = 0.5;
});
