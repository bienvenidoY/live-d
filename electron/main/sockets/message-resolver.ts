import protobuf from "protobufjs";
import {app} from "electron";
import path from "path";

function loadProtoFile(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const root = protobuf.loadSync(filePath);
      resolve(root);
    } catch (error) {
      reject(error);
    }
  });
}

//当前应用的目录
const templateFilePath = app.isPackaged ? path.join(process.cwd(), '/resources/extraResources') : path.join(process.cwd(), '/extraResources')
const extraFilePath: string = templateFilePath + '/douyin.proto'

const keyMap = ['PushFrame', 'Response', 'GiftMessage',
  'MemberMessage', 'ChatMessage', 'LikeMessage',
  'RoomUserSeqMessage', 'FansclubMessage',
  'SocialMessage']
// 定义 keyMapObj 的类型别名
type KeyMapObjTypes = {
  [key in typeof keyMap[number]]: any; // 你可以将 any 替换为对应的消息类型
};
export const resolver = async (): Promise<KeyMapObjTypes> => {
  const root = await loadProtoFile(extraFilePath)
  const keyMapObj:KeyMapObjTypes = {} as KeyMapObjTypes
  for (const key of keyMap) {
    keyMapObj[key] = await root.lookupType(key);
  }
  return keyMapObj
}
