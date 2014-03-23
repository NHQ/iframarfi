(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var iframarfi = require('../');

var iframe = iframarfi(require('./worker.js'));

iframe.contentWindow.addEventListener('message', function (ev) {
    console.log(ev.data);
});

},{"../":3,"./worker.js":2}],2:[function(require,module,exports){
var gamma = require('gamma');

module.exports = function () {
    setInterval(function () {
        var r = 1 / Math.random() - 1;
        window.parent.postMessage([ r, gamma(r) ]);
    }, 500);
};

},{"gamma":4}],3:[function(require,module,exports){
var iframe = require('iframe')

var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);
    
    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        if (cache[key].exports === fn) {
            wkey = key;
            break;
        }
    }
    
    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
    
    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'],'require(' + stringify(wkey) + ')(self)'),
        scache
    ];
    
    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
     ;

     var body = '<script type="text/javascript">' + src + '</script>'
   
     var frame = iframe({body: body, sandboxAttributes: ['allow-scripts', 'allow-same-origin']})

    return frame.iframe

};

},{"iframe":5}],4:[function(require,module,exports){
// transliterated from the python snippet here:
// http://en.wikipedia.org/wiki/Lanczos_approximation

var g = 7;
var p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
];

var g_ln = 607/128;
var p_ln = [
    0.99999999999999709182,
    57.156235665862923517,
    -59.597960355475491248,
    14.136097974741747174,
    -0.49191381609762019978,
    0.33994649984811888699e-4,
    0.46523628927048575665e-4,
    -0.98374475304879564677e-4,
    0.15808870322491248884e-3,
    -0.21026444172410488319e-3,
    0.21743961811521264320e-3,
    -0.16431810653676389022e-3,
    0.84418223983852743293e-4,
    -0.26190838401581408670e-4,
    0.36899182659531622704e-5
];

// Spouge approximation (suitable for large arguments)
function lngamma(z) {

    if(z < 0) return Number('0/0');
    var x = p_ln[0];
    for(var i = p_ln.length - 1; i > 0; --i) x += p_ln[i] / (z + i);
    var t = z + g_ln + 0.5;
    return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x)-Math.log(z);
}

module.exports = function gamma (z) {
    if (z < 0.5) {
        return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    }
    else if(z > 100) return Math.exp(lngamma(z));
    else {
        z -= 1;
        var x = p[0];
        for (var i = 1; i < g + 2; i++) {
            x += p[i] / (z + i);
        }
        var t = z + g + 0.5;

        return Math.sqrt(2 * Math.PI)
            * Math.pow(t, z + 0.5)
            * Math.exp(-t)
            * x
        ;
    }
};

module.exports.log = lngamma;

},{}],5:[function(require,module,exports){
module.exports = function(opts) {
  return new IFrame(opts)
}

function IFrame(opts) {
  if (!opts) opts = {}
  this.opts = opts
  this.container = opts.container || document.body
  this.setHTML(opts)
}

IFrame.prototype.parseHTMLOptions = function(opts) {
  if (typeof opts === 'string') opts = {html: opts}
  if (!opts) opts = {}
  if (opts.body || opts.head) {
    if (!opts.body) opts.body = ""
    if (!opts.head) opts.head = ""
    opts.html = '<!DOCTYPE html><html><head>' + opts.head + '</head><body>' + opts.body + '</body></html>'
  }
  if (!opts.sandboxAttributes) opts.sandboxAttributes = ['allow-scripts']
  return opts
}

IFrame.prototype.remove = function() {
  if (this.iframe) this.container.removeChild(this.iframe)
}

IFrame.prototype.setHTML = function(opts) {
  opts = this.parseHTMLOptions(opts)
  if (!opts.html) return
  this.remove()
  // create temporary iframe for generating HTML string
  // element is inserted into the DOM as a string so that the security policies do not interfere
  // see: https://gist.github.com/kumavis/8202447
  var tempIframe = document.createElement('iframe')
  tempIframe.setAttribute('scrolling', this.opts.scrollingDisabled ? 'no' : 'yes')
  tempIframe.style.width = '100%'
  tempIframe.style.height = '100%'
  tempIframe.style.border = '0'
  tempIframe.sandbox = opts.sandboxAttributes.join(' ')
  // create a blob for opts.html and set as iframe `src` attribute
  var blob = new Blob([opts.html], { type: 'text/html;charset=UTF-8' })
  var U = typeof URL !== 'undefined' ? URL : webkitURL
  var targetUrl = U.createObjectURL(blob)
  tempIframe.src = targetUrl
  // generate HTML string
  var htmlSrc = tempIframe.outerHTML
  // insert HTML into container
  this.container.insertAdjacentHTML('beforeend', htmlSrc)
  // retrieve created iframe from DOM
  var neighborIframes = this.container.querySelectorAll('iframe')
  this.iframe = neighborIframes[neighborIframes.length-1]
}

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9uaHEvZGV2ZWxvcG1lbnQvaWZyYW1hcmZpL2V4YW1wbGUvbWFpbi5qcyIsIi9ob21lL25ocS9kZXZlbG9wbWVudC9pZnJhbWFyZmkvZXhhbXBsZS93b3JrZXIuanMiLCIvaG9tZS9uaHEvZGV2ZWxvcG1lbnQvaWZyYW1hcmZpL2luZGV4LmpzIiwiL2hvbWUvbmhxL2RldmVsb3BtZW50L2lmcmFtYXJmaS9ub2RlX21vZHVsZXMvZ2FtbWEvaW5kZXguanMiLCIvaG9tZS9uaHEvZGV2ZWxvcG1lbnQvaWZyYW1hcmZpL25vZGVfbW9kdWxlcy9pZnJhbWUvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBpZnJhbWFyZmkgPSByZXF1aXJlKCcuLi8nKTtcblxudmFyIGlmcmFtZSA9IGlmcmFtYXJmaShyZXF1aXJlKCcuL3dvcmtlci5qcycpKTtcblxuaWZyYW1lLmNvbnRlbnRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgIGNvbnNvbGUubG9nKGV2LmRhdGEpO1xufSk7XG4iLCJ2YXIgZ2FtbWEgPSByZXF1aXJlKCdnYW1tYScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByID0gMSAvIE1hdGgucmFuZG9tKCkgLSAxO1xuICAgICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKFsgciwgZ2FtbWEocikgXSk7XG4gICAgfSwgNTAwKTtcbn07XG4iLCJ2YXIgaWZyYW1lID0gcmVxdWlyZSgnaWZyYW1lJylcblxudmFyIGJ1bmRsZUZuID0gYXJndW1lbnRzWzNdO1xudmFyIHNvdXJjZXMgPSBhcmd1bWVudHNbNF07XG52YXIgY2FjaGUgPSBhcmd1bWVudHNbNV07XG5cbnZhciBzdHJpbmdpZnkgPSBKU09OLnN0cmluZ2lmeTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIHZhciB3a2V5O1xuICAgIHZhciBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG4gICAgXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIGlmIChjYWNoZVtrZXldLmV4cG9ydHMgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKCF3a2V5KSB7XG4gICAgICAgIHdrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgdmFyIHdjYWNoZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgICAgICB3Y2FjaGVba2V5XSA9IGtleTtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2VzW3drZXldID0gW1xuICAgICAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJywnbW9kdWxlJywnZXhwb3J0cyddLCAnKCcgKyBmbiArICcpKHNlbGYpJyksXG4gICAgICAgICAgICB3Y2FjaGVcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHNrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICBcbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sJ3JlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpKHNlbGYpJyksXG4gICAgICAgIHNjYWNoZVxuICAgIF07XG4gICAgXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICAgO1xuXG4gICAgIHZhciBib2R5ID0gJzxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPicgKyBzcmMgKyAnPC9zY3JpcHQ+J1xuICAgXG4gICAgIHZhciBmcmFtZSA9IGlmcmFtZSh7Ym9keTogYm9keSwgc2FuZGJveEF0dHJpYnV0ZXM6IFsnYWxsb3ctc2NyaXB0cycsICdhbGxvdy1zYW1lLW9yaWdpbiddfSlcblxuICAgIHJldHVybiBmcmFtZS5pZnJhbWVcblxufTtcbiIsIi8vIHRyYW5zbGl0ZXJhdGVkIGZyb20gdGhlIHB5dGhvbiBzbmlwcGV0IGhlcmU6XG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xhbmN6b3NfYXBwcm94aW1hdGlvblxuXG52YXIgZyA9IDc7XG52YXIgcCA9IFtcbiAgICAwLjk5OTk5OTk5OTk5OTgwOTkzLFxuICAgIDY3Ni41MjAzNjgxMjE4ODUxLFxuICAgIC0xMjU5LjEzOTIxNjcyMjQwMjgsXG4gICAgNzcxLjMyMzQyODc3NzY1MzEzLFxuICAgIC0xNzYuNjE1MDI5MTYyMTQwNTksXG4gICAgMTIuNTA3MzQzMjc4Njg2OTA1LFxuICAgIC0wLjEzODU3MTA5NTI2NTcyMDEyLFxuICAgIDkuOTg0MzY5NTc4MDE5NTcxNmUtNixcbiAgICAxLjUwNTYzMjczNTE0OTMxMTZlLTdcbl07XG5cbnZhciBnX2xuID0gNjA3LzEyODtcbnZhciBwX2xuID0gW1xuICAgIDAuOTk5OTk5OTk5OTk5OTk3MDkxODIsXG4gICAgNTcuMTU2MjM1NjY1ODYyOTIzNTE3LFxuICAgIC01OS41OTc5NjAzNTU0NzU0OTEyNDgsXG4gICAgMTQuMTM2MDk3OTc0NzQxNzQ3MTc0LFxuICAgIC0wLjQ5MTkxMzgxNjA5NzYyMDE5OTc4LFxuICAgIDAuMzM5OTQ2NDk5ODQ4MTE4ODg2OTllLTQsXG4gICAgMC40NjUyMzYyODkyNzA0ODU3NTY2NWUtNCxcbiAgICAtMC45ODM3NDQ3NTMwNDg3OTU2NDY3N2UtNCxcbiAgICAwLjE1ODA4ODcwMzIyNDkxMjQ4ODg0ZS0zLFxuICAgIC0wLjIxMDI2NDQ0MTcyNDEwNDg4MzE5ZS0zLFxuICAgIDAuMjE3NDM5NjE4MTE1MjEyNjQzMjBlLTMsXG4gICAgLTAuMTY0MzE4MTA2NTM2NzYzODkwMjJlLTMsXG4gICAgMC44NDQxODIyMzk4Mzg1Mjc0MzI5M2UtNCxcbiAgICAtMC4yNjE5MDgzODQwMTU4MTQwODY3MGUtNCxcbiAgICAwLjM2ODk5MTgyNjU5NTMxNjIyNzA0ZS01XG5dO1xuXG4vLyBTcG91Z2UgYXBwcm94aW1hdGlvbiAoc3VpdGFibGUgZm9yIGxhcmdlIGFyZ3VtZW50cylcbmZ1bmN0aW9uIGxuZ2FtbWEoeikge1xuXG4gICAgaWYoeiA8IDApIHJldHVybiBOdW1iZXIoJzAvMCcpO1xuICAgIHZhciB4ID0gcF9sblswXTtcbiAgICBmb3IodmFyIGkgPSBwX2xuLmxlbmd0aCAtIDE7IGkgPiAwOyAtLWkpIHggKz0gcF9sbltpXSAvICh6ICsgaSk7XG4gICAgdmFyIHQgPSB6ICsgZ19sbiArIDAuNTtcbiAgICByZXR1cm4gLjUqTWF0aC5sb2coMipNYXRoLlBJKSsoeisuNSkqTWF0aC5sb2codCktdCtNYXRoLmxvZyh4KS1NYXRoLmxvZyh6KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnYW1tYSAoeikge1xuICAgIGlmICh6IDwgMC41KSB7XG4gICAgICAgIHJldHVybiBNYXRoLlBJIC8gKE1hdGguc2luKE1hdGguUEkgKiB6KSAqIGdhbW1hKDEgLSB6KSk7XG4gICAgfVxuICAgIGVsc2UgaWYoeiA+IDEwMCkgcmV0dXJuIE1hdGguZXhwKGxuZ2FtbWEoeikpO1xuICAgIGVsc2Uge1xuICAgICAgICB6IC09IDE7XG4gICAgICAgIHZhciB4ID0gcFswXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBnICsgMjsgaSsrKSB7XG4gICAgICAgICAgICB4ICs9IHBbaV0gLyAoeiArIGkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0ID0geiArIGcgKyAwLjU7XG5cbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgyICogTWF0aC5QSSlcbiAgICAgICAgICAgICogTWF0aC5wb3codCwgeiArIDAuNSlcbiAgICAgICAgICAgICogTWF0aC5leHAoLXQpXG4gICAgICAgICAgICAqIHhcbiAgICAgICAgO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLmxvZyA9IGxuZ2FtbWE7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgcmV0dXJuIG5ldyBJRnJhbWUob3B0cylcbn1cblxuZnVuY3Rpb24gSUZyYW1lKG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge31cbiAgdGhpcy5vcHRzID0gb3B0c1xuICB0aGlzLmNvbnRhaW5lciA9IG9wdHMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHlcbiAgdGhpcy5zZXRIVE1MKG9wdHMpXG59XG5cbklGcmFtZS5wcm90b3R5cGUucGFyc2VIVE1MT3B0aW9ucyA9IGZ1bmN0aW9uKG9wdHMpIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnc3RyaW5nJykgb3B0cyA9IHtodG1sOiBvcHRzfVxuICBpZiAoIW9wdHMpIG9wdHMgPSB7fVxuICBpZiAob3B0cy5ib2R5IHx8IG9wdHMuaGVhZCkge1xuICAgIGlmICghb3B0cy5ib2R5KSBvcHRzLmJvZHkgPSBcIlwiXG4gICAgaWYgKCFvcHRzLmhlYWQpIG9wdHMuaGVhZCA9IFwiXCJcbiAgICBvcHRzLmh0bWwgPSAnPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+JyArIG9wdHMuaGVhZCArICc8L2hlYWQ+PGJvZHk+JyArIG9wdHMuYm9keSArICc8L2JvZHk+PC9odG1sPidcbiAgfVxuICBpZiAoIW9wdHMuc2FuZGJveEF0dHJpYnV0ZXMpIG9wdHMuc2FuZGJveEF0dHJpYnV0ZXMgPSBbJ2FsbG93LXNjcmlwdHMnXVxuICByZXR1cm4gb3B0c1xufVxuXG5JRnJhbWUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pZnJhbWUpIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuaWZyYW1lKVxufVxuXG5JRnJhbWUucHJvdG90eXBlLnNldEhUTUwgPSBmdW5jdGlvbihvcHRzKSB7XG4gIG9wdHMgPSB0aGlzLnBhcnNlSFRNTE9wdGlvbnMob3B0cylcbiAgaWYgKCFvcHRzLmh0bWwpIHJldHVyblxuICB0aGlzLnJlbW92ZSgpXG4gIC8vIGNyZWF0ZSB0ZW1wb3JhcnkgaWZyYW1lIGZvciBnZW5lcmF0aW5nIEhUTUwgc3RyaW5nXG4gIC8vIGVsZW1lbnQgaXMgaW5zZXJ0ZWQgaW50byB0aGUgRE9NIGFzIGEgc3RyaW5nIHNvIHRoYXQgdGhlIHNlY3VyaXR5IHBvbGljaWVzIGRvIG5vdCBpbnRlcmZlcmVcbiAgLy8gc2VlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9rdW1hdmlzLzgyMDI0NDdcbiAgdmFyIHRlbXBJZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKVxuICB0ZW1wSWZyYW1lLnNldEF0dHJpYnV0ZSgnc2Nyb2xsaW5nJywgdGhpcy5vcHRzLnNjcm9sbGluZ0Rpc2FibGVkID8gJ25vJyA6ICd5ZXMnKVxuICB0ZW1wSWZyYW1lLnN0eWxlLndpZHRoID0gJzEwMCUnXG4gIHRlbXBJZnJhbWUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnXG4gIHRlbXBJZnJhbWUuc3R5bGUuYm9yZGVyID0gJzAnXG4gIHRlbXBJZnJhbWUuc2FuZGJveCA9IG9wdHMuc2FuZGJveEF0dHJpYnV0ZXMuam9pbignICcpXG4gIC8vIGNyZWF0ZSBhIGJsb2IgZm9yIG9wdHMuaHRtbCBhbmQgc2V0IGFzIGlmcmFtZSBgc3JjYCBhdHRyaWJ1dGVcbiAgdmFyIGJsb2IgPSBuZXcgQmxvYihbb3B0cy5odG1sXSwgeyB0eXBlOiAndGV4dC9odG1sO2NoYXJzZXQ9VVRGLTgnIH0pXG4gIHZhciBVID0gdHlwZW9mIFVSTCAhPT0gJ3VuZGVmaW5lZCcgPyBVUkwgOiB3ZWJraXRVUkxcbiAgdmFyIHRhcmdldFVybCA9IFUuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXG4gIHRlbXBJZnJhbWUuc3JjID0gdGFyZ2V0VXJsXG4gIC8vIGdlbmVyYXRlIEhUTUwgc3RyaW5nXG4gIHZhciBodG1sU3JjID0gdGVtcElmcmFtZS5vdXRlckhUTUxcbiAgLy8gaW5zZXJ0IEhUTUwgaW50byBjb250YWluZXJcbiAgdGhpcy5jb250YWluZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBodG1sU3JjKVxuICAvLyByZXRyaWV2ZSBjcmVhdGVkIGlmcmFtZSBmcm9tIERPTVxuICB2YXIgbmVpZ2hib3JJZnJhbWVzID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lJylcbiAgdGhpcy5pZnJhbWUgPSBuZWlnaGJvcklmcmFtZXNbbmVpZ2hib3JJZnJhbWVzLmxlbmd0aC0xXVxufVxuIl19
