import normalizeException from"normalize-exception";
import setErrorMessage from"set-error-message";


const wrapErrorMessage=(error,newMessage,oldMessage)=>{
if(typeof newMessage!=="string"){
throw new TypeError(
`Second argument must be a message string: ${newMessage}`
)
}

const errorA=normalizeException(error);
const message=getMessage(newMessage,errorA.message);
return setErrorMessage(errorA,message,oldMessage)
};

export default wrapErrorMessage;









const getMessage=(rawNewMessage,rawCurrentMessage)=>{
const newMessage=rawNewMessage.trim();
const currentMessage=rawCurrentMessage.trim();

if(newMessage===""){
return currentMessage
}

if(currentMessage===""){
return newMessage
}

return concatMessages(newMessage,currentMessage,rawNewMessage)
};

const concatMessages=(newMessage,currentMessage,rawNewMessage)=>{
if(!newMessage.endsWith(PREPEND_CHAR)){
return`${currentMessage}\n${newMessage}`
}

return rawNewMessage.endsWith(PREPEND_NEWLINE_CHAR)?
`${newMessage}\n${currentMessage}`:
`${newMessage} ${currentMessage}`
};

const PREPEND_CHAR=":";
const PREPEND_NEWLINE_CHAR="\n";