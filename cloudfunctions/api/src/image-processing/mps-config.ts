interface MpsEnvironment {
  secretId: string;
  secretKey: string;
  outputBucket: string;
  outputRegion: string;
  outputFileIdPrefix: string;
}

export function readMpsEnvironment(
  environment: Record<string, string | undefined>,
): MpsEnvironment | undefined {
  const secretId = environment.MPS_SECRET_ID?.trim();
  const secretKey = environment.MPS_SECRET_KEY?.trim();
  const outputBucket = environment.MPS_OUTPUT_BUCKET?.trim();
  const outputRegion = environment.MPS_OUTPUT_REGION?.trim();
  const outputFileIdPrefix = environment.MPS_OUTPUT_FILE_ID_PREFIX?.trim();
  if (!secretId || !secretKey || !outputBucket || !outputRegion || !outputFileIdPrefix) return undefined;
  return { secretId, secretKey, outputBucket, outputRegion, outputFileIdPrefix };
}
