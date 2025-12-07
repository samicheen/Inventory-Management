import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  user: User; // Assigned from initialState by ngx-bootstrap
  addUserForm: FormGroup;
  saveUser: Subject<User>;
  isEditMode: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    public modalRef: BsModalRef
  ) { }

  get username(): FormControl {
    return this.addUserForm.get('username') as FormControl;
  }

  get email(): FormControl {
    return this.addUserForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.addUserForm.get('password') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.addUserForm.get('confirmPassword') as FormControl;
  }

  get role(): FormControl {
    return this.addUserForm.get('role') as FormControl;
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.isEditMode = !!this.user;
    
    this.saveUser = new Subject();
    this.addUserForm = this.formBuilder.group({
      username: [this.user?.username || '', [Validators.required, Validators.minLength(3)]],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]],
      role: [this.user?.role || 'user', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    // Only validate if password is provided (for edit mode, password is optional)
    if (password && confirmPassword && password.value && confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
    }
    return null;
  }

  addUser() {
    if (this.addUserForm.valid) {
      const formValue = this.addUserForm.value;
      const user: User = {
        username: formValue.username,
        email: formValue.email,
        role: formValue.role
      };
      
      // Only include password if it's provided (for edit mode, password is optional)
      if (formValue.password && formValue.password.trim() !== '') {
        user.password = formValue.password;
      }
      
      // Include user_id if editing
      if (this.isEditMode && this.user?.user_id) {
        user.user_id = this.user.user_id;
      }
      
      this.saveUser.next(user);
      this.modalRef.hide();
    } else {
      this.addUserForm.markAllAsTouched();
    }
  }
}

