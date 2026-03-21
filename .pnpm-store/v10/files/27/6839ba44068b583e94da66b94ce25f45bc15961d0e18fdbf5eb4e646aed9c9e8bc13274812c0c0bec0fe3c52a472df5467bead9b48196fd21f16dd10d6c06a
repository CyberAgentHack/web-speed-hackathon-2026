import redefineProperty from"redefine-property";






export const assignProp=(error,propName,propValue)=>{
if(propValue!==undefined){
return setProp(error,propName,propValue)
}

try{

delete error[propName]
}catch{}

if(error[propName]!==undefined){
return setProp(error,propName)
}
};

const setProp=(error,propName,propValue)=>{
const nonEnum=getNonEnum(propName);
redefineProperty(error,propName,{value:propValue,...nonEnum})
};


const getNonEnum=(propName)=>
typeof propName==="string"&&propName.startsWith("_")?
{enumerable:false}:
{};