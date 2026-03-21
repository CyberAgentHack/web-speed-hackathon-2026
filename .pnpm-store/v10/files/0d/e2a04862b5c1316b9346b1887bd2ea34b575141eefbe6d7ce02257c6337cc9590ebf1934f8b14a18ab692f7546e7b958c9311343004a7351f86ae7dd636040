






export const getStack=({name,stack},newMessage,currentMessage)=>
currentMessage!==""&&stack.includes(currentMessage)?
replaceMessage({name,stack,newMessage,currentMessage}):
insertMessage(name,stack,newMessage);



const replaceMessage=({name,stack,newMessage,currentMessage})=>{
const replacers=getReplacers(name,newMessage,currentMessage);
const[fromA,to]=replacers.find(([from])=>stack.includes(from));
return stack.replace(fromA,to)
};



const getReplacers=(name,newMessage,currentMessage)=>[
[`${name}: ${currentMessage}`,`${name}: ${newMessage}`],
[`: ${currentMessage}`,`: ${newMessage}`],
[`\n${currentMessage}`,`\n${newMessage}`],
[` ${currentMessage}`,` ${newMessage}`],
[currentMessage,newMessage]];


const insertMessage=(name,stack,newMessage)=>{
const nameAndColon=`${name}: `;
const newMessageA=newMessage.trimEnd();

if(stack===name||stack.startsWith(`${name}\n`)){
return stack.replace(name,`${nameAndColon}${newMessageA}`)
}

return stack.startsWith(nameAndColon)?
stack.replace(nameAndColon,`${nameAndColon}${newMessageA}\n`):
`${nameAndColon}${newMessageA}\n${stack}`
};