var NoiseBuffer = require('noise-buffer');

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64;
  parameters.snappy = typeof parameters.snappy === 'number' ? parameters.snappy : 64;

  return function() {
    var audioNode = context.createGain();
    var masterBus = context.createGain();
    masterBus.gain.value = 0.4;
    var masterHighBump = context.createBiquadFilter();
    masterHighBump.type = "peaking";
    var masterLowBump = context.createBiquadFilter();
    masterLowBump.type = "peaking";
    masterBus.connect(masterHighBump);
    masterHighBump.connect(masterLowBump);
    masterLowBump.connect(audioNode);
    masterHighBump.frequency.value = 4000;
    masterLowBump.frequency.value = 200;
    masterHighBump.gain.value = 6;
    masterLowBump.gain.value = 12;

    var noise = context.createBufferSource();
    noise.buffer = NoiseBuffer(1);

    var noiseGain = context.createGain();
    var noiseHighpass = context.createBiquadFilter();
    noiseHighpass.type = "highpass";
    noise.connect(noiseGain);
    noiseGain.connect(noiseHighpass);
    noiseHighpass.connect(masterBus);
    noiseHighpass.frequency.value = 1200;

    var oscsGain = context.createGain();
    var oscsHighpass = context.createBiquadFilter();
    oscsGain.connect(oscsHighpass);
    oscsHighpass.type = "highpass";
    oscsHighpass.frequency.value = 400;
    oscsHighpass.connect(masterBus);

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
      noise.start(when);

      oscsGain.gain.setValueAtTime(0.00001, when);
      oscsGain.gain.exponentialRampToValueAtTime(1, when + 0.01);
      oscsGain.gain.exponentialRampToValueAtTime(0.00001, when + 0.2);

      oscs.forEach(function(osc) {
        osc.start(when);
      });
    };
    audioNode.stop = function(when) {
      noise.stop(when);
    };
    return audioNode;
  };
};
