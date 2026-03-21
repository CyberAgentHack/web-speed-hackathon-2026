import normalizeException from"normalize-exception";
import setErrorClass from"set-error-class";
import setErrorProps from"set-error-props";

import{mergeAggregateCauses,mergeAggregateErrors}from"./aggregate.js";
import{mergeMessage}from"./message.js";
import{getStack,hasStack,mergeStack}from"./stack.js";
import{getWrap}from"./wrap.js";




const mergeErrorCause=(error)=>mergeError(error,[]).error;

export default mergeErrorCause;






const mergeError=(error,parents)=>{
if(parents.includes(error)){
return{}
}

const recurse=(innerError)=>mergeError(innerError,[...parents,error]);
const stack=getStack(error);
const errorA=normalizeException(error,{shallow:true});
const parentHasStack=hasStack(errorA,stack);

mergeAggregateCauses(errorA,recurse);
const{parent:errorB,childHasStack}=mergeCause(errorA,recurse);
const errorHasStack=parentHasStack||childHasStack;
return{error:errorB,errorHasStack}
};



const mergeCause=(parent,recurse)=>{
const wrap=getWrap(parent);

if(parent.cause===undefined){
return{parent,childHasStack:false}
}

const{error:child,errorHasStack:childHasStack}=recurse(parent.cause);

delete parent.cause;
const parentA=mergeChild({parent,child,childHasStack,wrap});
return{parent:parentA,childHasStack}
};

const mergeChild=({parent,child,childHasStack,wrap})=>{
if(child===undefined){
return parent
}

const[target,source]=wrap?[child,parent]:[parent,child];
const stackError=mergeStack({wrap,target,source,childHasStack});
const targetA=setErrorClass(target,target.constructor,stackError.name);
const targetB=mergeMessage({parent,child,target:targetA,stackError});
mergeAggregateErrors({target:targetB,source,parent,child});
const targetC=setErrorProps(targetB,source,{soft:!wrap});
return targetC
};