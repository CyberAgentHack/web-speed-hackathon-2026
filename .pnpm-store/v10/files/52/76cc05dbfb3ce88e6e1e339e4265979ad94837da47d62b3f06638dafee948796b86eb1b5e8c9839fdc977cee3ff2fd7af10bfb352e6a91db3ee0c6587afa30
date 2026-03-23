

export const normalizeArgs=(
error,
newMessage,
currentMessage=error.message)=>
{
if(typeof newMessage!=="string"){
throw new TypeError(`newMessage must be a string: ${newMessage}`)
}

if(typeof currentMessage!=="string"){
throw new TypeError(`currentMessage must be a string: ${currentMessage}`)
}

return currentMessage
};