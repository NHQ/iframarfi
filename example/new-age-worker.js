var iframify = require('../iframify')
var frame = iframify(require('./worker'))
var gamma = require('gamma');

frame.contentWindow.addEventListener('message', function(evt){
  postMessage([evt.data, gamma(evt.data)], '*')
})

