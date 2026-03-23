




export const shouldSkipProp=({error,props,propName,soft})=>
isIgnoredPropName(propName)||
!isEnum.call(props,propName)||
soft&&error[propName]!==undefined;

const isIgnoredPropName=(propName)=>
propName in CHECK_ERROR||IGNORED_PROPS.has(propName);




const CHECK_ERROR=new Error("check");



const IGNORED_PROPS=new Set(["prototype","errors","cause"]);

const{propertyIsEnumerable:isEnum}=Object.prototype;