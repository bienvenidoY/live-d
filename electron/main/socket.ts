import WebSocket from 'ws';
import { app, ipcMain} from "electron";
import protobuf from 'protobufjs'
const path = require('path');


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

let PushFrame = '';
let Response = '';
let GiftMessage = '';
let MemberMessage = '';
let ChatMessage = '';

const extraFilePath = path.join(app.getPath('userData'), 'douyin.proto');
console.log(extraFilePath)

loadProtoFile(extraFilePath).then(root => {
   PushFrame = root.lookupType("PushFrame");
   Response = root.lookupType("Response");  // replace with your actual type
   GiftMessage = root.lookupType("GiftMessage");
   MemberMessage = root.lookupType("MemberMessage");
   ChatMessage = root.lookupType("ChatMessage");
})

function handleMessage(message) {

  // 遍历消息列表
  for (let msg of message.messagesList) {
    // 根据方法处理消息
    switch (msg.method) {
      case 'WebcastGiftMessage':
        const giftMessage = GiftMessage.decode(msg.payload);
        console.log(giftMessage);
        // 处理礼物消息
        // const giftPayload = zlib.gunzipSync(msg.payload);
        // const giftMessage = GiftMessage.decode(giftPayload);
        // 然后你可以使用giftMessage对象
        break;

      case 'WebcastMemberMessage':
        // 处理成员加入 MemberMessage
        // const memberPayload = zlib.gunzipSync(msg.payload);
        const memberMessage = MemberMessage.decode(msg.payload);
        // 然后你可以使用memberMessage对象
        break;

      case 'WebcastChatMessage':
        // 处理弹幕
        // const chatPayload = zlib.gunzipSync(msg.payload);
        const chatMessage = ChatMessage.decode(msg.payload);
        // 然后你可以使用chatMessage对象
        break;
    }
  }

  return message;
}

class WebSocketManager<T> {
  protected url = ''
  protected cookie = ''
  protected userAgent = ''
  protected liveId = ''
  connections: Map<string, WebSocket | null>;
  constructor() {
    this.connections = new Map();
  }

  createConnection() {
    const connection = new WebSocket(this.url, {
      headers: {
        cookie: this.cookie,
        userAgent: this.userAgent,
      }
    });
    this.connections.set(this.liveId, connection);

    connection.on('error', this.onError);

    connection.on('open', this.onOpen);

    connection.on('message', this.onMessage);

    connection.on('close', this.onClose);
  }
  sendAck(ws, logId, internalExt) {
    const pushproto_PushFrame2 = PushFrame.create({
      payloadtype: 'ack',
      payload: internalExt,
      msgId: logId  // 这里的 logid 需要从某个地方获取
    });
    const serializedMessage = PushFrame.encode(pushproto_PushFrame2).finish();
    ws.send(serializedMessage);

  }
  onOpen() {
    console.log(`已连接直播间:`);
  }

  onMessage(data) {
    // 解析protobuf数据
    // const payload = Buffer.from(data);
    const pushFrame = PushFrame.decode(data);
    const decompressed = pako.ungzip(pushFrame.payload);
    const message = Response.decode(decompressed);


    // 处理消息
    const logId = pushFrame.logId.toString();
    handleMessage(message)
    if (message.needAck) {
      this.sendAck(ws, logId, message.internalExt.toString());
    }
  }

  onClose() {
    console.log(`直播间  已断开连接`);
  }

  onError(e) {
    console.log(`连接直播间 错误: ${e.message}`);
  }

  closeConnection(id) {
    const connection = this.connections.get(id);
    if (connection) {
      connection.close();
      this.connections.delete(id);
    }
  }

  connect (wsData) {
    const { wsUrl, wsCookie, wsUserAgent, liveId } = wsData
    const connection = this.connections.get(liveId);
    if (this.url === wsUrl && connection) {
      return
    }
    this.url = wsUrl
    this.cookie = wsCookie
    this.userAgent = wsUserAgent
    this.liveId = liveId
    this.createConnection()
  }
}

const manager =  new WebSocketManager()
export const injectSocket = () => {
  ipcMain.handle('createSocket', (event, data) => {
    return  manager.connect(data)
  });
}
