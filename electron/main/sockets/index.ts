import WebSocket from 'ws';
import { ipcMain} from "electron";
import pako from 'pako'
import EventEmitter from 'eventemitter3'
import {getMessage} from "./socket-message";
import {resolver} from "./message-resolver";

class WebSocketManager<T> {
  protected EE = new EventEmitter()
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

    connection.on('message', this.onMessage.bind(this));

    connection.on('close', this.onClose);
  }
  async sendAck(ws, logId, internalExt) {
    const { PushFrame } = await resolver()
    const pushproto_PushFrame2 = PushFrame.create({
      payloadtype: 'ack',
      payload: internalExt,
      msgId: logId  // 这里的 logid 需要从某个地方获取
    });
    const serializedMessage = PushFrame.encode(pushproto_PushFrame2).finish();
    ws?.readyState === 1 && ws.send(serializedMessage);
  }
  onOpen() {
    console.log(`已连接直播间:`);
  }

  async onMessage(data) {
    const { PushFrame, Response } = await resolver()
    const pushFrame = PushFrame.decode(data);
    const decompressed = pako.ungzip(pushFrame.payload);
    const message = Response.decode(decompressed);

    // 处理消息
    const logId = pushFrame.logId.toString();
    await this.handleMessage(message)
    if (message.needAck) {
      const ws = this.connections.get(this.liveId)
      await this.sendAck(ws, logId, message.internalExt.toString());
    }
  }
  async handleMessage(message) {
    // 遍历消息列表
    for (let msg of message.messages) {
      // 根据方法处理消息
      switch (msg.method) {
        case 'WebcastGiftMessage':
          const decodedMessage = await getMessage(msg.payload, msg.method)
          this.EE.emit('data', [decodedMessage])
          break;

       /* case 'WebcastMemberMessage':
          // 处理成员加入 MemberMessage
          // const memberPayload = zlib.gunzipSync(msg.payload);
          const memberMessage = MemberMessage.decode(msg.payload);

          const message = getMessage(memberMessage, 'WebcastMemberMessage')
          this.EE.emit('data', [message])
          // 然后你可以使用memberMessage对象
          break;*/

        /*case 'WebcastChatMessage':
          // 处理弹幕
          // const chatPayload = zlib.gunzipSync(msg.payload);
          console.log(ChatMessage.decode(msg.payload))
          // const chatMessage = ChatMessage.decode(msg.payload);
          // 然后你可以使用chatMessage对象
          break;*/
      }
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
  subscribe (event: string, callback: (data: T[]) => void) {
    this.EE.addListener(event, callback)
  }
}

const manager =  new WebSocketManager()
export const injectSocket = () => {
  ipcMain.handle('createSocket', (event, data) => {
    manager.connect(data)
  });
  ipcMain.handle('subscribe', (event, eventName) => {
    manager.subscribe(eventName, (data) => {
      event.sender.send(`${eventName}-response`, data);
    })
  });

  ipcMain.handle('closeSocket', (event, liveId) => {
    return manager.closeConnection(liveId)
  });
}
