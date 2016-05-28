module.exports = function augmentedOnEnded(triggerNode, fn) {
  var context = triggerNode.context;
  if (context instanceof (window.OfflineAudioContext || window.webkitOfflineAudioContext)) {
    context.suspend().then(function() {
      fn();
      context.resume();
    });
  } else if (context instanceof (window.AudioContext || window.webkitAudioContext)) {
    triggerNode.onended = fn;
  }
}
