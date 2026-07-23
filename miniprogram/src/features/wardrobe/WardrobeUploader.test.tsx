import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WardrobeUploader } from './WardrobeUploader';

describe('WardrobeUploader', () => {
  it('展示拍摄指南并允许选择相机或相册', () => {
    const onChoose = vi.fn();
    render(<WardrobeUploader status="idle" onChoose={onChoose} />);
    expect(screen.getByText(/衣物平铺/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '拍照上传' }));
    fireEvent.click(screen.getByRole('button', { name: '相册选择' }));
    expect(onChoose).toHaveBeenNthCalledWith(1, 'camera');
    expect(onChoose).toHaveBeenNthCalledWith(2, 'album');
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
    fireEvent.click(screen.getByRole('button', { name: '确认入库' }));
    fireEvent.click(screen.getByRole('button', { name: '重新拍摄' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
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
});
