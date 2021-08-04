function cb(){
  console.log('Processed in next iteration');
}

function cb2(){
  console.log('Processed in next iteration2');
}


process.nextTick(cb2);
console.log('Processed in the first iteration');
process.nextTick(cb)
null.length();
process.on('uncaughtException', function(err){
console.log(err)
});
