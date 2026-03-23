import isErrorInstance from"is-error-instance";
import isPlainObj from"is-plain-obj";




export const normalizeOptions=(error,props,opts={})=>{
validateErrorOrObject(error,"First argument");
validateErrorOrObject(props,"Second argument");

if(!isPlainObj(opts)){
throw new TypeError(`Options must be a plain object: ${opts}`)
}

const{soft=false}=opts;

if(typeof soft!=="boolean"){
throw new TypeError(`Option "soft" must be a boolean: ${soft}`)
}

return{soft}
};

const validateErrorOrObject=(value,prefix)=>{
if(value===undefined){
throw new TypeError(`${prefix} is required.`)
}

if(!isErrorOrObject(value)){
throw new TypeError(
`${prefix} must be a plain object or an error: ${value}`
)
}
};

const isErrorOrObject=(value)=>isPlainObj(value)||isErrorInstance(value);