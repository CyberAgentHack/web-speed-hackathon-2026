import{setStack}from"../stack.js";


export const stringifyError=(value)=>{
try{
const error=new Error(String(value));
setStack(error);
return error
}catch(error_){
return error_
}
};