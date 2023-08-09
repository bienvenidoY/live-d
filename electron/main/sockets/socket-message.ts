import {resolver} from "./message-resolver";
import Long from "long";
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn') // use local

dayjs.extend(utc);

interface UnifyDataTypes {
  method: string; // 动作
  methodText: string; // 动作文案
  roomId: string; // 房间号
  giftNum?: number; // 礼物数量
  actionTime: string; // 动作时间
  shortId: string; // Uid
  secUid: string; // SecUid
  displayId: string; // 显示ID
  nickName: string; // 用户昵称
  gender: string; // 性别
  level: number; // 登记
  payGrade: number; // 付费等级
  followingCount: number; // 关注数
  followerCount: number; // 粉丝数
  followStatus: number; // 关注状态
  is_blocked_v2: number; // 是否被屏蔽
  signature_extra: string; // 额外简介
  contacts_status: number; // 联系状态
  favoriting_count: number; // 喜欢数
  total_favorited: number; // 总喜欢数
  personal_tag_list: string[]; // 个人标签列表
  user_age: number; // 年龄
  following_count: number; // 关注数
  signature: string; // 简介
  data_label_list: string[]; // 数据标签列表
  secret: number; // 是否私密账号
  is_ad_fake: number; // 是否假广告
  verification_type: number; // 认证类型
  live_high_value: number; // 直播高质量
  groupCount: number; // 礼物组数
  repeatCount: number; // 礼物连击数
  giftId: number; // 礼物id
  giftName: string; // 礼物名称
  city?: string; // 城市
  shareQrcodeUri?: string; // 分享二维码
  ufollowingCount: number; // 关注数
  ufollowerCount: number; // 粉丝数
  verified: number; // 是否认证
  payScore: number; // 付费分数

  comboCount: number,
  content?: string
  memberCount?: number
}

const unifyData: UnifyDataTypes = {
  comboCount: 0,
  method: '',
  methodText: '',
  roomId: '',
  giftNum: 0,
  actionTime: '',
  shortId: '',
  secUid: '',
  displayId: '',
  nickName: '',
  gender: '',
  level: -1,
  payGrade: -1,
  followingCount: -1,
  followerCount: -1,
  followStatus: -1,
  is_blocked_v2: -1,
  signature_extra: '',
  contacts_status: -1,
  favoriting_count: -1,
  total_favorited: -1,
  personal_tag_list: [],
  user_age: -1,
  following_count: -1,
  signature: '',
  data_label_list: [],
  secret: -1,
  is_ad_fake: -1,
  verification_type: -1,
  live_high_value: -1,
  groupCount: -1,
  repeatCount: -1,
  giftId: -1,
  giftName: '',
  city: '',
  shareQrcodeUri: '',
  ufollowingCount: -1,
  ufollowerCount: -1,
  verified: -1,
  payScore: -1,
};

export async function getMessage(message, callback: Function) {
  let result: Partial<UnifyDataTypes> = {};
  const {GiftMessage, ChatMessage, MemberMessage, SocialMessage, LikeMessage, RoomUserSeqMessage } = await resolver();
  // 遍历消息列表
  for (let msg of message) {
    // 根据方法处理消息
    switch (msg.method) {
      case 'WebcastGiftMessage':
        // 礼物消息
        result = webcastGiftMessage(GiftMessage.decode(msg.payload));
        callback(result)
        break;

      case 'WebcastMemberMessage':
        // 处理成员加入
        result = webcastMemberMessage(MemberMessage.decode(msg.payload));
        callback(result)
        break;

      case 'WebcastChatMessage':
        // 处理弹幕
        result = webcastChatMessage(ChatMessage.decode(msg.payload));
        callback(result)
        break;
      case 'WebcastSocialMessage':
        //  处理关注
        result = webcastSocialMessage(SocialMessage.decode(msg.payload));
        callback(result)
        break;
      case 'WebcastLikeMessage':
        //  处理点赞
        result = webcastLikeMessage(LikeMessage.decode(msg.payload));
        callback(result)
        break;
      case 'WebcastRoomUserSeqMessage':
        // 处理直播间人数变化
        result = webcastLikeMessage(RoomUserSeqMessage.decode(msg.payload));
        callback(result)
        break;
    }
  }

}

enum MessageMethodEnums {
  "WebcastGiftMessage" = '礼物',
  "WebcastMemberMessage" = '进入',
  "WebcastChatMessage" = '弹幕',
  "WebcastSocialMessage" = '关注',
  "WebcastLikeMessage" = '点赞',
}

enum GenderEnums {
  "女" = 1,
  "男"
}

function getTime(createTime) {
  const transValue = Long.fromBits(createTime.low, createTime.high, createTime.unsigned)
  const value = transValue.toString().length === 10 ? transValue.toString() + '000' : transValue.toString()
  return dayjs.utc(+value).format('YYYY/MM/DD HH:mm:ss')
}


function getUserData(message) {
  const {user = {} } = message
  const body = {}
  body.shortId = Long.fromBits(user?.shortId).toString();
  body.secUid = user?.secUid;
  body.displayId = user?.displayId;
  body.nickName = user?.nickname;
  body.followingCount = user.followInfo.followingCount.toString();
  body.followerCount = user.followInfo.followerCount.toString();
  body.followStatus = user.followInfo.followStatus.toString();
  body.payGrade = Long.fromBits(user.payGrade.level).toString();;
  body.gender = GenderEnums[user.gender] ?? '未知';

  return {
    ...body,
  }
}
function getLong(data) {
  const { low, high, unsigned } = data
  return Long.fromBits(low, high, unsigned).toString()
}

function webcastGiftMessage(message):UnifyDataTypes {
  const body: Partial<UnifyDataTypes> = {}
  body.method = message.common.method;
  body.methodText = MessageMethodEnums[message.common.method] + ':' + message.common.describe;
  body.actionTime = getTime(message.common.createTime)
  body.roomId = message.common.roomId.toString();

  // 额外数据
  body.giftId = message.giftId.toString();  // 礼物id
  body.giftNum = message.gift.diamondCount;
  body.groupCount = message.groupCount.toString();  // 礼物组数
  body.repeatCount = message.repeatCount.toString();  // 礼物重复数
  body.comboCount = message.comboCount.toString();  // 礼物连击数
  body.giftName = message.gift.name;
  const user = getUserData(message)
  return {
    ...unifyData,
    ...user,
    ...body,
    message,
  }
}
function webcastMemberMessage(message):UnifyDataTypes {
  const body: Partial<UnifyDataTypes> = {}

  body.method = message.common.method;
  body.roomId = message.common.roomId.toString();
  body.methodText = MessageMethodEnums[message.common.method]

  // 成员数？
  body.memberCount = message.memberCount;
  // body.action = message.action.toString();
  body.content = message.common.displayText.defaultFormat;
  const user = getUserData(message)
  return {
    ...unifyData,
    ...user,
    ...body,
    message,
  }
}
function webcastChatMessage(message):UnifyDataTypes {
  const body: Partial<UnifyDataTypes> = {}
  body.method = message.common.method;
  body.roomId = message.common.roomId.toString();
  body.methodText = MessageMethodEnums[message.common.method] + ':' +  message.content;
  body.payGrade = message.user.payGrade.level;
  const user = getUserData(message)
  return {
    ...unifyData,
    ...user,
    ...body,
    message,
  }
}

function webcastSocialMessage(message):UnifyDataTypes {
  const body: Partial<UnifyDataTypes> = {}
  body.method = message.common.method;
  body.roomId = message.common.roomId.toString();
  body.methodText = MessageMethodEnums[message.common.method]
  const user = getUserData(message)
  return {
    ...unifyData,
    ...user,
    ...body,
    message,
  }
}
function webcastLikeMessage(message) {
  const body: any = {}
  body.method = message.common.method;
  body.roomId = message.common.roomId.toString();
  body.total = message.total.toString();
  body.totalUser = message.totalUser.toString();
  return {
    ...body,
    message,
  }
}
