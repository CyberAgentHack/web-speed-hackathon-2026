import{setNonEnumProp}from"./enum.js";


export const updatePrototype=(error,ErrorClass)=>{
if(Object.getPrototypeOf(error)===ErrorClass.prototype){
return
}

setPrototype(error,ErrorClass);
deleteOwnProperty(error,"constructor");
fixName(error,ErrorClass)
};





const setPrototype=(error,ErrorClass)=>{

Object.setPrototypeOf(error,ErrorClass.prototype)
};










const fixName=(error,ErrorClass)=>{
deleteOwnProperty(error,"name");

const prototypeName=getClassName(ErrorClass.prototype);

if(error.name!==prototypeName){
setNonEnumProp(error,"name",prototypeName)
}
};

const getClassName=(prototype)=>
getPrototypeName(prototype)??
getConstructorName(prototype)??
getClassName(Object.getPrototypeOf(prototype));

const getPrototypeName=(prototype)=>
Object.hasOwn(prototype,"name")&&isDefinedString(prototype.name)?
prototype.name:
undefined;

const getConstructorName=(prototype)=>
typeof prototype.constructor==="function"&&
isDefinedString(prototype.constructor.name)?
prototype.constructor.name:
undefined;

const isDefinedString=(value)=>typeof value==="string"&&value!=="";



const deleteOwnProperty=(error,propName)=>{
if(Object.hasOwn(error,propName)){

delete error[propName]
}
};