import{mergeDescriptors}from"./merge.js";
import{normalizeInput}from"./normalize.js";


const redefineProperty=(input,key,newDescriptor)=>{
const newDescriptorA=normalizeInput(input,key,newDescriptor);
const currentDescriptor=getCurrentDescriptor(input,key);
const finalDescriptor=mergeDescriptors(newDescriptorA,currentDescriptor);
setProperty(input,key,finalDescriptor);
return input
};

export default redefineProperty;


const getCurrentDescriptor=(input,key)=>{
const descriptor=Object.getOwnPropertyDescriptor(input,key);

if(descriptor!==undefined){
return descriptor
}

const prototype=Object.getPrototypeOf(input);
return prototype===null?{}:getCurrentDescriptor(prototype,key)
};


const setProperty=(input,key,finalDescriptor)=>{
try{

Object.defineProperty(input,key,finalDescriptor)
}catch{}
};