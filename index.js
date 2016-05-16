var NoiseBuffer = require('noise-buffer');

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64;
  parameters.snappy = typeof parameters.snappy === 'number' ? parameters.snappy : 64;

  var noiseBuffer = NoiseBuffer(1);

  var masterHighBump = context.createBiquadFilter();
  masterHighBump.frequency.value = 4000;
  masterHighBump.gain.value = 6;
  masterHighBump.type = "peaking";
  var masterLowBump = context.createBiquadFilter();
  masterLowBump.frequency.value = 200;
  masterLowBump.gain.value = 12;
  masterLowBump.type = "peaking";
  masterHighBump.connect(masterLowBump);


  var masterBus = context.createGain();
  masterBus.gain.value = 0.4;
  masterBus.connect(masterHighBump);


  var noiseHighpass = context.createBiquadFilter();
  noiseHighpass.type = "highpass";
  noiseHighpass.frequency.value = 1200;
  noiseHighpass.connect(masterBus);


  var oscsHighpass = context.createBiquadFilter();
  oscsHighpass.type = "highpass";
  oscsHighpass.frequency.value = 400;
  oscsHighpass.connect(masterBus);


  return function() {
    var audioNode = context.createGain();
    masterLowBump.connect(audioNode);

    var noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    var noiseGain = context.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(noiseHighpass);

    var oscsGain = context.createGain();
    oscsGain.connect(oscsHighpass);

    var oscs = [87.307, 329.628].map(function(frequency) {
      var osc = context.createOscillator();
      osc.frequency.value = frequency;
      osc.connect(oscsGain);
      return osc;
    });

    audioNode.start = function(when) {
      if (typeof when !== "number") {
        when = context.currentTime;
      }

      noiseGain.gain.setValueAtTime(0.00001, when);
      noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.000001, parameters.snappy / 127), when + 0.01);
      noiseGain.gain.exponentialRampToValueAtTime(0.00001, when + 0.3);
      noiseGain.gain.setValueAtTime(0, when + 0.31);

      oscsGain.gain.setValueAtTime(0.00001, when);
      oscsGain.gain.exponentialRampToValueAtTime(1, when + 0.01);
      oscsGain.gain.exponentialRampToValueAtTime(0.00001, when + 0.2);
      oscsGain.gain.setValueAtTime(0, when + 0.21);

      oscs.forEach(function(osc) {
        osc.start(when);
        osc.stop(when + 0.3);
      });
      var offset = Math.random() * noise.buffer.duration;
      offset = 0;
      noise.start(when, offset);
      noise.stop(when + 0.3);

    };
    audioNode.stop = function(when) {
    };
    return audioNode;
  };
};
