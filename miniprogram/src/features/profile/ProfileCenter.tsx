import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';

import './ProfileCenter.scss';

export function ProfileCenter({
  nickname,
  recentFeelLabel,
  onLogout,
}: {
  nickname: string;
  recentFeelLabel: string;
  onLogout(): void;
}) {
  async function showInfo(title: string, content: string) {
    await Taro.showModal({ title, content, showCancel: false });
  }

  async function logout() {
    const result = await Taro.showModal({
      title: '退出登录',
      content: '只会清除本机登录状态，不会删除云端衣橱、场景和搭配数据。',
      confirmText: '退出登录',
      confirmColor: '#b42318',
    });
    if (!result.confirm) return;
    onLogout();
    await Taro.reLaunch({ url: '/pages/index/index' });
  }

  return (
    <View className="profile-center">
      <View className="profile-center__card">
        <Text className="profile-center__name">{nickname}</Text>
        <Text className="profile-center__meta">
          最近整体体感：{recentFeelLabel}
        </Text>
      </View>
      <Button
        onClick={() =>
          void showInfo(
            '定位授权',
            '定位仅用于识别所在城市并提供当地天气与穿衣建议，可在微信设置中管理授权。',
          )
        }
      >
        定位授权说明
      </Button>
      <Button
        onClick={() =>
          void showInfo(
            '帮助',
            '在首页维护当天行程，在衣橱管理衣物，在试穿中自由搭配并保存。',
          )
        }
      >
        使用帮助
      </Button>
      <Button
        onClick={() =>
          void showInfo(
            '协议与隐私',
            '我们仅在提供功能所需范围内处理账号、城市级位置和业务数据。',
          )
        }
      >
        用户协议与隐私政策
      </Button>
      <Button
        onClick={() =>
          void showInfo(
            '账号与数据说明',
            '退出登录不会删除云端数据。当前版本暂不支持账号注销；相关能力后续将按微信平台规则提供。',
          )
        }
      >
        账号与数据说明
      </Button>
      <Button className="profile-center__danger" onClick={() => void logout()}>
        退出登录
      </Button>
    </View>
  );
}
