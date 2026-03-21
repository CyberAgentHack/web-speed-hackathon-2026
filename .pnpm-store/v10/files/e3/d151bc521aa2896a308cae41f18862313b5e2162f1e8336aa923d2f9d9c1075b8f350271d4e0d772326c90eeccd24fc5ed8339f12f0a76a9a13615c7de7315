import{CORE_ERROR_PROPS}from"../descriptors.js";


export const isNonModifiableError=(error)=>
!Object.isExtensible(error)||
CORE_ERROR_PROPS.some(
(propName)=>
isNonConfigurableProp(error,propName)||isThrowingProp(error,propName)
);



const isNonConfigurableProp=(error,propName)=>{
const descriptor=Object.getOwnPropertyDescriptor(error,propName);
return descriptor!==undefined&&!descriptor.configurable
};


const isThrowingProp=(error,propName)=>{
try{

error[propName];
return false
}catch{
return true
}
};