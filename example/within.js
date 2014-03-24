var bundler = require('../iframify')
var frame = bundler(require('./new-age-worker'))

frame.contentWindow.addEventListener('message', function(evt){console.log(evt)})
