var iframify = require('../')
var gamma = require('gamma');

module.exports = function(){
var frame = iframify(require('./worker'))
  frame.contentWindow.addEventListener('message', function(evt){
    postMessage([evt.data, gamma(evt.data)], '*')
  })
}
