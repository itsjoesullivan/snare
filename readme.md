##Usage

`npm install --save snare`

```javascript
var snare = require('snare');

// Initialize AudioContext
var context = new AudioContext();

// Create snare audio node (one time use only)
var snareNode = snare(context);

// Connect to target node
snareNode.connect(context.destination);

// Start
snareNode.start(context.currentTime);
```
