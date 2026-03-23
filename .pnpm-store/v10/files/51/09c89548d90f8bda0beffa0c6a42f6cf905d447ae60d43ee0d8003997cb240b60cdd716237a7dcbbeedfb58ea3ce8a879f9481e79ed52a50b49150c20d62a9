import{setNonEnumProp}from"./enum.js";



export const updateStack=(error,currentName)=>{
if(!shouldUpdateStack(error,currentName)){
return
}

const stack=getStack(error,currentName);
setNonEnumProp(error,"stack",stack)
};

const shouldUpdateStack=(error,currentName)=>
currentName!==error.name&&
currentName!==""&&
error.stack.includes(currentName)&&
stackIncludesName();


const stackIncludesName=()=>{

class StackError extends Error{}
const descriptor={
value:EXAMPLE_NAME,
enumerable:false,
writable:true,
configurable:true
};

Object.defineProperty(StackError,"name",descriptor);

Object.defineProperty(StackError.prototype,"name",descriptor);
const{stack}=new StackError("");
return typeof stack==="string"&&stack.includes(EXAMPLE_NAME)
};

const EXAMPLE_NAME="SetErrorClassError";








const getStack=({name,stack},currentName)=>{
if(stack.startsWith(`${currentName}: `)){
return stack.replace(currentName,name)
}

const replacers=getReplacers(currentName,name);
const[fromA,to]=replacers.find(([from])=>stack.includes(from));
return stack.replace(fromA,to)
};



const getReplacers=(currentName,newName)=>[
[`\n${currentName}: `,`\n${newName}: `],
[`${currentName}: `,`${newName}: `],
[`${currentName} `,`${newName} `],
[currentName,newName]];