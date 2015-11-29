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

// Start
snareNode.start(context.currentTime);
```
