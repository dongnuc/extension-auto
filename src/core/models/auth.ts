export interface UserSupabaseProjectConfig {
  userId: string;
  projectUrl: string;
  anonKey: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CachedSupabaseProjectConfig {
  projectUrl: string;
  anonKey: string;
}
