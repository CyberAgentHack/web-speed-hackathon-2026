import{setErrorProperty}from"./descriptors.js";










export const setStack=(error)=>{
const stack=getStack(error.message,error.name);
setErrorProperty(error,"stack",stack)
};







const getStack=(message="",name="Error")=>{
const StackError=getErrorClass(name);
const{stack}=new StackError(message);
return typeof stack==="string"&&stack!==""?
stack:
`${name}: ${message}`
};





const getErrorClass=(name)=>{
const descriptor={
value:name,
enumerable:false,
writable:true,
configurable:true
};

const StackError=Object.defineProperty(
class extends Error{},
"name",
descriptor
);

Object.defineProperty(StackError.prototype,"name",descriptor);
return StackError
};