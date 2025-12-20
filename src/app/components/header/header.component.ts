import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../models/auth.model';
import { BarcodeScannerService } from '../../services/barcode/barcode-scanner.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isMobile = false; // Will be set in ngOnInit
  sidebarOpen = false; // Sidebar is closed by default
  currentPageTitle: string = 'Dashboard';
  private routerSubscription?: Subscription;

  // Route to page title mapping
  private routeTitleMap: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/item': 'Item',
    '/processing-type': 'Processing Type',
    '/user': 'Users',
    '/vendor': 'Vendor',
    '/customer': 'Customer',
    '/purchase': 'Purchase',
    '/inventory': 'Inventory',
    '/manufacture': 'Manufacturing',
    '/sales': 'Sales',
    '/summary': 'Summary',
    '/email': 'Email'
  };

  constructor(
    public authService: AuthService,
    private barcodeScannerService: BarcodeScannerService,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    // Check if running on native platform (mobile app)
    this.isMobile = Capacitor.isNativePlatform();
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Set initial page title
    this.updatePageTitle(this.router.url);

    // Subscribe to route changes
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updatePageTitle(event.url);
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updatePageTitle(url: string): void {
    // Remove query params and hash
    const path = url.split('?')[0].split('#')[0];
    
    // Check if it's a route with parameter (e.g., /inventory/123)
    if (path.startsWith('/inventory/')) {
      this.currentPageTitle = 'Inventory';
    } else {
      // Get title from map or default to 'Dashboard'
      this.currentPageTitle = this.routeTitleMap[path] || 'Dashboard';
    }
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
