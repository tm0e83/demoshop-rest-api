type ApiKey = {
  id: string;
  label: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revoked: boolean;
  hash: string;
}