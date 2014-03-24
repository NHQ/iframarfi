(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var iframify = require('../iframify')
var frame = iframify(require('./worker'))
var gamma = require('gamma');

frame.contentWindow.addEventListener('message', function(evt){
  postMessage([evt.data, gamma(evt.data)], '*')
})


},{"../iframify":4,"./worker":3,"gamma":5}],2:[function(require,module,exports){
var bundler = require('../iframify')
var frame = bundler(require('./new-age-worker'))

frame.contentWindow.addEventListener('message', function(evt){console.log(evt)})

},{"../iframify":4,"./new-age-worker":1}],3:[function(require,module,exports){
var gamma = require('gamma');

module.exports = function(){
setInterval(function () {
    var r = 1 / Math.random() - 1;
    window.postMessage(gamma(r), '*');
}, 500);
}

},{"gamma":5}],4:[function(require,module,exports){
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
    
    src = window.URL.createObjectURL(new Blob([src], {type:'text/javascript'}))
    src = '<script type=text/javascript src='+src+'></script>'
    var frame = iframe({body: src, sandboxAttributes: ['allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-popups', 'allow-pointer-lock']})
    return frame.iframe
};

},{"iframe":6}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9uaHEvZGV2ZWxvcG1lbnQvaWZyYW1hcmZpL2V4YW1wbGUvbmV3LWFnZS13b3JrZXIuanMiLCIvaG9tZS9uaHEvZGV2ZWxvcG1lbnQvaWZyYW1hcmZpL2V4YW1wbGUvd2l0aGluLmpzIiwiL2hvbWUvbmhxL2RldmVsb3BtZW50L2lmcmFtYXJmaS9leGFtcGxlL3dvcmtlci5qcyIsIi9ob21lL25ocS9kZXZlbG9wbWVudC9pZnJhbWFyZmkvaWZyYW1pZnkuanMiLCIvaG9tZS9uaHEvZGV2ZWxvcG1lbnQvaWZyYW1hcmZpL25vZGVfbW9kdWxlcy9nYW1tYS9pbmRleC5qcyIsIi9ob21lL25ocS9kZXZlbG9wbWVudC9pZnJhbWFyZmkvbm9kZV9tb2R1bGVzL2lmcmFtZS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBpZnJhbWlmeSA9IHJlcXVpcmUoJy4uL2lmcmFtaWZ5JylcbnZhciBmcmFtZSA9IGlmcmFtaWZ5KHJlcXVpcmUoJy4vd29ya2VyJykpXG52YXIgZ2FtbWEgPSByZXF1aXJlKCdnYW1tYScpO1xuXG5mcmFtZS5jb250ZW50V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihldnQpe1xuICBwb3N0TWVzc2FnZShbZXZ0LmRhdGEsIGdhbW1hKGV2dC5kYXRhKV0sICcqJylcbn0pXG5cbiIsInZhciBidW5kbGVyID0gcmVxdWlyZSgnLi4vaWZyYW1pZnknKVxudmFyIGZyYW1lID0gYnVuZGxlcihyZXF1aXJlKCcuL25ldy1hZ2Utd29ya2VyJykpXG5cbmZyYW1lLmNvbnRlbnRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGV2dCl7Y29uc29sZS5sb2coZXZ0KX0pXG4iLCJ2YXIgZ2FtbWEgPSByZXF1aXJlKCdnYW1tYScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XG5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHIgPSAxIC8gTWF0aC5yYW5kb20oKSAtIDE7XG4gICAgd2luZG93LnBvc3RNZXNzYWdlKGdhbW1hKHIpLCAnKicpO1xufSwgNTAwKTtcbn1cbiIsInZhciBpZnJhbWUgPSByZXF1aXJlKCdpZnJhbWUnKVxuXG52YXIgYnVuZGxlRm4gPSBhcmd1bWVudHNbM107XG52YXIgc291cmNlcyA9IGFyZ3VtZW50c1s0XTtcbnZhciBjYWNoZSA9IGFyZ3VtZW50c1s1XTtcbnZhciBzdHJpbmdpZnkgPSBKU09OLnN0cmluZ2lmeTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIHZhciB3a2V5O1xuICAgIHZhciBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG4gICAgXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjYWNoZUtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgIGlmIChjYWNoZVtrZXldLmV4cG9ydHMgPT09IGZuKSB7XG4gICAgICAgICAgICB3a2V5ID0ga2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKCF3a2V5KSB7XG4gICAgICAgIHdrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgdmFyIHdjYWNoZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgICAgICB3Y2FjaGVba2V5XSA9IGtleTtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2VzW3drZXldID0gW1xuICAgICAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJywnbW9kdWxlJywnZXhwb3J0cyddLCAnKCcgKyBmbiArICcpKHNlbGYpJyksXG4gICAgICAgICAgICB3Y2FjaGVcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHNrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICBcbiAgICB2YXIgc2NhY2hlID0ge307IHNjYWNoZVt3a2V5XSA9IHdrZXk7XG4gICAgc291cmNlc1tza2V5XSA9IFtcbiAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJ10sJ3JlcXVpcmUoJyArIHN0cmluZ2lmeSh3a2V5KSArICcpKHNlbGYpJyksXG4gICAgICAgIHNjYWNoZVxuICAgIF07XG4gICAgXG4gICAgdmFyIHNyYyA9ICcoJyArIGJ1bmRsZUZuICsgJykoeydcbiAgICAgICAgKyBPYmplY3Qua2V5cyhzb3VyY2VzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZ2lmeShrZXkpICsgJzpbJ1xuICAgICAgICAgICAgICAgICsgc291cmNlc1trZXldWzBdXG4gICAgICAgICAgICAgICAgKyAnLCcgKyBzdHJpbmdpZnkoc291cmNlc1trZXldWzFdKSArICddJ1xuICAgICAgICAgICAgO1xuICAgICAgICB9KS5qb2luKCcsJylcbiAgICAgICAgKyAnfSx7fSxbJyArIHN0cmluZ2lmeShza2V5KSArICddKSdcbiAgICAgO1xuICAgIFxuICAgIHNyYyA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtzcmNdLCB7dHlwZTondGV4dC9qYXZhc2NyaXB0J30pKVxuICAgIHNyYyA9ICc8c2NyaXB0IHR5cGU9dGV4dC9qYXZhc2NyaXB0IHNyYz0nK3NyYysnPjwvc2NyaXB0PidcbiAgICB2YXIgZnJhbWUgPSBpZnJhbWUoe2JvZHk6IHNyYywgc2FuZGJveEF0dHJpYnV0ZXM6IFsnYWxsb3ctc2NyaXB0cycsICdhbGxvdy1zYW1lLW9yaWdpbicsICdhbGxvdy1mb3JtcycsICdhbGxvdy1wb3B1cHMnLCAnYWxsb3ctcG9pbnRlci1sb2NrJ119KVxuICAgIHJldHVybiBmcmFtZS5pZnJhbWVcbn07XG4iLCIvLyB0cmFuc2xpdGVyYXRlZCBmcm9tIHRoZSBweXRob24gc25pcHBldCBoZXJlOlxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MYW5jem9zX2FwcHJveGltYXRpb25cblxudmFyIGcgPSA3O1xudmFyIHAgPSBbXG4gICAgMC45OTk5OTk5OTk5OTk4MDk5MyxcbiAgICA2NzYuNTIwMzY4MTIxODg1MSxcbiAgICAtMTI1OS4xMzkyMTY3MjI0MDI4LFxuICAgIDc3MS4zMjM0Mjg3Nzc2NTMxMyxcbiAgICAtMTc2LjYxNTAyOTE2MjE0MDU5LFxuICAgIDEyLjUwNzM0MzI3ODY4NjkwNSxcbiAgICAtMC4xMzg1NzEwOTUyNjU3MjAxMixcbiAgICA5Ljk4NDM2OTU3ODAxOTU3MTZlLTYsXG4gICAgMS41MDU2MzI3MzUxNDkzMTE2ZS03XG5dO1xuXG52YXIgZ19sbiA9IDYwNy8xMjg7XG52YXIgcF9sbiA9IFtcbiAgICAwLjk5OTk5OTk5OTk5OTk5NzA5MTgyLFxuICAgIDU3LjE1NjIzNTY2NTg2MjkyMzUxNyxcbiAgICAtNTkuNTk3OTYwMzU1NDc1NDkxMjQ4LFxuICAgIDE0LjEzNjA5Nzk3NDc0MTc0NzE3NCxcbiAgICAtMC40OTE5MTM4MTYwOTc2MjAxOTk3OCxcbiAgICAwLjMzOTk0NjQ5OTg0ODExODg4Njk5ZS00LFxuICAgIDAuNDY1MjM2Mjg5MjcwNDg1NzU2NjVlLTQsXG4gICAgLTAuOTgzNzQ0NzUzMDQ4Nzk1NjQ2NzdlLTQsXG4gICAgMC4xNTgwODg3MDMyMjQ5MTI0ODg4NGUtMyxcbiAgICAtMC4yMTAyNjQ0NDE3MjQxMDQ4ODMxOWUtMyxcbiAgICAwLjIxNzQzOTYxODExNTIxMjY0MzIwZS0zLFxuICAgIC0wLjE2NDMxODEwNjUzNjc2Mzg5MDIyZS0zLFxuICAgIDAuODQ0MTgyMjM5ODM4NTI3NDMyOTNlLTQsXG4gICAgLTAuMjYxOTA4Mzg0MDE1ODE0MDg2NzBlLTQsXG4gICAgMC4zNjg5OTE4MjY1OTUzMTYyMjcwNGUtNVxuXTtcblxuLy8gU3BvdWdlIGFwcHJveGltYXRpb24gKHN1aXRhYmxlIGZvciBsYXJnZSBhcmd1bWVudHMpXG5mdW5jdGlvbiBsbmdhbW1hKHopIHtcblxuICAgIGlmKHogPCAwKSByZXR1cm4gTnVtYmVyKCcwLzAnKTtcbiAgICB2YXIgeCA9IHBfbG5bMF07XG4gICAgZm9yKHZhciBpID0gcF9sbi5sZW5ndGggLSAxOyBpID4gMDsgLS1pKSB4ICs9IHBfbG5baV0gLyAoeiArIGkpO1xuICAgIHZhciB0ID0geiArIGdfbG4gKyAwLjU7XG4gICAgcmV0dXJuIC41Kk1hdGgubG9nKDIqTWF0aC5QSSkrKHorLjUpKk1hdGgubG9nKHQpLXQrTWF0aC5sb2coeCktTWF0aC5sb2coeik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2FtbWEgKHopIHtcbiAgICBpZiAoeiA8IDAuNSkge1xuICAgICAgICByZXR1cm4gTWF0aC5QSSAvIChNYXRoLnNpbihNYXRoLlBJICogeikgKiBnYW1tYSgxIC0geikpO1xuICAgIH1cbiAgICBlbHNlIGlmKHogPiAxMDApIHJldHVybiBNYXRoLmV4cChsbmdhbW1hKHopKTtcbiAgICBlbHNlIHtcbiAgICAgICAgeiAtPSAxO1xuICAgICAgICB2YXIgeCA9IHBbMF07XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgZyArIDI7IGkrKykge1xuICAgICAgICAgICAgeCArPSBwW2ldIC8gKHogKyBpKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdCA9IHogKyBnICsgMC41O1xuXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoMiAqIE1hdGguUEkpXG4gICAgICAgICAgICAqIE1hdGgucG93KHQsIHogKyAwLjUpXG4gICAgICAgICAgICAqIE1hdGguZXhwKC10KVxuICAgICAgICAgICAgKiB4XG4gICAgICAgIDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5sb2cgPSBsbmdhbW1hO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIHJldHVybiBuZXcgSUZyYW1lKG9wdHMpXG59XG5cbmZ1bmN0aW9uIElGcmFtZShvcHRzKSB7XG4gIGlmICghb3B0cykgb3B0cyA9IHt9XG4gIHRoaXMub3B0cyA9IG9wdHNcbiAgdGhpcy5jb250YWluZXIgPSBvcHRzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5XG4gIHRoaXMuc2V0SFRNTChvcHRzKVxufVxuXG5JRnJhbWUucHJvdG90eXBlLnBhcnNlSFRNTE9wdGlvbnMgPSBmdW5jdGlvbihvcHRzKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIG9wdHMgPSB7aHRtbDogb3B0c31cbiAgaWYgKCFvcHRzKSBvcHRzID0ge31cbiAgaWYgKG9wdHMuYm9keSB8fCBvcHRzLmhlYWQpIHtcbiAgICBpZiAoIW9wdHMuYm9keSkgb3B0cy5ib2R5ID0gXCJcIlxuICAgIGlmICghb3B0cy5oZWFkKSBvcHRzLmhlYWQgPSBcIlwiXG4gICAgb3B0cy5odG1sID0gJzwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPicgKyBvcHRzLmhlYWQgKyAnPC9oZWFkPjxib2R5PicgKyBvcHRzLmJvZHkgKyAnPC9ib2R5PjwvaHRtbD4nXG4gIH1cbiAgaWYgKCFvcHRzLnNhbmRib3hBdHRyaWJ1dGVzKSBvcHRzLnNhbmRib3hBdHRyaWJ1dGVzID0gWydhbGxvdy1zY3JpcHRzJ11cbiAgcmV0dXJuIG9wdHNcbn1cblxuSUZyYW1lLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuaWZyYW1lKSB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmlmcmFtZSlcbn1cblxuSUZyYW1lLnByb3RvdHlwZS5zZXRIVE1MID0gZnVuY3Rpb24ob3B0cykge1xuICBvcHRzID0gdGhpcy5wYXJzZUhUTUxPcHRpb25zKG9wdHMpXG4gIGlmICghb3B0cy5odG1sKSByZXR1cm5cbiAgdGhpcy5yZW1vdmUoKVxuICAvLyBjcmVhdGUgdGVtcG9yYXJ5IGlmcmFtZSBmb3IgZ2VuZXJhdGluZyBIVE1MIHN0cmluZ1xuICAvLyBlbGVtZW50IGlzIGluc2VydGVkIGludG8gdGhlIERPTSBhcyBhIHN0cmluZyBzbyB0aGF0IHRoZSBzZWN1cml0eSBwb2xpY2llcyBkbyBub3QgaW50ZXJmZXJlXG4gIC8vIHNlZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20va3VtYXZpcy84MjAyNDQ3XG4gIHZhciB0ZW1wSWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJylcbiAgdGVtcElmcmFtZS5zZXRBdHRyaWJ1dGUoJ3Njcm9sbGluZycsIHRoaXMub3B0cy5zY3JvbGxpbmdEaXNhYmxlZCA/ICdubycgOiAneWVzJylcbiAgdGVtcElmcmFtZS5zdHlsZS53aWR0aCA9ICcxMDAlJ1xuICB0ZW1wSWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJ1xuICB0ZW1wSWZyYW1lLnN0eWxlLmJvcmRlciA9ICcwJ1xuICB0ZW1wSWZyYW1lLnNhbmRib3ggPSBvcHRzLnNhbmRib3hBdHRyaWJ1dGVzLmpvaW4oJyAnKVxuICAvLyBjcmVhdGUgYSBibG9iIGZvciBvcHRzLmh0bWwgYW5kIHNldCBhcyBpZnJhbWUgYHNyY2AgYXR0cmlidXRlXG4gIHZhciBibG9iID0gbmV3IEJsb2IoW29wdHMuaHRtbF0sIHsgdHlwZTogJ3RleHQvaHRtbDtjaGFyc2V0PVVURi04JyB9KVxuICB2YXIgVSA9IHR5cGVvZiBVUkwgIT09ICd1bmRlZmluZWQnID8gVVJMIDogd2Via2l0VVJMXG4gIHZhciB0YXJnZXRVcmwgPSBVLmNyZWF0ZU9iamVjdFVSTChibG9iKVxuICB0ZW1wSWZyYW1lLnNyYyA9IHRhcmdldFVybFxuICAvLyBnZW5lcmF0ZSBIVE1MIHN0cmluZ1xuICB2YXIgaHRtbFNyYyA9IHRlbXBJZnJhbWUub3V0ZXJIVE1MXG4gIC8vIGluc2VydCBIVE1MIGludG8gY29udGFpbmVyXG4gIHRoaXMuY29udGFpbmVyLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgaHRtbFNyYylcbiAgLy8gcmV0cmlldmUgY3JlYXRlZCBpZnJhbWUgZnJvbSBET01cbiAgdmFyIG5laWdoYm9ySWZyYW1lcyA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lmcmFtZScpXG4gIHRoaXMuaWZyYW1lID0gbmVpZ2hib3JJZnJhbWVzW25laWdoYm9ySWZyYW1lcy5sZW5ndGgtMV1cbn1cbiJdfQ==
