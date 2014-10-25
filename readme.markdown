# abre 

launch an window that can require() in the browser with browserify

works like, and is a fork of [webworkify](https://npmjs.org/package/webworkify)
using [windorfer](https://npmjs.org/package/windorfer)

## usage
pass the three params in:  module ref, a name to use for html targets, and params to set on the window popup, like menubar=false, etc.

have en entry.js:
```js
var abre = require('abre')
var myOtherWindowModule = require('./otroModule')
var newWindowReference = abre(myOtherWindowModule, 'someName', ['width=300'])
// make sure you have populs allowed
```
otroModule.js:
```js
  var gamma = require('gamma')
  var x = 0
  module.exports = function(){
    setInterval(function(){
      console.log(gamma(x++))
    },500)
  }
```
Then browserify entry.js and bundles to murgatroyd!

## example

see examples, [like this one](/entry.js).

## install

With [npm](https://npmjs.org) do:

```
npm install abre 
```

# license

MIT or thereabouts
