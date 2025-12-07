export interface User {
  user_id?: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  password?: string; // Only for create/update forms, never returned from API
}

