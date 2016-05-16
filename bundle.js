(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var NoiseBuffer = require('noise-buffer');

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64;
  parameters.snappy = typeof parameters.snappy === 'number' ? parameters.snappy : 64;

  var noiseBuffer = NoiseBuffer(1);

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
    noise.buffer = noiseBuffer;
    noise.loop = true;

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

},{"noise-buffer":3}],2:[function(require,module,exports){
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

},{"./index":1}],3:[function(require,module,exports){
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

},{}]},{},[2]);
