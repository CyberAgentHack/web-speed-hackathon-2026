import{setErrorProperty}from"../descriptors.js";
import{setStack}from"../stack.js";

import{copyObject}from"./copy.js";


export const objectifyError=(object)=>{
const{name,message,stack,cause,errors,...objectA}=copyObject(object);
const messageA=getMessage(message,objectA);
const error=newError(name,messageA);

if(message===messageA){
assignObjectProps(error,objectA)
}

Object.entries({name,stack,cause,errors}).forEach(
([propName,propValue])=>{
setNewErrorProperty(error,propName,propValue)
}
);

if(stack===undefined){
setStack(error)
}

return error
};


const getMessage=(message,object)=>
typeof message==="string"&&message!==""?
message:
truncateMessage(safeJsonStringify(object));

const safeJsonStringify=(object)=>{
try{
return JSON.stringify(object)
}catch{
return safeStringify(object)
}
};

const safeStringify=(object)=>{
try{
return String(object)
}catch{
return"Invalid error"
}
};

const truncateMessage=(message)=>
message.length<MESSAGE_MAX_SIZE?
message:
`${message.slice(0,MESSAGE_MAX_SIZE)}...`;

const MESSAGE_MAX_SIZE=1e3;

const newError=(name,message)=>{
if(name==="AggregateError"&&"AggregateError"in globalThis){
return new AggregateError([],message)
}

if(name in NATIVE_ERRORS){
return new NATIVE_ERRORS[name](message)
}

return new Error(message)
};

const NATIVE_ERRORS={
Error,
ReferenceError,
TypeError,
SyntaxError,
RangeError,
URIError,
EvalError
};


const assignObjectProps=(error,object)=>{

for(const propName in object){

if(!(propName in error)){
error[propName]=object[propName]
}
}
};

const setNewErrorProperty=(error,propName,propValue)=>{
if(propValue!==undefined){
setErrorProperty(error,propName,propValue)
}
};