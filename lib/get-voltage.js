module.exports = function getVoltage(context) {
  var buffer = context.createBuffer(1, 2, 44100);
  var data = buffer.getChannelData(0);
  data[0] = 1;
  data[1] = 1;
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}
