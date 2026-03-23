





























const isErrorInstance=(value)=>
isInstanceOfError(value)||hasErrorTag(value);

export default isErrorInstance;



const isInstanceOfError=(value)=>{
try{
return value instanceof Error
}catch{
return false
}
};

const hasErrorTag=(value)=>{
try{
return ERROR_TAGS.has(Object.prototype.toString.call(value))
}catch{
return false
}
};

const ERROR_TAGS=new Set([

"[object Error]",

"[object DOMException]",

"[object DOMError]",

"[object Exception]"]
);