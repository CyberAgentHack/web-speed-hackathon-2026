import{setErrorProperty}from"./descriptors.js";






export const normalizeAggregate=(error,recurse)=>{
if(Array.isArray(error.errors)){
const aggregateErrors=error.errors.
filter(isDefined).
map(recurse).
filter(Boolean);
setErrorProperty(error,"errors",aggregateErrors)
}else if(isAggregateError(error)){
setErrorProperty(error,"errors",[])
}else if(error.errors!==undefined){
deleteAggregateErrors(error)
}
};

const isDefined=(error)=>error!==undefined;

const isAggregateError=(error)=>
"AggregateError"in globalThis&&(
error.name==="AggregateError"||error instanceof AggregateError);

const deleteAggregateErrors=(error)=>{

delete error.errors;

if(error.errors!==undefined){
setErrorProperty(error,"errors",[])
}
};