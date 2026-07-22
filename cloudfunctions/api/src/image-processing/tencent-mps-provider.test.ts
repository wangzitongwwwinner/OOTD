import assert from "node:assert/strict";
import test from "node:test";

import { TencentMpsCutoutProvider } from "./tencent-mps-provider.ts";

test("以固定 30031 场景提交 URL 输入和 PNG 输出", async () => {
  let request: Record<string, unknown> | undefined;
  const provider = new TencentMpsCutoutProvider({
    client: {
      processImage: async (input) => {
        request = input;
        return { TaskId: "mps_task_1" };
      },
      describeImageTaskDetail: async () => ({ Status: "PROCESSING" }),
    },
    resolveSourceUrl: async (fileId) => {
      assert.equal(fileId, "cloud://source.jpg");
      return "https://temporary.example/source.jpg";
    },
    outputBucket: "ootd-output-1250000000",
    outputRegion: "ap-shanghai",
    outputFileIdPrefix: "cloud://ootd-ai-dev.bucket/",
    timeoutMs: 8000,
  });
  assert.deepEqual(
    await provider.submit({
      sourceFileId: "cloud://source.jpg",
      outputPath: "clothing-processed/clothing_1/cutout_1.png",
    }),
    { taskId: "mps_task_1" },
  );
  assert.deepEqual(request, {
    InputInfo: {
      Type: "URL",
      UrlInputInfo: { Url: "https://temporary.example/source.jpg" },
    },
    OutputStorage: {
      Type: "COS",
      CosOutputStorage: {
        Bucket: "ootd-output-1250000000",
        Region: "ap-shanghai",
      },
    },
    OutputPath: "/clothing-processed/clothing_1/cutout_1.png",
    ScheduleId: 30031,
  });
});

test("解析处理中、成功路径和供应商失败", async () => {
  let detail: Record<string, unknown> = { Status: "PROCESSING" };
  const provider = new TencentMpsCutoutProvider({
    client: {
      processImage: async () => ({ TaskId: "unused" }),
      describeImageTaskDetail: async () => detail,
    },
    resolveSourceUrl: async () => "https://temporary.example/source.jpg",
    outputBucket: "bucket",
    outputRegion: "ap-shanghai",
    outputFileIdPrefix: "cloud://env.bucket/",
    timeoutMs: 8000,
  });
  assert.deepEqual(await provider.inspect("mps_task_1"), {
    status: "processing",
  });
  detail = {
    Status: "FINISH",
    ErrMsg: "",
    ImageProcessTaskResultSet: [
      { Status: "FINISH", Output: { Path: "/output/result.png" } },
    ],
  };
  assert.deepEqual(await provider.inspect("mps_task_1"), {
    status: "succeeded",
    processedFileId: "cloud://env.bucket/output/result.png",
  });
  detail = { Status: "FINISH", ErrMsg: "UnsupportedMediaType" };
  assert.deepEqual(await provider.inspect("mps_task_1"), { status: "failed" });
});
