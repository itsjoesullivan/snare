var Snare = require('../index');
var snare;

var ct = 0;

window.reset = function reset() {
  if (window.context) {
    window.context.close();
  }
  var context = new AudioContext();
  window.context = context;
  snare = Snare(context);
}
reset();

document.getElementById('play').addEventListener('click', function(e) {
  if (ct % 100 === 0) {
    console.log(ct);
  }
  ct++;

  /*
  var osc = context.createOscillator();
  osc.connect(context.destination);
  osc.start(context.currentTime);
  osc.stop(context.currentTime + 0.03);
  */
  var snareNode = snare();

  snareNode.detune.value = parseInt(document.getElementById('detune').value);
  snareNode.duration = parseFloat(document.getElementById('duration').value);
  snareNode.snappy.value = parseFloat(document.getElementById('snappy').value);
  snareNode.tone.value = parseFloat(document.getElementById('tone').value);

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
    }, 70);
    document.getElementById('play').click();
  }
});
