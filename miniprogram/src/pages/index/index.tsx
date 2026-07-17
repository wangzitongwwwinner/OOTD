import { Input, Text, View } from '@tarojs/components';
import { useState } from 'react';

import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
} from '../../components';

import './index.scss';

export default function IndexPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View className="page">
      <Text className="eyebrow">UI FOUNDATION · M0-04</Text>
      <Text className="title">穿衣有数</Text>
      <Text className="intro">
        温暖中性色、编辑式标题与克制的交互状态已迁移至生产小程序。
      </Text>

      <View className="section">
        <Text className="section__title">卡片与操作</Text>
        <Card ariaLabel="全天穿衣建议示例" tone="accent">
          <Text className="card-kicker">全天建议</Text>
          <Text className="card-copy">
            薄针织打底，早晚增加防风外套，室内可轻松脱下。
          </Text>
        </Card>
        <View className="actions">
          <Button onClick={() => setSheetOpen(true)}>打开底部弹层</Button>
          <Button variant="secondary">次要操作</Button>
          <Button loading loadingText="综合全天行程…">
            生成建议
          </Button>
        </View>
      </View>

      <View className="section">
        <Text className="section__title">表单与状态</Text>
        <FormField label="场景名称" hint="例如：办公室、地铁通勤">
          <Input className="field-input" placeholder="请输入名称" />
        </FormField>
        <EmptyState
          title="还没有当天行程"
          description="从场景库选择一个场景，开始安排今天。"
        />
        <ErrorState
          title="天气暂时不可用"
          description="请检查网络后重新加载。"
        />
      </View>

      <BottomSheet
        open={sheetOpen}
        title="新增场景"
        onClose={() => setSheetOpen(false)}
      >
        <Text className="sheet-copy">
          底部弹层会适配安全区，并保持内容与遮罩操作分离。
        </Text>
        <View className="sheet-actions">
          <Button onClick={() => setSheetOpen(false)}>知道了</Button>
        </View>
      </BottomSheet>
    </View>
  );
}
