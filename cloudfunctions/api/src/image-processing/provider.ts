export interface CutoutProvider {
  submit(input: {
    sourceFileId: string;
    outputPath: string;
  }): Promise<{ taskId: string }>;
  inspect(
    taskId: string,
  ): Promise<
    | { status: "processing" }
    | { status: "succeeded"; processedFileId: string }
    | { status: "failed" }
  >;
}
