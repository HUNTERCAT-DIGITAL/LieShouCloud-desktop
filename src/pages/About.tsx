/**
 * 引用包介绍页（上游薄壳 · 2026-08-29 决策）.
 * 上游端仅保留登录/框架/API/注入槽 + 本介绍页;业务页面全部由客户交付包注入。
 */
import { Card, Descriptions, List, Typography } from 'antd';
import { AppstoreOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';

import { getEdition } from '../config/editions';

const { Title, Paragraph, Text } = Typography;

const FEATURES = [
  {
    icon: <AppstoreOutlined />,
    title: '薄客户端',
    desc: '只提供登录、布局、路由、API 客户端与版别注入槽,不含业务页面',
  },
  {
    icon: <DownOutlined />,
    title: '业务全在下游',
    desc: '客户页面经 packages/<client> 编写,extraRoutes 注入本端(客户聚合仓模式)',
  },
  {
    icon: <SettingOutlined />,
    title: '版别化装配',
    desc: 'VITE_EDITION / 域名决定版别;客户可配置品牌/登录/能力清单与菜单裁剪',
  },
];

export default function About() {
  const edition = getEdition();

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <Title level={3}>
        {edition.brandName} · @lieshoucloud/desktop 引用包
      </Title>
      <Paragraph type="secondary">
        上游薄壳化决策(2026-08-29): 上游端页面部分仅保留「引用包介绍单页」,登录/框架/API 为共性能力保留,
        业务页面全部由客户交付包(editions/&lt;client&gt;.extra.ts)注入。
      </Paragraph>

      <Card title="本端是什么" style={{ marginTop: 16 }}>
        <List
          dataSource={FEATURES}
          renderItem={(f) => (
            <List.Item>
              <List.Item.Meta avatar={f.icon} title={f.title} description={f.desc} />
            </List.Item>
          )}
        />
      </Card>

      <Card title="当前版别" style={{ marginTop: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="版别">{edition.id}</Descriptions.Item>
          <Descriptions.Item label="品牌">{edition.brandName}</Descriptions.Item>
          <Descriptions.Item label="行业能力">
            {(edition.industries ?? []).join(' / ') || '无(纯平台)'}
          </Descriptions.Item>
          <Descriptions.Item label="登录">
            {edition.login?.required === false
              ? '游客直达'
              : `需要登录(${edition.login?.mode ?? 'password'})`}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Paragraph style={{ marginTop: 16 }} type="secondary">
        <Text type="secondary">
          共性功能(登录/框架/API/注入机制)提升上游;业务(客户/行业页面)沉淀下游客户包。
        </Text>
      </Paragraph>
    </div>
  );
}
