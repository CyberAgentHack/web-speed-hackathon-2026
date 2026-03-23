import{assignProp}from"./assign.js";
import{normalizeOptions}from"./options.js";
import{shouldSkipProp}from"./skip.js";


const setErrorProps=(error,props,opts)=>{
const{soft}=normalizeOptions(error,props,opts);


for(const propName of Reflect.ownKeys(props)){
setErrorProp({error,props,propName,soft})
}

return error
};

export default setErrorProps;





const setErrorProp=({error,props,propName,soft})=>{
if(!shouldSkipProp({error,props,propName,soft})){
assignProp(error,propName,props[propName])
}
};