import{normalizeAggregate}from"./aggregate.js";
import{normalizeCause}from"./cause.js";
import{createError}from"./create/main.js";
import{normalizeDescriptors,setErrorProperty}from"./descriptors.js";
import{setStack}from"./stack.js";


const normalizeException=(error,{shallow=false}={})=>
recurseException(error,[],shallow);

export default normalizeException;

const recurseException=(error,parents,shallow)=>{
if(parents.includes(error)){
return
}

const recurse=shallow?
identity:
(innerError)=>recurseException(innerError,[...parents,error],shallow);

const errorA=createError(error);
normalizeProps(errorA,recurse);
return errorA
};

const identity=(error)=>error;

const normalizeProps=(error,recurse)=>{
normalizeName(error);
normalizeMessage(error);
normalizeStack(error);
normalizeCause(error,recurse);
normalizeAggregate(error,recurse);
normalizeDescriptors(error)
};






const normalizeName=(error)=>{
if(isDefinedString(error.name)){
return
}

const prototypeName=Object.getPrototypeOf(error).name;
const name=isDefinedString(prototypeName)?
prototypeName:
error.constructor.name;
setErrorProperty(error,"name",name)
};


const normalizeMessage=(error)=>{
if(!isDefinedString(error.message)){
setErrorProperty(error,"message","")
}
};


const normalizeStack=(error)=>{
if(!isDefinedString(error.stack)){
setStack(error)
}
};

const isDefinedString=(value)=>typeof value==="string"&&value!=="";