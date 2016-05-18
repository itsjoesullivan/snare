##Usage

`npm install --save snare`

```javascript
var Snare = require('snare');

// Initialize AudioContext
var context = new AudioContext();

// Initialize instrument
var snare = Snare(context);

// Create snare audio node (one time use only)
var snareNode = snare();

// Connect to target node
snareNode.connect(context.destination);

/*
 *  detune is connected to the oscillators' detune
 */
snareNode.detune instanceof AudioParam
// -> true
snareNode.detune.value = 1200;

/*
 *  snappy controls the gain of the noise
 */
snareNode.snappy instanceof AudioParam
// -> true
snareNode.snappy.value = 0.75

/*
 *  tone controls the mix between low and high tones
 */
snareNode.tone instanceof AudioParam
// -> true
snareNode.tone.value = 0.5

/*
 *  duration defaults to 0.3
 */
snareNode.duration = 0.2

// Start
snareNode.start(context.currentTime);
```
