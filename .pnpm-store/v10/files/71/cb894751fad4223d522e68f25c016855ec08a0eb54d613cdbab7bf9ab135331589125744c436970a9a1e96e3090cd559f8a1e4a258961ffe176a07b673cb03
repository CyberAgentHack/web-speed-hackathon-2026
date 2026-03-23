import normalizeException from"normalize-exception";

import{normalizeArgs}from"./args.js";
import{getStack}from"./stack.js";


const setErrorMessage=(error,newMessage,currentMessage)=>{
const errorA=normalizeException(error);
const currentMessageA=normalizeArgs(errorA,newMessage,currentMessage);
setNonEnumProp(errorA,"message",newMessage);
updateStack(errorA,newMessage,currentMessageA);
return errorA
};

export default setErrorMessage;



const updateStack=(error,newMessage,currentMessage)=>{
if(newMessage===currentMessage||!stackIncludesMessage()){
return
}

const stack=getStack(error,newMessage,currentMessage);
setNonEnumProp(error,"stack",stack)
};


const stackIncludesMessage=()=>{
const{stack}=new Error(EXAMPLE_MESSAGE);
return typeof stack==="string"&&stack.includes(EXAMPLE_MESSAGE)
};

const EXAMPLE_MESSAGE="set-error-message test message";

const setNonEnumProp=(error,propName,value)=>{

Object.defineProperty(error,propName,{
value,
enumerable:false,
writable:true,
configurable:true
})
};