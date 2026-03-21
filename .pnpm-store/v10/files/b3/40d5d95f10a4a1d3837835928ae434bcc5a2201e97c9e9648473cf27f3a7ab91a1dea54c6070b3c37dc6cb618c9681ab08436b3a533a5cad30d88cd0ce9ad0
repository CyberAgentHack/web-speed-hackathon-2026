
export const mergeDescriptors=(newDescriptor,currentDescriptor)=>
currentDescriptor.configurable===false?
mergeNonConfig(newDescriptor,currentDescriptor):
mergeConfig(newDescriptor,currentDescriptor);




const mergeNonConfig=(newDescriptor,currentDescriptor)=>({
...currentDescriptor,
...getNonConfigWritable(newDescriptor,currentDescriptor),
...getNonConfigValue(newDescriptor,currentDescriptor)
});

const getNonConfigWritable=(newDescriptor,currentDescriptor)=>
currentDescriptor.writable===true&&newDescriptor.writable===false?
{writable:false}:
{};

const getNonConfigValue=(newDescriptor,currentDescriptor)=>
newDescriptor.hasValue&&
"value"in currentDescriptor&&
currentDescriptor.writable===true?
{value:newDescriptor.value}:
{};

const mergeConfig=(newDescriptor,currentDescriptor)=>{
const enumerable=mergeDescriptor(
newDescriptor.enumerable,
currentDescriptor.enumerable,
true
);
const writable=mergeDescriptor(
newDescriptor.writable,
currentDescriptor.writable,
true
);
const configurable=mergeDescriptor(
newDescriptor.configurable,
currentDescriptor.configurable,
true
);
const valueProps=mergeValue(newDescriptor,currentDescriptor,writable);
return{...valueProps,enumerable,configurable}
};

const mergeValue=(newDescriptor,currentDescriptor,writable)=>{
if(newDescriptor.hasValue){
return{value:newDescriptor.value,writable}
}

if(!hasGetSet(newDescriptor)&&!hasGetSet(currentDescriptor)){
return{value:currentDescriptor.value,writable}
}

return{
get:mergeDescriptor(newDescriptor.get,currentDescriptor.get),
set:mergeDescriptor(newDescriptor.set,currentDescriptor.set)
}
};

const hasGetSet=({get,set})=>get!==undefined||set!==undefined;

const mergeDescriptor=(newValue,currentValue,defaultValue)=>
newValue??currentValue??defaultValue;