import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

export interface GetUsersResponse {
  success: boolean;
  users: User[];
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<GetUsersResponse> {
    return this.http.get<GetUsersResponse>(`${this.apiUrl}/api/user/getUsers.php`);
  }

  createUser(user: User): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`${this.apiUrl}/api/user/createUser.php`, user);
  }

  updateUser(user: User): Observable<UpdateUserResponse> {
    return this.http.post<UpdateUserResponse>(`${this.apiUrl}/api/user/updateUser.php`, user);
  }

  deleteUser(user_id: number): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.apiUrl}/api/user/deleteUser.php?user_id=${user_id}`);
  }
}

