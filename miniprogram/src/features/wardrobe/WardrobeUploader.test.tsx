import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WardrobeUploader } from './WardrobeUploader';

describe('WardrobeUploader', () => {
  it('未填写名称时仍可选择拍照或相册，并使用默认衣物名称', () => {
    const onChoose = vi.fn();
    render(<WardrobeUploader status="idle" onChoose={onChoose} />);

    const camera = screen.getByRole('button', { name: '拍照上传' });
    const album = screen.getByRole('button', { name: '相册选择' });
    expect(camera).toBeEnabled();
    expect(album).toBeEnabled();
    expect(camera).toHaveClass('wardrobe-upload__action--camera');
    expect(album).toHaveClass('wardrobe-upload__action--album');

    fireEvent.click(camera);
    fireEvent.click(album);
    expect(onChoose).toHaveBeenNthCalledWith(1, 'camera', {
      name: '未命名衣物',
      category: 'top',
      color: '黑色',
    });
    expect(onChoose).toHaveBeenNthCalledWith(2, 'album', {
      name: '未命名衣物',
      category: 'top',
      color: '黑色',
    });
  });

  it('展示拍摄指南并允许选择相机或相册', () => {
    const onChoose = vi.fn();
    render(<WardrobeUploader status="idle" onChoose={onChoose} />);
    expect(screen.getByText(/衣物平铺/)).toBeInTheDocument();
    expect(screen.queryByText(/云端抠图对齐标准/)).not.toBeInTheDocument();
    fireEvent.input(screen.getByLabelText('衣物名称'), {
      target: { value: '黑色防晒衫' },
    });
    fireEvent.click(screen.getByRole('button', { name: '配饰' }));
    fireEvent.click(screen.getByText('黑色'));
    fireEvent.click(screen.getByRole('button', { name: '拍照上传' }));
    fireEvent.click(screen.getByRole('button', { name: '相册选择' }));
    expect(onChoose).toHaveBeenNthCalledWith(1, 'camera', {
      name: '黑色防晒衫',
      category: 'accessory',
      color: '黑色',
    });
    expect(onChoose).toHaveBeenNthCalledWith(2, 'album', {
      name: '黑色防晒衫',
      category: 'accessory',
      color: '黑色',
    });
  });

  it('上传中禁用重复选择，失败和成功均给出明确状态', () => {
    const { rerender } = render(
      <WardrobeUploader status="uploading" onChoose={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '正在上传…' })).toBeDisabled();
    rerender(
      <WardrobeUploader
        status="failed"
        error="图片上传失败，请重试"
        onChoose={vi.fn()}
      />,
    );
    expect(screen.getByText('图片上传失败，请重试')).toBeInTheDocument();
    rerender(<WardrobeUploader status="uploaded" onChoose={vi.fn()} />);
    expect(screen.getByText('原图上传成功，等待智能抠图')).toBeInTheDocument();
  });

  it('展示抠图处理中、前后对比和失败重试', () => {
    const onRetry = vi.fn();
    const onConfirm = vi.fn();
    const onRetake = vi.fn();
    const { rerender } = render(
      <WardrobeUploader
        status="processing"
        sourcePreview="/tmp/source.jpg"
        onChoose={vi.fn()}
        onRetry={onRetry}
        onConfirm={onConfirm}
        onRetake={onRetake}
      />,
    );
    expect(screen.getAllByText('正在智能抠图…').length).toBeGreaterThan(0);
    rerender(
      <WardrobeUploader
        status="succeeded"
        sourcePreview="/tmp/source.jpg"
        processedFileId="cloud://processed.png"
        onChoose={vi.fn()}
        onRetry={onRetry}
        onConfirm={onConfirm}
        onRetake={onRetake}
      />,
    );
    expect(
      screen.getByLabelText('抠图前').querySelector('img'),
    ).toHaveAttribute('src', '/tmp/source.jpg');
    expect(
      screen.getByLabelText('抠图后').querySelector('img'),
    ).toHaveAttribute('src', 'cloud://processed.png');
    fireEvent.input(screen.getByLabelText('衣物名称'), {
      target: { value: '修改后的黑色短袖' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下装' }));
    fireEvent.click(screen.getByRole('button', { name: '确认入库' }));
    fireEvent.click(screen.getByRole('button', { name: '重新拍摄' }));
    expect(onConfirm).toHaveBeenCalledWith({
      name: '修改后的黑色短袖',
      category: 'bottom',
      color: '黑色',
    });
    expect(onRetake).toHaveBeenCalledTimes(1);
    rerender(
      <WardrobeUploader
        status="cutout_failed"
        error="智能抠图失败，请重试"
        sourcePreview="/tmp/source.jpg"
        onChoose={vi.fn()}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '重新抠图' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('展示抠图结果时保留已填写的衣物基本信息和原位置', () => {
    const { rerender } = render(
      <WardrobeUploader status="idle" onChoose={vi.fn()} />,
    );
    fireEvent.input(screen.getByLabelText('衣物名称'), {
      target: { value: '黑色短袖' },
    });
    fireEvent.click(screen.getByRole('button', { name: '下装' }));

    rerender(
      <WardrobeUploader
        status="succeeded"
        sourcePreview="/tmp/source.jpg"
        processedFileId="cloud://processed.png"
        onChoose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('衣物名称')).toHaveValue('黑色短袖');
    expect(screen.getByRole('button', { name: '下装' })).toHaveClass(
      'is-active',
    );
    expect(screen.getByText('主色调')).toBeInTheDocument();
    expect(screen.getByText('黑色')).toBeInTheDocument();
    expect(screen.getByLabelText('衣物名称')).toAppearBefore(
      screen.getByLabelText('抠图前'),
    );
    expect(screen.getByLabelText('抠图后')).toAppearBefore(
      screen.getByRole('button', { name: '拍照上传' }),
    );
    expect(screen.getByRole('button', { name: '确认入库' })).toAppearBefore(
      screen.getByRole('button', { name: '拍照上传' }),
    );
  });
});
