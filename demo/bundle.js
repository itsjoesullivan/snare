(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../index":2}],2:[function(require,module,exports){
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


    var noiseGain = context.createGain();
    noise.connect(noiseGain);
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
      osc.connect(oscsGain);
      detuneGainNode.connect(osc.detune);
      return osc;
    });

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
      noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, parameters.snappy / 127),
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

},{"noise-buffer":3}],3:[function(require,module,exports){
// courtesy of http://noisehack.com/generate-noise-web-audio-api/
module.exports = function(length, type) {
  type = type || 'white';

  var sampleRate = 44100;
  var samples = length * sampleRate;
  var context = new OfflineAudioContext(1, samples, sampleRate);
  var noiseBuffer = context.createBuffer(1, samples, sampleRate);
  var output = noiseBuffer.getChannelData(0);

  switch(type) {
    case 'white':
      // http://noisehack.com/generate-noise-web-audio-api/
      for (var i = 0; i < samples; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      break;
    case 'pink':
      // just completely http://noisehack.com/generate-noise-web-audio-api/
      var b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      for (var i = 0; i < samples; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
      }
      break;
    case 'brown':
      // just completely http://noisehack.com/generate-noise-web-audio-api/
      var lastOut = 0.0;
      for (var i = 0; i < samples; i++) {
        var white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // (roughly) compensate for gain
      }
      break;
  }

  return noiseBuffer;
};

},{}]},{},[1]);
