var iframarfi = require('../');

var iframe = iframarfi(require('./worker.js'));

iframe.contentWindow.addEventListener('message', function (ev) {
    console.log(ev.data);
});
