import { useState }  from 'react'

import { Input, Space, Button, Grid, Table, Typography, Image, Checkbox, Card, Message } from '@arco-design/web-react';
import { Resizable } from 'react-resizable';
const CheckboxGroup = Checkbox.Group;
const useCheckbox = Checkbox.useCheckbox;



const Row = Grid.Row;
const Col = Grid.Col;
import React from 'react'
import {validURL} from "@/lib/validate";

const columns = [
  { title: '序号',
    width: 60,
    render: (col, item: T, index: number) => index + 1},
  {
    title: '房间标题',
    dataIndex: 'name',
    width: 140,
    fixed: 'left',
  },
  {
    title: '主播昵称',
    dataIndex: 'salary',
    width: 100,
    render: (col, item) => {
      return  <Typography.Paragraph ellipsis={{ rows: 1, showTooltip: true, wrapper: 'span' }}>
        {item.salary}
      </Typography.Paragraph>
    }
  },
  {
    title: '开播状态',
    dataIndex: 'address',
    render: (col, item) => {
      return  <Typography.Paragraph ellipsis={{ rows: 1, showTooltip: true,  wrapper: 'span' }}>
        {item.address}
      </Typography.Paragraph>
    }
  },
  {
    title: '在线/观看',
    dataIndex: 'email',
  },
  {
    title: '喜欢',
    dataIndex: 'email',
  },
  {
    title: '抓取状态',
    dataIndex: 'email',
  },
];
const data = Array(100000)
  .fill('')
  .map((_, index) => ({
    key: `${index}`,
    name: `Kevin ${index}`,
    salary: 22000,
    address: `${index} Park Road, London`,
    email: `kevin.sandra_${index}@example.com`,
    email1: `kevin.sandra_${index}@example.com`,
  }));

const SearchHeader: React.FC = () => {

  const [liveUrl, setLiveUrl] = useState('')

  function addLive() {
    if(!liveUrl) {
      Message.warning('请输入链接')
      return;
    }
    if(!validURL(liveUrl)) {
      Message.error('请输入正确链接')
      return
    }
    // TODO 添加直播间
  }

  function clearAll() {
    // 断开所有直播状态
    endAll()
    // TODO 清空输入框
    // TODO 清空直播列表
    // TODO 清空用户评论列表
    // TODO 清空二维码信息
  }
  function uploadExcelFile() {
    // TODO 上传excel 解析到直播列表中
  }
  function startAll() {
    // TODO 连接所有直播列表中ws
  }
  function endAll() {
    // TODO 断开所有直播列表中ws
  }
  function saveExcelFile() {
    // TODO 断开所有直播列表中ws
  }

  return (<div style={{ marginBottom: 16 }}>
    <Space size='small'>
      <Input style={{width: 400}} placeholder={'输入直播链接'}
             value={liveUrl}
             onChange={(value) => {
              setLiveUrl(value)
             }}
      />
      <Button  type='secondary' onClick={clearAll}>
        清空所有
      </Button>
      <Button type='secondary' onClick={addLive}>
        添加
      </Button>
      <Button  type='secondary' onClick={uploadExcelFile}>
        导入
      </Button>
      <Button  type='secondary' onClick={startAll}>
        全部开始
      </Button>
      <Button  type='secondary' onClick={endAll}>
        全部结束
      </Button>
      <Button  type='secondary' onClick={saveExcelFile}>
        保存Excel
      </Button>
     {/* <Button  type='secondary'>
        软件设置
      </Button>*/}
    </Space>
    </div>)
}



const LiveRoomTable: React.FC = () => {
  return (
    <Row>
      <Col span={16}>
        <div>
          <Table
            size='mini'
          virtualized
          scroll={{
            y: 300,
          }}
          border
          columns={columns}
          data={data}
          pagination={false}
        />
        </div>
      </Col>
      <Col span={8}>
          <Space size='large' align='center' style={{ margin: 24 }}>
            <Image
              width={250}
              height={250}
              src='some-error.png'
              alt='未选择用户'
            />
            <div style={{height: 300, width: 1 }}>
            </div>
          </Space>
      </Col>
    </Row>
  )
}


const options = [
  {label: '进入', value: 1,},
  {label: '礼物', value: 2,},
  {label: '弹幕', value: 3,},
  {label: '点赞', value: 4,},
  {label: '关注', value: 5,},
  {label: '信息跟随', value: 6,},
  {label: '自动去重', value: 7,},
  {label: '自动抓取', value: 8,},
  {label: '解析完整信息(需要代理,采集速度会变慢)', value: 9,},
]
const UserTableOptions: React.FC = () => {
  const {
    selected,
    selectAll,
    setSelected,
    unSelectAll,
    isAllSelected,
    isPartialSelected,
    toggle,
  } = useCheckbox(
    options.map((x) => x.value),
  );
  return (
    <div>
      <CheckboxGroup value={selected} options={options} onChange={setSelected} />
    </div>
  );
}


const userColumns = [
  { title: '序号',
    width: 60,
    render: (col, item: T, index: number) => index + 1},
  {
    title: '主播昵称',
    dataIndex: 'name',
    width: 140,
    fixed: 'left',
  },
  {
    title: '动作',
    dataIndex: 'salary',
    width: 100,
    render: (col, item) => {
      return  <Typography.Paragraph ellipsis={{ rows: 1, showTooltip: true, wrapper: 'span' }}>
        {item.salary}
      </Typography.Paragraph>
    }
  },
  {
    title: '礼物价值',
    dataIndex: 'address',
    render: (col, item) => {
      return  <Typography.Paragraph ellipsis={{ rows: 1, showTooltip: true,  wrapper: 'span' }}>
        {item.address}
      </Typography.Paragraph>
    }
  },
  {
    title: '动作时间',
    width: 140,
    dataIndex: '动作时间',
  },
  {
    title: 'Uid',
    dataIndex: 'email1',
  },
  {
    title: 'Secuid',
    dataIndex: 'email2',
  },
  {
    title: '用户昵称',
    dataIndex: 'email3',
  },
  {
    title: '抖音号',
    dataIndex: 'email4',
  },
  {
    title: '性别',
    dataIndex: 'email5',
  },
  {
    title: '年龄',
    dataIndex: 'email6',
  },
  {
    title: '城市',
    dataIndex: 'email7',
  },
  {
    title: '简介',
    dataIndex: 'email8',
  },
  {
    title: '私密账号9',
    dataIndex: 'email',
  },
];
const userData = Array(100000)
  .fill('')
  .map((_, index) => ({
    key: `${index}`,
    name: `Kevin ${index}`,
    salary: 22000,
    address: `${index} Park Road, London`,
    email: `kevin.sandra_${index}@example.com`,
    email1: `kevin.sandra_${index}@example.com`,
    email2: `kevin.sandra_${index}@example.com`,
    email3: `kevin.sandra_${index}@example.com`,
    email4: `kevin.sandra_${index}@example.com`,
    email5: `kevin.sandra_${index}@example.com`,
    email6: `kevin.sandra_${index}@example.com`,
    email7: `kevin.sandra_${index}@example.com`,
    email8: `kevin.sandra_${index}@example.com`,
    email9: `kevin.sandra_${index}@example.com`,
  }));



const UserTable: React.FC = () => {
  return <div>
    <Table
      size='mini'
      virtualized
      scroll={{
        y: 300,
      }}
      border
      columns={userColumns}
      data={userData}
      pagination={false}
    />
  </div>
}


const LiveDanmuPage = () => {
  return <div className="page">
    <Space size={16} direction="vertical" style={{ width: '100%' }}>
      <Card>
        <SearchHeader />
        <LiveRoomTable />
      </Card>
      <Row>
        <Col span={24}>
          <Card>
            <Space size={8} direction="vertical" style={{ width: '100%' }}>
              <UserTableOptions />
              <UserTable />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  </div>
}

export default LiveDanmuPage
