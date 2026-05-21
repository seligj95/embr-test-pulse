// Embr Blob storage helper.
// Embr injects:
//   EMBR_BLOB_URL  — container or service URL (with or without SAS)
//   EMBR_BLOB_KEY  — storage account key (only when URL is unsigned)
//
// We use @azure/storage-blob with the StorageSharedKeyCredential path
// when EMBR_BLOB_KEY is provided.
import {
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

const CONTAINER = 'pulse-uploads';

let cachedContainer: ContainerClient | null = null;

export async function getContainer(): Promise<ContainerClient | null> {
  if (cachedContainer) return cachedContainer;
  const blobUrl = process.env.EMBR_BLOB_URL;
  const blobKey = process.env.EMBR_BLOB_KEY;
  if (!blobUrl) return null;

  let serviceClient: BlobServiceClient;
  if (blobKey) {
    const u = new URL(blobUrl);
    const accountName = u.host.split('.')[0];
    serviceClient = new BlobServiceClient(
      `${u.protocol}//${u.host}`,
      new StorageSharedKeyCredential(accountName, blobKey),
    );
  } else {
    serviceClient = new BlobServiceClient(blobUrl);
  }

  const container = serviceClient.getContainerClient(CONTAINER);
  try {
    await container.createIfNotExists({ access: 'blob' });
  } catch {
    await container.createIfNotExists();
  }
  cachedContainer = container;
  return container;
}

export async function uploadAvatar(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<string | null> {
  const container = await getContainer();
  if (!container) return null;
  const blob = container.getBlockBlobClient(key);
  await blob.uploadData(bytes, { blobHTTPHeaders: { blobContentType: contentType } });
  return blob.url;
}

export async function avatarUrl(key: string): Promise<string | null> {
  const container = await getContainer();
  if (!container) return null;
  return container.getBlockBlobClient(key).url;
}
