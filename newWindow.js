var gamme = require('gamma')
var x = 0
module.exports = function(){
  setInterval(function(){
    console.log(gamme(x++))
  }, 500)
}
