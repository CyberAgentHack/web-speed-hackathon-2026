import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  endpoint: "https://api.s3-dev.trap.jp/",
  region: "auto",
  credentials: {
    accessKeyId: process.env["MINIO_ACCESS_KEY"] || "",
    secretAccessKey: process.env["MINIO_SECRET_KEY"] || "",
  },
  forcePathStyle: true,
});

export const MINIO_BUCKET = process.env["MINIO_BUCKET"] || "web_speed_hackathon";

export async function uploadFileToS3(key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

export async function emptyS3Bucket() {
  let isTruncated = true;
  let continuationToken: string | undefined;

  while (isTruncated) {
    const listCommand = new ListObjectsV2Command({
      Bucket: MINIO_BUCKET,
      ContinuationToken: continuationToken,
    });
    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: MINIO_BUCKET,
        Delete: {
          Objects: listResponse.Contents.map((c) => ({ Key: c.Key as string })),
        },
      });
      await s3Client.send(deleteCommand);
    }

    isTruncated = listResponse.IsTruncated ?? false;
    continuationToken = listResponse.NextContinuationToken;
  }
}
