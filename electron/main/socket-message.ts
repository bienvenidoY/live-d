
interface UnifyData {
  toUserNickname: string

}


export function  getMessage(message, methodType) {
  const unifyData = {}
  // 根据方法处理消息
  switch (methodType) {
    case 'WebcastGiftMessage':
      break;

    case 'WebcastMemberMessage':
      // 然后你可以使用memberMessage对象
      break;

    case 'WebcastChatMessage':
      // 处理弹幕
      // const chatMessage = ChatMessage.decode(msg.payload);
      // 然后你可以使用chatMessage对象
      break;
  }
  return unifyData
}
