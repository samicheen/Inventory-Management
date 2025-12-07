import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  returnUrl: string = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // If already logged in, redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const username = this.loginForm.value.username;
      const password = this.loginForm.value.password;
      
      this.authService.login(username, password).subscribe({
        next: (response) => {
          if (response.success) {
            // Redirect to return URL or dashboard
            this.router.navigate([this.returnUrl]);
          } else {
            this.errorMessage = response.message || 'Login failed';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          // Show more detailed error messages
          if (error.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check if the server is running and accessible.';
          } else if (error.status === 401) {
            this.errorMessage = error.error?.message || 'Invalid username or password';
          } else if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Username and password are required';
          } else {
            this.errorMessage = error.error?.message || `Login failed: ${error.statusText || 'Unknown error'}`;
          }
          this.isLoading = false;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}




