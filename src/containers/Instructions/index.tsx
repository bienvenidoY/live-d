import { Card, Typography, Space } from '@arco-design/web-react'
const { Title, Paragraph, Text } = Typography;

const InstructionPage = () => {
  return (
    <div className="page">
      <Card >
        <Typography style={{ marginTop: -40 }}>
          <Title style={{ textAlign: 'center' }}>欢迎使用</Title>
        </Typography>
      </Card>
    </div>
  )
}

export default InstructionPage
