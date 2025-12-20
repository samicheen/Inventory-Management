import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../models/auth.model';
import { BarcodeScannerService } from '../../services/barcode/barcode-scanner.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isMobile = false; // Will be set in ngOnInit
  sidebarOpen = false; // Sidebar is closed by default

  constructor(
    public authService: AuthService,
    private barcodeScannerService: BarcodeScannerService
  ) { }
  
  ngOnInit(): void {
    // Check if running on native platform (mobile app)
    this.isMobile = Capacitor.isNativePlatform();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
  
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  scanBarcode(barcode: string): void {
    if (barcode && barcode.trim()) {
      this.barcodeScannerService.scanBarcode(barcode.trim());
    }
  }

  async openBarcodeScanner(): Promise<void> {
    const barcode = await this.barcodeScannerService.scanBarcodeWithCamera();
    if (barcode) {
      this.scanBarcode(barcode);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Close sidebar after navigation (on all screen sizes)
   */
  closeSidebarOnNavigation(): void {
    this.sidebarOpen = false;
  }
}
