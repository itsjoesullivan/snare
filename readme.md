##Usage

`npm install --save-dev snare`

```javascript
var snare = require('snare');

// Initialize AudioContext
var context = new AudioContext();

// Create snare audio node (one time use only)
var snareNode = snare(context);

// Connect to target node
snare.connect(context.destination);

// Start
snare.start(context.currentTime);
```