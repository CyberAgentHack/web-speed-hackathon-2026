import{setErrorProperty}from"./descriptors.js";












export const normalizeCause=(error,recurse)=>{
if(!("cause"in error)){
return
}

const cause=error.cause===undefined?error.cause:recurse(error.cause);

if(cause===undefined){

delete error.cause
}else{
setErrorProperty(error,"cause",cause)
}
};