import{CORE_ERROR_PROPS,getDescriptor}from"../descriptors.js";




export const copyObject=(object)=>{
const objectCopy={};


for(const propName of getPropsToCopy(object)){

try{
const value=object[propName];
const{
enumerable,
configurable,
writable=true
}=getDescriptor(object,propName);

Object.defineProperty(objectCopy,propName,{
value,
enumerable,
configurable,
writable
})
}catch{}
}

return objectCopy
};





const getPropsToCopy=(object)=>{
const propNames=getOwnKeys(object);


for(const propName of CORE_ERROR_PROPS){

if(isInheritedProp(object,propName)){

propNames.push(propName)
}
}

return propNames
};


const getOwnKeys=(object)=>{
try{
return Reflect.ownKeys(object)
}catch{
return[]
}
};


const isInheritedProp=(object,propName)=>{
try{
return propName in object&&!Object.hasOwn(object,propName)
}catch{
return false
}
};