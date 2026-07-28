import { Button, Image, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';

import { profileService, type Profile } from './profile-service';
import './WechatProfileSetup.scss';

interface Props {
  profile: Profile;
  service?: Pick<typeof profileService, 'updateDetails'>;
  uploadAvatar?: (tempFilePath: string) => Promise<string>;
  onComplete(profile: Profile): void;
  onSkip(): void;
}

export function shouldRequestWechatProfile(profile: Profile) {
  return profile.nickname === '微信用户' || !profile.avatarFileId;
}

export async function uploadWechatAvatar(tempFilePath: string) {
  const suffix = tempFilePath.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
  const result = await Taro.cloud.uploadFile({
    cloudPath: `profile-avatars/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${suffix}`,
    filePath: tempFilePath,
  });
  return result.fileID;
}

export function WechatProfileSetup({
  profile,
  service = profileService,
  uploadAvatar = uploadWechatAvatar,
  onComplete,
  onSkip,
}: Props) {
  const [nickname, setNickname] = useState(
    profile.nickname === '微信用户' ? '' : profile.nickname,
  );
  const [avatarPath, setAvatarPath] = useState('');
  const [saving, setSaving] = useState(false);
  const displayAvatar = avatarPath || profile.avatarFileId;

  async function confirm() {
    const nextNickname = nickname.trim();
    if (!nextNickname || saving) {
      if (!nextNickname) {
        await Taro.showToast({ title: '请先确认微信昵称', icon: 'none' });
      }
      return;
    }
    setSaving(true);
    try {
      const avatarFileId = avatarPath
        ? await uploadAvatar(avatarPath)
        : profile.avatarFileId;
      const updated = await service.updateDetails(
        {
          nickname: nextNickname,
          ...(avatarFileId ? { avatarFileId } : {}),
        },
        profile.version,
      );
      onComplete(updated);
      await Taro.showToast({ title: '微信资料已同步', icon: 'success' });
    } catch (cause) {
      await Taro.showToast({
        title:
          cause instanceof Error ? cause.message : '资料保存失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="wechat-profile-setup__mask">
      <View className="wechat-profile-setup">
        <Text className="wechat-profile-setup__title">确认微信资料</Text>
        <Text className="wechat-profile-setup__description">
          微信不会允许小程序静默读取资料，请选择头像并确认昵称。
        </Text>
        <Button
          className="wechat-profile-setup__avatar"
          aria-label="选择微信头像"
          openType="chooseAvatar"
          onChooseAvatar={(event) => setAvatarPath(event.detail.avatarUrl)}
        >
          {displayAvatar ? (
            <Image src={displayAvatar} mode="aspectFill" />
          ) : (
            <Text>选择头像</Text>
          )}
        </Button>
        <Text className="wechat-profile-setup__label">微信昵称</Text>
        <Input
          className="wechat-profile-setup__input"
          aria-label="微信昵称"
          type="nickname"
          maxlength={40}
          placeholder="点击使用微信昵称"
          value={nickname}
          onInput={(event) => setNickname(event.detail.value)}
        />
        <View className="wechat-profile-setup__actions">
          <Button onClick={onSkip}>暂不设置</Button>
          <Button
            className="is-primary"
            loading={saving}
            disabled={saving}
            onClick={() => void confirm()}
          >
            确认使用
          </Button>
        </View>
      </View>
    </View>
  );
}
