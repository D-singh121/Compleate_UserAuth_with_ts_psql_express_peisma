export interface User {
  id: string;
  name: string | null;
  email: string;
  password?: string; // Optional, should not be returned in API responses
  createdAt: Date;
  updatedAt: Date;
}
