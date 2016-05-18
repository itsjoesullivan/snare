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
 *  duration defaults to 0.3
 */
snareNode.duration = 0.2

// Start
snareNode.start(context.currentTime);
```
