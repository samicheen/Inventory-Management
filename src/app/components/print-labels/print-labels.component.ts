import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NotificationService } from '../../services/notification/notification.service';
import * as QRCode from 'qrcode';

// QR Code data structure
export interface QRCodeData {
  barcode: string;
  itemName: string;
  quantity: number; // Net quantity (after packaging weight deduction if applicable)
  unit: string;
}

@Component({
  selector: 'app-print-labels',
  templateUrl: './print-labels.component.html',
  styleUrls: ['./print-labels.component.scss']
})
export class PrintLabelsComponent implements OnInit, AfterViewInit {
  // Properties assigned from initialState by ngx-bootstrap (no @Input() needed)
  barcode: string;
  itemName: string;
  quantity: number;
  unit: string;
  labelCount: number = 1; // Number of labels to print (auto-set from package_quantity)
  netQuantity?: number; // Net quantity (after packaging weight deduction)
  allPackages?: any[]; // All packages for batch printing

  @ViewChild('qrcodeCanvas', { static: false }) qrcodeCanvas: ElementRef;

  constructor(
    public modalRef: BsModalRef,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // If allPackages is provided, use its length for labelCount
    // This ensures labelCount matches the actual number of packages
    if (this.allPackages && this.allPackages.length > 0) {
      this.labelCount = this.allPackages.length;
    }
  }

  ngAfterViewInit(): void {
    // Ensure labelCount is set correctly from allPackages if available
    // This is critical because ngx-bootstrap may assign initialState after ngOnInit
    if (this.allPackages && this.allPackages.length > 0) {
      if (this.labelCount !== this.allPackages.length) {
        this.labelCount = this.allPackages.length;
      }
    }
    
    // Generate QR codes after view is initialized
    // Use a longer delay to ensure modal content is fully rendered
    this.generateQRCodes();
  }

  generateQRCodes(): void {
    if (!this.barcode) return;

    // Generate QR code for each label
    // Use a longer timeout and retry mechanism to ensure canvas elements are ready
    const maxRetries = 10;
    let retryCount = 0;
    
    const tryGenerate = () => {
      // Look for canvas elements within the modal (more specific selector)
      const modalElement = document.querySelector('.modal.show') || document.body;
      const canvasElements = modalElement.querySelectorAll('.qrcode-canvas');
      
      // Ensure we have the expected number of canvas elements
      if (canvasElements.length === this.labelCount) {
        // Canvas elements found, generate QR codes
        canvasElements.forEach((canvas: any, index: number) => {
          try {
            if (canvas instanceof HTMLCanvasElement) {
              this.generateQRCodeOnCanvas(canvas, index);
            }
          } catch (error) {
          }
        });
      } else if (canvasElements.length > 0 && canvasElements.length < this.labelCount) {
        // Some canvas elements found but not all - generate for what we have
        canvasElements.forEach((canvas: any, index: number) => {
          try {
            if (canvas instanceof HTMLCanvasElement) {
              this.generateQRCodeOnCanvas(canvas, index);
            }
          } catch (error) {
          }
        });
        // Retry to get remaining ones
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(tryGenerate, 100);
        }
      } else if (retryCount < maxRetries) {
        // Canvas elements not found yet, retry after a short delay
        retryCount++;
        setTimeout(tryGenerate, 100);
      }
    };
    
    // Start trying after a short initial delay to ensure DOM is ready
    setTimeout(tryGenerate, 300);
  }

  generateQRCodeOnCanvas(canvas: HTMLCanvasElement, index: number): void {
    // Create QR code data with weight information (same structure as print)
    // quantity field contains net quantity (after packaging weight deduction if applicable)
    let qrData: QRCodeData = {
      barcode: this.barcode,
      itemName: this.itemName,
      quantity: this.netQuantity !== undefined && this.netQuantity !== null ? this.netQuantity : this.quantity,
      unit: this.unit
    };
    
    // If we have multiple packages, use the specific package data
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      qrData.barcode = pkg.package_barcode || pkg.barcode || this.barcode;
      // Use net_quantity if available (after packaging weight), otherwise use quantity
      qrData.quantity = pkg.net_quantity !== undefined && pkg.net_quantity !== null 
        ? pkg.net_quantity 
        : (pkg.quantity !== undefined && pkg.quantity !== null ? pkg.quantity : this.quantity);
      // Use package-specific item name if available
      if (pkg.item_name && pkg.item_grade !== undefined && pkg.item_size !== undefined) {
        qrData.itemName = `${pkg.item_name} Grade: ${pkg.item_grade} Size: ${pkg.item_size}`;
      }
    }
    
    // Create QR code data string (JSON format) - same structure as print output
    const qrDataString = JSON.stringify(qrData);
    
    // Use QRCode library (imported from npm package)
    QRCode.toCanvas(canvas, qrDataString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).catch((error: any) => {
    });
  }

  getLabelArray(): number[] {
    return Array.from({ length: this.labelCount }, (_, i) => i + 1);
  }

  getTotalQuantity(): number {
    // If allPackages is provided and has entries, sum up all package net_quantities
    if (this.allPackages && this.allPackages.length > 0) {
      const total = this.allPackages.reduce((sum, pkg) => {
        // Try net_quantity first, then quantity, then fallback to 0
        const qty = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
          ? Number(pkg.net_quantity) 
          : ((pkg.quantity !== undefined && pkg.quantity !== null) 
            ? Number(pkg.quantity) 
            : 0);
        return sum + (isNaN(qty) ? 0 : qty);
      }, 0);
      return isNaN(total) ? 0 : total;
    }
    // If no allPackages, use the quantity passed in (already represents total)
    // Prefer netQuantity over quantity
    const singleQty = (this.netQuantity !== undefined && this.netQuantity !== null) 
      ? Number(this.netQuantity) 
      : ((this.quantity !== undefined && this.quantity !== null) ? Number(this.quantity) : 0);
    return isNaN(singleQty) ? 0 : singleQty;
  }

  getPackageQuantity(index: number): number {
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      const qty = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
        ? Number(pkg.net_quantity) 
        : ((pkg.quantity !== undefined && pkg.quantity !== null) ? Number(pkg.quantity) : 0);
      return isNaN(qty) ? 0 : qty;
    }
    // Fallback to netQuantity or quantity
    const qty = (this.netQuantity !== undefined && this.netQuantity !== null) 
      ? Number(this.netQuantity) 
      : ((this.quantity !== undefined && this.quantity !== null) ? Number(this.quantity) : 0);
    return isNaN(qty) ? 0 : qty;
  }

  getPackageItemName(index: number): string {
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      if (pkg.item_name && pkg.item_grade !== undefined && pkg.item_size !== undefined) {
        return `${pkg.item_name} Grade: ${pkg.item_grade} Size: ${pkg.item_size}`;
      }
    }
    return this.itemName;
  }

  getPackageUnit(index: number): string {
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      if (pkg.unit) {
        return pkg.unit;
      }
    }
    return this.unit;
  }

  onLabelCountChange(): void {
    // If allPackages exists, don't allow labelCount to exceed allPackages.length
    if (this.allPackages && this.allPackages.length > 0) {
      if (this.labelCount > this.allPackages.length) {
        this.labelCount = this.allPackages.length;
      }
    }
    // Regenerate QR codes when label count changes
    setTimeout(() => {
      this.generateQRCodes();
    }, 100);
  }

  async printLabels(): Promise<void> {
    if (!this.barcode) {
      this.notificationService.showError('Barcode is required for printing');
      return;
    }

    // Generate QR codes first and convert to base64 images
    const qrCodeImages = await this.generateQRCodeImages();

    // Create a new window with only the labels
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup blocked - use current window
      window.print();
      return;
    }

    // Get all label HTML with embedded QR code images
    const labelsHtml = this.getLabelsHtmlWithQRImages(qrCodeImages);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Labels</title>
        <style>
          @page {
            size: 4in 3in;
            margin: 0;
          }
          @media print {
            @page {
              size: 4in 3in;
              margin: 0;
            }
            /* Hide browser headers and footers */
            @page {
              margin: 0;
            }
            /* Force page size for label printers */
            html {
              width: 4in;
              height: 3in;
            }
            body {
              width: 4in;
              height: 3in;
              margin: 0;
              padding: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .barcode-label {
            width: 4in;
            height: 3in;
            border: none;
            padding: 0.08in 0.1in 0.12in 0.1in;
            margin: 0;
            page-break-after: always;
            page-break-inside: avoid;
            display: block;
            box-sizing: border-box;
          }
          .label-content {
            text-align: center;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 0.05in 0.05in 0.08in 0.05in;
            box-sizing: border-box;
          }
          .item-info {
            font-size: 11px;
            margin-bottom: 3px;
            line-height: 1.2;
            font-weight: bold;
            flex-shrink: 0;
            word-wrap: break-word;
            max-width: 100%;
          }
          .quantity-info {
            font-size: 10px;
            color: #000;
            margin-bottom: 4px;
            line-height: 1.2;
            flex-shrink: 0;
          }
          .qrcode-canvas,
          .qrcode-image {
            width: 180px;
            height: 180px;
            max-width: 2.2in;
            margin: 3px 0;
            display: block;
            flex-shrink: 0;
          }
          .qrcode-placeholder {
            width: 180px;
            height: 180px;
            max-width: 2.2in;
            margin: 3px 0;
            display: block;
            background: #f0f0f0;
            border: 1px solid #ccc;
            flex-shrink: 0;
          }
          .barcode-text {
            font-size: 11px;
            font-weight: bold;
            margin-top: 4px;
            margin-bottom: 0;
            font-family: 'Courier New', monospace;
            line-height: 1.2;
            flex-shrink: 0;
            text-align: center;
            width: 100%;
            padding-bottom: 0.02in;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          // QR codes are already embedded as images, just open print dialog
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  private async generateQRCodeImages(): Promise<string[]> {
    const qrCodeImages: string[] = [];
    const itemName = this.itemName || 'Item';
    const defaultQuantity = this.quantity || 0;
    const unit = this.unit || 'KG';
    const defaultBarcode = this.barcode || '';
    const defaultNetQuantity = this.netQuantity !== undefined && this.netQuantity !== null ? this.netQuantity : defaultQuantity;
    
    // If we have allPackages, use them; otherwise create labels from labelCount
    const packagesToPrint = this.allPackages && this.allPackages.length > 0 
      ? this.allPackages 
      : Array.from({ length: this.labelCount }, (_, i) => ({
          package_barcode: defaultBarcode,
          net_quantity: defaultNetQuantity,
          quantity: defaultQuantity
        }));
    
    for (let i = 0; i < packagesToPrint.length; i++) {
      const pkg = packagesToPrint[i];
      // Get package-specific barcode (check both package_barcode and barcode fields)
      const packageBarcode = pkg.package_barcode || pkg.barcode || defaultBarcode;
      
      // Get package-specific item name
      let packageItemName = itemName;
      if (pkg.item_name) {
        if (pkg.item_grade !== undefined && pkg.item_size !== undefined) {
          packageItemName = `${pkg.item_name} Grade: ${pkg.item_grade} Size: ${pkg.item_size}`;
        } else {
          packageItemName = pkg.item_name;
        }
      }
      
      // Get package-specific unit
      const packageUnit = pkg.unit || unit;
      
      // Safely convert to number
      const rawQuantity = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
        ? pkg.net_quantity 
        : ((pkg.quantity !== undefined && pkg.quantity !== null) ? pkg.quantity : defaultNetQuantity);
      const displayQuantity = Number(rawQuantity);
      const safeQuantity = isNaN(displayQuantity) ? 0 : displayQuantity;
      
      // Create QR code data (quantity is already the net quantity)
      const qrData: QRCodeData = {
        barcode: packageBarcode,
        itemName: packageItemName,
        quantity: safeQuantity, // This is already the net quantity
        unit: packageUnit
      };
      
      const qrDataString = JSON.stringify(qrData);
      
      try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        qrCodeImages.push(qrCodeDataUrl);
      } catch (error) {
        // Push empty string as fallback
        qrCodeImages.push('');
      }
    }
    
    return qrCodeImages;
  }

  private getLabelsHtmlWithQRImages(qrCodeImages: string[]): string {
    let html = '';
    const itemName = (this.itemName || 'Item').replace(/'/g, "\\'");
    const defaultQuantity = this.quantity || 0;
    const unit = this.unit || 'KG';
    const defaultBarcode = this.barcode || '';
    const defaultNetQuantity = this.netQuantity !== undefined && this.netQuantity !== null ? this.netQuantity : defaultQuantity;
    
    // If we have allPackages, use them; otherwise create labels from labelCount
    const packagesToPrint = this.allPackages && this.allPackages.length > 0 
      ? this.allPackages 
      : Array.from({ length: this.labelCount }, (_, i) => ({
          package_barcode: defaultBarcode,
          net_quantity: defaultNetQuantity,
          quantity: defaultQuantity
        }));
    
    packagesToPrint.forEach((pkg: any, i: number) => {
      // Get package-specific barcode (check both package_barcode and barcode fields)
      const packageBarcode = pkg.package_barcode || pkg.barcode || defaultBarcode;
      
      // Get package-specific item name
      let packageItemName = itemName;
      if (pkg.item_name) {
        if (pkg.item_grade !== undefined && pkg.item_size !== undefined) {
          packageItemName = `${pkg.item_name} Grade: ${pkg.item_grade} Size: ${pkg.item_size}`;
        } else {
          packageItemName = pkg.item_name;
        }
      }
      
      // Get package-specific unit
      const packageUnit = pkg.unit || unit;
      
      // Safely convert to number
      const rawQuantity = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
        ? pkg.net_quantity 
        : ((pkg.quantity !== undefined && pkg.quantity !== null) ? pkg.quantity : defaultNetQuantity);
      const displayQuantity = Number(rawQuantity);
      const safeQuantity = isNaN(displayQuantity) ? 0 : displayQuantity;
      
      const qrCodeImage = qrCodeImages[i] || '';
      
      // Escape HTML in packageItemName to prevent XSS
      const escapedItemName = packageItemName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      
      html += `
        <div class="barcode-label">
          <div class="label-content">
            <div class="item-info">${escapedItemName}</div>
            <div class="quantity-info">${safeQuantity.toFixed(2)} ${packageUnit}</div>
            ${qrCodeImage ? `<img src="${qrCodeImage}" alt="QR Code" class="qrcode-image" style="width: 180px; height: 180px; max-width: 2.2in; margin: 3px 0; display: block;" />` : '<div class="qrcode-placeholder" style="width: 180px; height: 180px; max-width: 2.2in; margin: 3px 0; display: block; background: #f0f0f0; border: 1px solid #ccc;"></div>'}
            <div class="barcode-text">${packageBarcode}</div>
          </div>
        </div>
      `;
    });
    return html;
  }

  private getLabelsHtml(): string {
    // This method is kept for backward compatibility but not used in print
    return this.getLabelsHtmlWithQRImages([]);
  }

  close(): void {
    this.modalRef.hide();
  }
}

