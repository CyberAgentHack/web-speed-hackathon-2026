

export const normalizeArgs=(error,ErrorClass,currentName=error.name)=>{
validateErrorClass(ErrorClass);

if(typeof currentName!=="string"){
throw new TypeError(`currentName must be a string: ${currentName}`)
}

return currentName
};

const validateErrorClass=(ErrorClass)=>{
if(!isClass(ErrorClass)){
throw new TypeError(`ErrorClass must be a class: ${ErrorClass}`)
}

if(!isErrorClass(ErrorClass.prototype)){
throw new TypeError(`ErrorClass must inherit from Error: ${ErrorClass}`)
}

if(!hasConstructor(ErrorClass)){
throw new TypeError(
`ErrorClass must be have a valid constructor: ${ErrorClass}`
)
}
};

const isClass=(ErrorClass)=>
typeof ErrorClass==="function"&&
typeof ErrorClass.prototype==="object"&&
ErrorClass.prototype!==null;


const isErrorClass=(prototype)=>
prototype!==null&&(
prototype.name==="Error"||isErrorClass(Object.getPrototypeOf(prototype)));

const hasConstructor=(ErrorClass)=>
typeof ErrorClass.prototype.constructor==="function";