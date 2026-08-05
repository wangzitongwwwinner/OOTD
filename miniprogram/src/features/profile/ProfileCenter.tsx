import { Button, Image, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { type ReactNode, useEffect, useState } from 'react';

import type { Profile } from './profile-service';
import { profileService } from './profile-service';
import './ProfileCenter.scss';

const FAQS = [
  {
    question: '为什么建议中不包含衣橱里的具体款式？',
    answer:
      '“穿衣有数”的核心定位是“温差应对工具”。AI 穿衣建议主要解决气温和天气对应的衣物品类与厚度问题，具体款式可在“试穿”画板中自由搭配。',
  },
  {
    question: '如何设置办公大楼的估计温度？',
    answer:
      '无需测量精确数字，只需根据日常感受选择体感，并填写一个大概环境温度，例如办公室常年 22°C。',
  },
  {
    question: '如何拍摄更适合抠图的衣物？',
    answer:
      '建议将衣物平铺在纯色高对比背景上，保持正面、光线均匀，并从正上方垂直拍摄。',
  },
];

export function ProfileCenter({
  nickname,
  avatarFileId,
  recentFeelLabel,
  preferenceSlot,
  profileVersion,
  onProfileChange,
  service = profileService,
  onLogout,
}: {
  nickname: string;
  avatarFileId?: string;
  recentFeelLabel: string;
  preferenceSlot?: ReactNode;
  profileVersion?: number;
  onProfileChange?(profile: Profile): void;
  service?: Pick<typeof profileService, 'updateDetails'>;
  onLogout(): void;
}) {
  const [activeFaq, setActiveFaq] = useState<number>();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(nickname);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarSourceOpen, setAvatarSourceOpen] = useState(false);
  const [pendingAvatarPath, setPendingAvatarPath] = useState('');
  const [locationPermission, setLocationPermission] = useState<
    'unknown' | 'allowed' | 'denied'
  >('unknown');
  const [locationBusy, setLocationBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void Taro.getSetting()
      .then((setting) => {
        if (active) {
          const granted = setting.authSetting?.['scope.userLocation'];
          setLocationPermission(
            granted === true
              ? 'allowed'
              : granted === false
                ? 'denied'
                : 'unknown',
          );
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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

  async function saveDetails(details: {
    nickname?: string;
    avatarFileId?: string;
  }) {
    if (!profileVersion || savingProfile) return;
    setSavingProfile(true);
    try {
      const updated = await service.updateDetails(details, profileVersion);
      onProfileChange?.(updated);
      setEditingName(false);
      await Taro.showToast({ title: '资料已更新', icon: 'success' });
    } catch (cause) {
      await Taro.showToast({
        title: cause instanceof Error ? cause.message : '保存失败，请稍后重试',
        icon: 'none',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function openAvatarMenu() {
    try {
      const choice = await Taro.showActionSheet({
        itemList: ['查看头像', '修改头像'],
      });
      if (choice.tapIndex === 0) {
        const currentAvatar =
          avatarFileId || '/assets/icons/profile-default.svg';
        await Taro.previewImage({
          current: currentAvatar,
          urls: [currentAvatar],
        });
        return;
      }
      if (choice.tapIndex === 1) setAvatarSourceOpen(true);
    } catch {
      // 用户取消底部操作，不改变当前头像。
    }
  }

  async function selectAvatarFrom(sourceType: 'album' | 'camera') {
    try {
      const selected = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: [sourceType],
      });
      const tempFilePath = selected.tempFiles[0]?.tempFilePath;
      if (!tempFilePath) return;
      setAvatarSourceOpen(false);
      setPendingAvatarPath(tempFilePath);
    } catch {
      // 用户取消系统图片选择，不改变当前头像。
    }
  }

  async function confirmAvatar() {
    if (!pendingAvatarPath || savingProfile) return;
    const suffix = pendingAvatarPath.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
    try {
      const uploaded = await Taro.cloud.uploadFile({
        cloudPath: `profile-avatars/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}${suffix}`,
        filePath: pendingAvatarPath,
      });
      await saveDetails({ avatarFileId: uploaded.fileID });
      setPendingAvatarPath('');
    } catch (cause) {
      await Taro.showToast({
        title:
          cause instanceof Error ? cause.message : '头像上传失败，请稍后重试',
        icon: 'none',
      });
    }
  }

  async function requestLocationPermission() {
    if (locationBusy) return;
    setLocationBusy(true);
    try {
      await Taro.getLocation({ type: 'gcj02' });
      setLocationPermission('allowed');
      await Taro.showToast({ title: '定位授权已开启', icon: 'success' });
    } catch {
      setLocationPermission('denied');
      await Taro.showToast({
        title: '请再次点击开关前往设置开启定位',
        icon: 'none',
      });
    } finally {
      setLocationBusy(false);
    }
  }

  return (
    <View className="profile-center">
      <View className="profile-center__hero">
        <Button
          className="profile-center__avatar"
          aria-label="查看或修改头像"
          onClick={() => void openAvatarMenu()}
        >
          {avatarFileId ? (
            <Image
              className="profile-center__avatar-image"
              data-testid="profile-avatar"
              src={avatarFileId}
              mode="aspectFill"
            />
          ) : (
            <Image
              className="profile-center__avatar-image"
              data-testid="profile-avatar"
              src="/assets/icons/profile-default.svg"
              mode="aspectFill"
            />
          )}
        </Button>
        <Button
          className="profile-center__name"
          aria-label="查看或修改昵称"
          onClick={() => {
            setDraftName(nickname);
            setEditingName(true);
          }}
        >
          {nickname}
        </Button>
        <View className="profile-center__feel-pill">
          <Text className="profile-center__feel-icon">❄</Text>
          <Text>最近体感: {recentFeelLabel}</Text>
        </View>
      </View>

      {preferenceSlot ? (
        <View className="profile-center__preference">{preferenceSlot}</View>
      ) : null}

      <View className="profile-center__settings">
        <View className="profile-center__group profile-center__help">
          <View className="profile-center__group-heading">
            <Text className="profile-center__group-icon">?</Text>
            <Text>帮助与支持</Text>
          </View>
          {FAQS.map((faq, index) => {
            const expanded = activeFaq === index;
            return (
              <View className="profile-center__faq" key={faq.question}>
                <Button
                  aria-label={faq.question}
                  onClick={() => setActiveFaq(expanded ? undefined : index)}
                >
                  <Text>{faq.question}</Text>
                  <Text className={expanded ? 'is-expanded' : ''}>⌄</Text>
                </Button>
                {expanded ? (
                  <Text className="profile-center__faq-answer">
                    {faq.answer}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View className="profile-center__group profile-center__menu">
          <View className="profile-center__menu-row">
            <Image
              className="profile-center__menu-icon"
              src="/assets/icons/profile-location.svg"
            />
            <View>
              <Text className="profile-center__menu-title">地理定位授权</Text>
              <Text className="profile-center__menu-caption">
                自动读取当前城市实时天气
              </Text>
            </View>
            <Button
              className={`profile-center__switch${
                locationPermission === 'allowed'
                  ? ' profile-center__switch--on'
                  : ''
              }`}
              aria-label="地理定位授权"
              aria-pressed={locationPermission === 'allowed'}
              loading={locationBusy}
              disabled={locationBusy}
              openType={
                locationPermission === 'unknown' ? undefined : 'openSetting'
              }
              onClick={
                locationPermission === 'unknown'
                  ? () => void requestLocationPermission()
                  : undefined
              }
              onOpenSetting={(event) => {
                setLocationPermission(
                  event.detail.authSetting['scope.userLocation'] === true
                    ? 'allowed'
                    : 'denied',
                );
              }}
            >
              <Text />
            </Button>
          </View>
          <Button
            aria-label="用户协议与隐私政策"
            onClick={() =>
              void Taro.navigateTo({
                url: '/pages/legal/index?document=agreement',
              })
            }
          >
            <Image
              className="profile-center__menu-icon"
              src="/assets/icons/profile-policy.svg"
            />
            <View>
              <Text className="profile-center__menu-title">
                用户协议 / 隐私政策
              </Text>
              <Text className="profile-center__menu-caption">
                查看服务与隐私约定
              </Text>
            </View>
            <Text className="profile-center__menu-more">›</Text>
          </Button>
          <Button
            aria-label="账号与数据说明"
            onClick={() =>
              void showInfo(
                '账号与数据说明',
                '退出登录不会删除云端数据。当前版本暂不支持账号注销；相关能力后续将按微信平台规则提供。',
              )
            }
          >
            <Image
              className="profile-center__menu-icon"
              src="/assets/icons/profile-data.svg"
            />
            <View>
              <Text className="profile-center__menu-title">账号与数据说明</Text>
              <Text className="profile-center__menu-caption">
                了解退出登录和云端数据
              </Text>
            </View>
            <Text className="profile-center__menu-more">›</Text>
          </Button>
        </View>

        <Button
          className="profile-center__danger"
          aria-label="退出当前账户"
          onClick={() => void logout()}
        >
          <Text className="profile-center__danger-icon">↪</Text>
          <Text>退出当前账户</Text>
        </Button>
      </View>
      {avatarSourceOpen ? (
        <View
          className="profile-center__sheet-mask"
          onClick={() => setAvatarSourceOpen(false)}
        >
          <View
            className="profile-center__sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <Text className="profile-center__sheet-title">修改头像</Text>
            <Button
              aria-label="使用微信头像"
              openType="chooseAvatar"
              onChooseAvatar={(event) => {
                const avatarUrl = event.detail.avatarUrl;
                if (!avatarUrl) return;
                setAvatarSourceOpen(false);
                setPendingAvatarPath(avatarUrl);
              }}
            >
              使用微信头像
            </Button>
            <Button
              aria-label="从相册选择"
              onClick={() => void selectAvatarFrom('album')}
            >
              从相册选择
            </Button>
            <Button
              aria-label="拍照上传"
              onClick={() => void selectAvatarFrom('camera')}
            >
              拍照上传
            </Button>
            <Button
              className="is-cancel"
              onClick={() => setAvatarSourceOpen(false)}
            >
              取消
            </Button>
          </View>
        </View>
      ) : null}
      {pendingAvatarPath ? (
        <View className="profile-center__modal-mask">
          <View className="profile-center__modal">
            <Text className="profile-center__modal-title">确认使用此头像</Text>
            <Image
              className="profile-center__avatar-preview"
              src={pendingAvatarPath}
              mode="aspectFill"
            />
            <View className="profile-center__modal-actions">
              <Button onClick={() => setPendingAvatarPath('')}>取消</Button>
              <Button
                className="is-primary"
                loading={savingProfile}
                disabled={savingProfile}
                onClick={() => void confirmAvatar()}
              >
                确认使用
              </Button>
            </View>
          </View>
        </View>
      ) : null}
      {editingName ? (
        <View className="profile-center__modal-mask">
          <View className="profile-center__modal">
            <Text className="profile-center__modal-title">修改昵称</Text>
            <Input
              aria-label="昵称（可使用微信昵称）"
              type="nickname"
              maxlength={40}
              placeholder="输入昵称或选择微信昵称"
              value={draftName}
              onInput={(event) => setDraftName(event.detail.value)}
            />
            <View className="profile-center__modal-actions">
              <Button onClick={() => setEditingName(false)}>取消</Button>
              <Button
                className="is-primary"
                loading={savingProfile}
                disabled={!draftName.trim() || savingProfile}
                onClick={() => void saveDetails({ nickname: draftName.trim() })}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
