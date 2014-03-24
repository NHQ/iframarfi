var bundler = require('../')
var frame = bundler(require('./worker'))

window.onmessage = function(evt){console.log(evt)}
