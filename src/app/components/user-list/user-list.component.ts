import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AddUserComponent } from '../add-user/add-user.component';
import { AuthService } from '../../services/auth/auth.service';
import { GridColumn } from '../data-grid/data-grid.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, AfterViewInit {
  @ViewChild('actionsTemplate') actionsTemplate: TemplateRef<any>;
  @ViewChild('roleTemplate') roleTemplate: TemplateRef<any>;

  users: User[] = [];
  columns: GridColumn[] = [];
  private readonly refreshItems = new BehaviorSubject(undefined);

  constructor(
    private userService: UserService,
    private modalService: BsModalService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getUsers();
    this.refreshItems.subscribe(() => {
      this.getUsers();
    });
  }

  ngAfterViewInit(): void {
    this.initializeColumns();
  }

  initializeColumns(): void {
    this.columns = [
      { key: 'username', label: 'Username', sortable: true, searchable: true },
      { key: 'email', label: 'Email', sortable: true, searchable: true },
      { 
        key: 'role', 
        label: 'Role', 
        sortable: true,
        cellTemplate: this.roleTemplate
      }
    ];
  }

  trackByUserId(index: number, user: User): string {
    return user.user_id ? String(user.user_id) : index.toString();
  }

  getUsers() {
    this.userService.getUsers().subscribe(
      (response) => {
        if (response.success) {
          console.log('Users response:', response.users); // Debug log
          this.users = response.users;
        } else {
          this.notificationService.showError('Unable to load users');
        }
      },
      (error) => {
        this.notificationService.showError('Error loading users: ' + (error.error?.message || error.message));
      }
    );
  }

  addUser() {
    const initialState = {};
    let addUserModalRef = this.modalService.show(AddUserComponent, { initialState, backdrop: 'static', keyboard: false });
    addUserModalRef.content.saveUser.subscribe(user => {
      this.userService.createUser(user).subscribe(
        (response) => {
          if (response.success) {
            this.notificationService.showSuccess('User created successfully');
            this.refreshItems.next(undefined);
          } else {
            this.notificationService.showError(response.message || 'Unable to create user');
          }
        },
        (error) => {
          this.notificationService.showError('Error creating user: ' + (error.error?.message || error.message));
        }
      );
    });
  }

  editUser(user: User) {
    const initialState = {
      user: user
    };
    let editUserModalRef = this.modalService.show(AddUserComponent, { initialState, backdrop: 'static', keyboard: false });
    editUserModalRef.content.saveUser.subscribe(updatedUser => {
      updatedUser.user_id = user.user_id;
      this.userService.updateUser(updatedUser).subscribe(
        (response) => {
          if (response.success) {
            this.notificationService.showSuccess('User updated successfully');
            this.refreshItems.next(undefined);
          } else {
            this.notificationService.showError(response.message || 'Unable to update user');
          }
        },
        (error) => {
          this.notificationService.showError('Error updating user: ' + (error.error?.message || error.message));
        }
      );
    });
  }

  removeUser(user: User) {
    const initialState = {
      title: 'Confirm Removal',
      message: `Are you sure you want to remove user "${user.username}"? This action cannot be undone.`,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    };

    const modalRef = this.modalService.show(ConfirmDialogComponent, {
      initialState,
      backdrop: 'static',
      keyboard: false,
      class: 'modal-md'
    });

    if (modalRef.content) {
      modalRef.content.result.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.userService.deleteUser(user.user_id!).subscribe(
            (response) => {
              if (response.success) {
                this.notificationService.showSuccess('User removed successfully');
                this.refreshItems.next(undefined);
              } else {
                this.notificationService.showError(response.message || 'Unable to delete user');
              }
            },
            (error) => {
              this.notificationService.showError('Error deleting user: ' + (error.error?.message || error.message));
            }
          );
        }
      });
    }
  }

  getRoleBadgeClass(role: string | undefined): string {
    if (!role) {
      return 'badge-secondary';
    }
    return role === 'admin' ? 'badge-danger' : 'badge-secondary';
  }
}

