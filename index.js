var NoiseBuffer = require('noise-buffer');

// todo: make a module
function getVoltage(context) {
  var buffer = context.createBuffer(1, 2, 44100);
  var data = buffer.getChannelData(0);
  data[0] = 1;
  data[1] = 1;
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

module.exports = function(context, parameters) {

  var playingNodes = [];


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


    var noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;


    var snappyGainNode = context.createGain();
    snappyGainNode.gain.value = 1;
    audioNode.snappy = snappyGainNode.gain;


    var noiseGain = context.createGain();
    noise.connect(snappyGainNode);
    snappyGainNode.connect(noiseGain);
    noiseGain.connect(noiseHighpass);



    var oscsGain = context.createGain();
    oscsGain.connect(oscsHighpass);

    var voltage = getVoltage(context);
    var detuneGainNode = context.createGain();
    detuneGainNode.gain.value = 0;
    audioNode.detune = detuneGainNode.gain;
    voltage.connect(detuneGainNode);

    /*
    // Hmm... how should these respond to tuning?
    detuneGainNode.connect(noiseHighpass.detune)
    detuneGainNode.connect(oscsHighpass.detune)
    detuneGainNode.connect(masterHighBump.detune)
    detuneGainNode.connect(masterLowBump.detune);
    */


    var oscs = [87.307, 329.628].map(function(frequency) {
      var osc = context.createOscillator();
      osc.frequency.value = frequency;
      //osc.connect(oscsGain);
      detuneGainNode.connect(osc.detune);
      return osc;
    });

    var toneNode = context.createGain();
    toneNode.gain.value = 0.5;
    voltage.connect(toneNode);

    audioNode.tone = toneNode.gain;

    var oscAGainNode = context.createGain();
    var oscBGainNode = context.createGain();

    oscAGainNode.gain.value = -1;
    oscBGainNode.gain.value = 0;

    oscs[0].connect(oscAGainNode);
    oscs[1].connect(oscBGainNode);

    toneNode.connect(oscAGainNode.gain);
    toneNode.connect(oscBGainNode.gain);

    oscAGainNode.connect(oscsGain);
    oscBGainNode.connect(oscsGain);

    masterLowBump.connect(audioNode);

    audioNode.duration = 0.3;

    audioNode.start = function(when) {

      // each Snare instance is monophonic
      while (playingNodes.length) {
        playingNodes.pop().stop(when);
      }
      playingNodes.push(audioNode);

      if (typeof when !== "number") {
        when = context.currentTime;
      }

      noiseGain.gain.setValueAtTime(0.0001, when);
      noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 1),
                                                  when + Math.min(audioNode.duration * (0.01 / 0.3), 0.01));
      noiseGain.gain.exponentialRampToValueAtTime(0.0001,
                                                  when + audioNode.duration);

      oscsGain.gain.setValueAtTime(0.0001, when);
      oscsGain.gain.exponentialRampToValueAtTime(1,
                                                 when + Math.min(0.01, audioNode.duration * (0.01 / 0.3)));
      oscsGain.gain.exponentialRampToValueAtTime(0.00001,
                                                 when + audioNode.duration * 2/3);

      oscs.forEach(function(osc) {
        osc.start(when);
        osc.stop(when + audioNode.duration);
      });

      noise.start(when);
      noise.stop(when + audioNode.duration);

      voltage.start(when);
      voltage.stop(when + audioNode.duration);

    };
    audioNode.stop = function(when) {
      // Do not stop twice
      audioNode.stop = function() {};
      audioNode.gain.setValueAtTime(1, when);
      audioNode.gain.linearRampToValueAtTime(0, when + 0.01);
      try {
        oscs.forEach(function(osc) {
          osc.stop(when + 0.01);
        });
        noise.stop(when + 0.01);
        voltage.stop(when + 0.01);
      } catch (e) {
        // likely already stopped
      }
    };
    return audioNode;
  };
};
