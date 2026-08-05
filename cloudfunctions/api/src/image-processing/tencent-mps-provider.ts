import type { CutoutProvider } from "./provider.ts";

export interface MpsClient {
  processImage(
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  describeImageTaskDetail(input: {
    TaskId: string;
  }): Promise<Record<string, unknown>>;
}

interface Config {
  client: MpsClient;
  resolveSourceUrl: (fileId: string) => Promise<string>;
  outputBucket: string;
  outputRegion: string;
  outputFileIdPrefix: string;
  timeoutMs: number;
}

export class TencentMpsCutoutProvider implements CutoutProvider {
  constructor(private readonly config: Config) {
    if (
      !config.outputBucket ||
      !config.outputRegion ||
      !config.outputFileIdPrefix.startsWith("cloud://")
    ) {
      throw new Error("Invalid MPS output configuration");
    }
    if (!Number.isFinite(config.timeoutMs) || config.timeoutMs <= 0)
      throw new Error("Invalid MPS timeout");
  }

  async submit(input: {
    sourceFileId: string;
    outputPath: string;
  }): Promise<{ taskId: string }> {
    const sourceUrl = await withTimeout(
      this.config.resolveSourceUrl(input.sourceFileId),
      this.config.timeoutMs,
    );
    const result = await withTimeout(
      this.config.client.processImage({
        InputInfo: { Type: "URL", UrlInputInfo: { Url: sourceUrl } },
        OutputStorage: {
          Type: "COS",
          CosOutputStorage: {
            Bucket: this.config.outputBucket,
            Region: this.config.outputRegion,
          },
        },
        OutputPath: `/${input.outputPath.replace(/^\/+/, "")}`,
        ScheduleId: 30031,
      }),
      this.config.timeoutMs,
    );
    if (typeof result.TaskId !== "string" || !result.TaskId)
      throw new Error("Invalid MPS task response");
    return { taskId: result.TaskId };
  }

  async inspect(taskId: string) {
    const detail = await withTimeout(
      this.config.client.describeImageTaskDetail({ TaskId: taskId }),
      this.config.timeoutMs,
    );
    if (detail.Status === "PROCESSING")
      return { status: "processing" as const };
    if (
      detail.Status !== "FINISH" ||
      (typeof detail.ErrMsg === "string" && detail.ErrMsg)
    ) {
      return { status: "failed" as const };
    }
    const results = Array.isArray(detail.ImageProcessTaskResultSet)
      ? detail.ImageProcessTaskResultSet
      : [];
    const successful = results.find(
      (item) =>
        isRecord(item) &&
        (item.Status === "FINISH" || item.Status === "SUCCESS") &&
        isRecord(item.Output) &&
        typeof item.Output.Path === "string",
    );
    if (
      !isRecord(successful) ||
      !isRecord(successful.Output) ||
      typeof successful.Output.Path !== "string"
    ) {
      return { status: "failed" as const };
    }
    const path = successful.Output.Path.replace(/^\/+/, "");
    return {
      status: "succeeded" as const,
      processedFileId:
        this.config.outputFileIdPrefix.replace(/\/+$/, "/") + path,
    };
  }
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MPS timeout")), timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
