import{setErrorProperty}from"./set.js";












export const mergeAggregateCauses=(parent,recurse)=>{
if(parent.errors===undefined){
return
}

const errors=parent.errors.
map((error)=>recurse(error).error).
filter(Boolean);
setErrorProperty(parent,"errors",errors)
};

export const mergeAggregateErrors=({target,source,parent,child})=>{
if(!hasErrors(target)){
mergeSourceErrors(target,source);
return
}

if(hasErrors(source)){
setErrorProperty(target,"errors",[...child.errors,...parent.errors])
}
};

const mergeSourceErrors=(target,source)=>{
if(source.errors!==undefined){
setErrorProperty(target,"errors",source.errors)
}
};

const hasErrors=(targetOrSource)=>
targetOrSource.errors!==undefined&&targetOrSource.errors.length!==0;