import { z } from "zod";

export const clothingCategorySchema = z.enum([
  "top",
  "bottom",
  "shoes",
  "accessory",
]);
export const clothingProcessingStatusSchema = z.enum([
  "draft",
  "processing",
  "review",
  "ready",
  "failed",
]);

export const clothingSchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(80),
    category: clothingCategorySchema,
    color: z.string().min(1).max(40),
    sourceFileId: z.string().min(1).max(500),
    processedFileId: z.string().min(1).max(500).optional(),
    processingStatus: clothingProcessingStatusSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int().positive(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.processingStatus !== "review" &&
      value.processingStatus !== "ready" &&
      value.processedFileId !== undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["processedFileId"],
        message: "Processed file requires ready status",
      });
    }
    if (
      (value.processingStatus === "review" ||
        value.processingStatus === "ready") &&
      value.processedFileId === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["processedFileId"],
        message: "Ready clothing requires processed file",
      });
    }
  });

export const clothingListSchema = z
  .object({ items: z.array(clothingSchema).max(500) })
  .strict();

export const createClothingUploadRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    category: clothingCategorySchema,
    color: z.string().trim().min(1).max(40),
    extension: z.enum(["jpg", "jpeg", "png"]),
    mimeType: z.enum(["image/jpeg", "image/png"]),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024),
  })
  .strict()
  .superRefine((value, context) => {
    const expectedMime = value.extension === "png" ? "image/png" : "image/jpeg";
    if (value.mimeType !== expectedMime) {
      context.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "MIME type does not match extension",
      });
    }
  });

export const createClothingUploadResultSchema = z
  .object({
    clothing: clothingSchema,
    uploadPath: z
      .string()
      .regex(
        /^clothing-sources\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)$/,
      ),
  })
  .strict();

export const completeClothingUploadRequestSchema = z
  .object({
    fileId: z
      .string()
      .min(1)
      .max(500)
      .regex(/^cloud:\/\/.+\/clothing-sources\//),
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const createCutoutJobRequestSchema = z
  .object({
    clothingId: z.string().min(1).max(80),
    expectedVersion: z.number().int().positive(),
  })
  .strict();
export const retryCutoutJobRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
  })
  .strict();
export const confirmCutoutJobRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const cutoutJobStatusSchema = z.enum([
  "queued",
  "processing",
  "succeeded",
  "failed",
]);
export const cutoutJobSchema = z
  .object({
    id: z.string().min(1).max(80),
    clothingId: z.string().min(1).max(80),
    status: cutoutJobStatusSchema,
    attempts: z.number().int().min(0).max(2),
    processedFileId: z.string().min(1).max(500).optional(),
    message: z.string().min(1).max(120).optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    version: z.number().int().positive(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "succeeded" && value.processedFileId === undefined) {
      context.addIssue({
        code: "custom",
        path: ["processedFileId"],
        message: "Successful cutout requires processed file",
      });
    }
    if (value.status !== "succeeded" && value.processedFileId !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["processedFileId"],
        message: "Processed file requires successful status",
      });
    }
  });

export type ClothingCategory = z.infer<typeof clothingCategorySchema>;
export type PublicClothingProcessingStatus = z.infer<
  typeof clothingProcessingStatusSchema
>;
export type PublicClothing = z.infer<typeof clothingSchema>;
export type ClothingList = z.infer<typeof clothingListSchema>;
export type CreateClothingUploadRequest = z.infer<
  typeof createClothingUploadRequestSchema
>;
export type CreateClothingUploadResult = z.infer<
  typeof createClothingUploadResultSchema
>;
export type CompleteClothingUploadRequest = z.infer<
  typeof completeClothingUploadRequestSchema
>;
export type CreateCutoutJobRequest = z.infer<
  typeof createCutoutJobRequestSchema
>;
export type RetryCutoutJobRequest = z.infer<typeof retryCutoutJobRequestSchema>;
export type ConfirmCutoutJobRequest = z.infer<
  typeof confirmCutoutJobRequestSchema
>;
export type CutoutJobStatus = z.infer<typeof cutoutJobStatusSchema>;
export type CutoutJob = z.infer<typeof cutoutJobSchema>;
