var bundler = require('../')
var frame = bundler(require('./new-age-worker'))

frame.contentWindow.addEventListener('message', function(evt){console.log(evt)})
