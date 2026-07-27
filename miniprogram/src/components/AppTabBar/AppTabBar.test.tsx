import { fireEvent, render, screen } from '@testing-library/react';
import Taro from '@tarojs/taro';
import { describe, expect, it, vi } from 'vitest';

import { AppTabBar } from './AppTabBar';

describe('AppTabBar', () => {
  it('未登录时不渲染导航', () => {
    const { container } = render(<AppTabBar active="home" visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('展示四个一级入口、图标及当前选中状态', () => {
    render(<AppTabBar active="wardrobe" />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(
      screen.getByRole('button', { name: '首页' }).querySelector('img'),
    ).toHaveAttribute('src', '/assets/tabbar/home.svg');
    expect(screen.getByRole('button', { name: '衣橱' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('button', { name: '试穿' }).querySelector('img'),
    ).toHaveAttribute('src', '/assets/tabbar/tryon.svg');
  });

  it('点击入口时切换到对应一级页面', () => {
    render(<AppTabBar active="home" />);

    fireEvent.click(screen.getByRole('button', { name: '场景库' }));

    expect(vi.mocked(Taro.switchTab)).toHaveBeenCalledWith({
      url: '/pages/scenes/index',
    });
  });
});
