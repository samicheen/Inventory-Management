export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
}

