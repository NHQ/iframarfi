var gamma = require('gamma');

module.exports = function () {
    setInterval(function () {
        var r = 1 / Math.random() - 1;
        window.parent.postMessage([ r, gamma(r) ]);
    }, 500);
};
