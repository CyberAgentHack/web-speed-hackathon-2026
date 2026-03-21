import isErrorInstance from"is-error-instance";
import isPlainObj from"is-plain-obj";

import{isNonModifiableError}from"./modifiable.js";
import{objectifyError}from"./object.js";
import{stringifyError}from"./string.js";

const{toString:objectToString}=Object.prototype;


export const createError=(value)=>{
if(isErrorPlainObj(value)){
return objectifyError(value)
}

if(!isErrorInstance(value)){
return stringifyError(value)
}

if(isInvalidError(value)){
return objectifyError(value)
}

return value
};


const isErrorPlainObj=(value)=>{
try{
return isPlainObj(value)
}catch{
return false
}
};

const isInvalidError=(value)=>
isProxy(value)||isNonModifiableError(value)||hasInvalidConstructor(value);




const isProxy=(value)=>{
try{
return objectToString.call(value)==="[object Object]"
}catch{
return true
}
};



const hasInvalidConstructor=(error)=>
typeof error.constructor!=="function"||
typeof error.constructor.name!=="string"||
error.constructor.name===""||
error.constructor.prototype!==Object.getPrototypeOf(error);