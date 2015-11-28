(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var context = new AudioContext();
var snare = require('./index');
document.getElementById('snare').addEventListener('click', function(e) {
  snareNode = snare(context);
  snareNode.connect(context.destination);
  snareNode.start(context.currentTime + 0.01);
  snareNode.gain.value = 0.1;
});

},{"./index":1}]},{},[2]);
