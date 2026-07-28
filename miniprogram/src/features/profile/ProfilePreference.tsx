import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';

import {
  profileService,
  type FeelPreference,
  type Profile,
} from './profile-service';
import './ProfilePreference.scss';

const OPTIONS: Array<{ value: FeelPreference; label: string; emoji: string }> =
  [
    { value: 'cold', label: '偏冷', emoji: '🥶' },
    { value: 'comfortable', label: '舒适', emoji: '😊' },
    { value: 'stuffy', label: '闷热', emoji: '🥵' },
    { value: 'cool', label: '微凉', emoji: '🍃' },
  ];

interface ProfilePreferenceProps {
  service?: Pick<typeof profileService, 'get' | 'updateFeel'>;
  onProfileChange?(profile: Profile): void;
}

export function ProfilePreference({
  service = profileService,
  onProfileChange,
}: ProfilePreferenceProps) {
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const loaded = await service.get();
      setProfile(loaded);
      onProfileChange?.(loaded);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '资料加载失败，请稍后重试',
      );
    }
  }, [onProfileChange, service]);

  useEffect(() => {
    let active = true;
    void service.get().then(
      (loaded) => {
        if (active) {
          setProfile(loaded);
          onProfileChange?.(loaded);
        }
      },
      (cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error ? cause.message : '资料加载失败，请稍后重试',
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [onProfileChange, service]);

  async function select(value: FeelPreference) {
    if (!profile || saving || value === profile.recentFeelPreference) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const updated = await service.updateFeel(value, profile.version);
      setProfile(updated);
      onProfileChange?.(updated);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="profile-preference">
      <Text className="profile-preference__label">我的抗寒体感倾向</Text>
      {profile ? (
        <View className="profile-preference__options">
          {OPTIONS.map((option) => (
            <Button
              key={option.value}
              className={`profile-preference__option${
                profile.recentFeelPreference === option.value
                  ? ' profile-preference__option--selected'
                  : ''
              }`}
              aria-pressed={profile.recentFeelPreference === option.value}
              aria-label={option.label}
              disabled={saving}
              onClick={() => void select(option.value)}
            >
              <Text>{option.emoji}</Text>
              <Text>{option.label}</Text>
            </Button>
          ))}
        </View>
      ) : !error ? (
        <Text>正在加载体感偏好…</Text>
      ) : null}
      <Text className="profile-preference__hint">
        * 设置后，AI 全天穿衣建议会自动结合您的抗寒特征。
      </Text>
      {saved ? (
        <Text className="profile-preference__success">已保存</Text>
      ) : null}
      {error ? (
        <View className="profile-preference__error">
          <Text>{error}</Text>
          {!profile ? (
            <Button onClick={() => void load()}>重新加载</Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
