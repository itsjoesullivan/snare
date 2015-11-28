module.exports = function(context) {

  var audioNode = context.createGain();
  var masterBus = context.createGain();
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

  // courtesy of http://noisehack.com/generate-noise-web-audio-api/
  var bufferSize = 2 * context.sampleRate;
  var noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  var output = noiseBuffer.getChannelData(0);
  for (var i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  var noise = context.createBufferSource();
  var noiseGain = context.createGain();
  var noiseHighpass = context.createBiquadFilter();
  noiseHighpass.type = "highpass";
  noise.buffer = noiseBuffer;
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
    noiseGain.gain.exponentialRampToValueAtTime(1, when + 0.01);
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
