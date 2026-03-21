import{setErrorProperty}from"./set.js";


export const hasStack=(error,stack)=>getStack(error)===stack;




export const getStack=(error)=>
typeof error==="object"&&error!==null?error.stack:undefined;










export const mergeStack=({wrap,target,source,childHasStack})=>{
if(wrap===childHasStack){
return target
}

setErrorProperty(target,"stack",source.stack);
return source
};