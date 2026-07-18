import { Button, Text, View } from '@tarojs/components';
import { useCallback, useEffect, useState } from 'react';

import {
  profileService,
  type FeelPreference,
  type Profile,
} from './profile-service';
import './ProfilePreference.scss';

const OPTIONS: Array<{ value: FeelPreference; label: string }> = [
  { value: 'cold', label: '偏冷' },
  { value: 'comfortable', label: '舒适' },
  { value: 'stuffy', label: '闷热' },
  { value: 'cool', label: '微凉' },
];

interface ProfilePreferenceProps {
  service?: Pick<typeof profileService, 'get' | 'updateFeel'>;
}

export function ProfilePreference({
  service = profileService,
}: ProfilePreferenceProps) {
  const [profile, setProfile] = useState<Profile>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setProfile(await service.get());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '资料加载失败，请稍后重试',
      );
    }
  }, [service]);

  useEffect(() => {
    let active = true;
    void service.get().then(
      (loaded) => {
        if (active) setProfile(loaded);
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
  }, [service]);

  async function select(value: FeelPreference) {
    if (!profile || saving || value === profile.recentFeelPreference) return;
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      setProfile(await service.updateFeel(value, profile.version));
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="profile-preference">
      <Text className="profile-preference__label">最近整体体感</Text>
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
              disabled={saving}
              onClick={() => void select(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </View>
      ) : !error ? (
        <Text>正在加载体感偏好…</Text>
      ) : null}
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
