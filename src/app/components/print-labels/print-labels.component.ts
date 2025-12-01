import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import * as JsBarcode from 'jsbarcode';

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
  labelCount: number = 1; // Number of labels to print (for multiple spools)

  @ViewChild('barcodeSvg', { static: false }) barcodeSvg: ElementRef;

  constructor(public modalRef: BsModalRef) { }

  ngOnInit(): void {
    // Debug: Log to verify values are being passed
    console.log('PrintLabelsComponent initialized with:', {
      barcode: this.barcode,
      itemName: this.itemName,
      quantity: this.quantity,
      unit: this.unit,
      labelCount: this.labelCount
    });
  }

  ngAfterViewInit(): void {
    // Generate barcode after view is initialized
    this.generateBarcodes();
  }

  generateBarcodes(): void {
    if (!this.barcode) return;

    // Generate barcode for each label
    setTimeout(() => {
      const svgElements = document.querySelectorAll('.barcode-svg');
      svgElements.forEach((svg: any) => {
        try {
          JsBarcode(svg, this.barcode, {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
        } catch (error) {
          console.error('Error generating barcode:', error);
        }
      });
    }, 100);
  }

  getLabelArray(): number[] {
    return Array.from({ length: this.labelCount }, (_, i) => i + 1);
  }

  onLabelCountChange(): void {
    // Regenerate barcodes when label count changes
    setTimeout(() => {
      this.generateBarcodes();
    }, 100);
  }

  printLabels(): void {
    if (!this.barcode) {
      alert('Barcode is required for printing');
      return;
    }

    // Create a new window with only the labels
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup blocked - use current window
      window.print();
      return;
    }

    // Get all label HTML
    const labelsHtml = this.getLabelsHtml();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Labels</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page {
            size: 4in 6in;
            margin: 0;
          }
          @media print {
            @page {
              size: 4in 6in;
              margin: 0;
            }
            /* Hide browser headers and footers */
            @page {
              margin: 0;
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
            height: 6in;
            border: 1px solid #000;
            padding: 0.15in;
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
            justify-content: center;
            align-items: center;
            padding: 0.05in;
          }
          .item-info {
            font-size: 16px;
            margin-bottom: 10px;
            line-height: 1.3;
            font-weight: bold;
          }
          .quantity-info {
            font-size: 14px;
            color: #000;
            margin-bottom: 15px;
            line-height: 1.3;
          }
          .barcode-svg {
            width: 100%;
            max-width: 3.8in;
            height: auto;
            margin: 10px 0;
            display: block;
          }
          .barcode-text {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          // Generate barcodes after page loads
          window.onload = function() {
            const barcodeValue = '${this.barcode}';
            const svgElements = document.querySelectorAll('.barcode-svg');
            svgElements.forEach(function(svg) {
              try {
                JsBarcode(svg, barcodeValue, {
                  format: "CODE128",
                  width: 2,
                  height: 60,
                  displayValue: true,
                  fontSize: 16,
                  margin: 8
                });
              } catch (error) {
                console.error('Error generating barcode:', error);
              }
            });
            
            // Print after barcodes are generated
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

  private getLabelsHtml(): string {
    let html = '';
    const itemName = (this.itemName || 'Item').replace(/'/g, "\\'");
    const quantity = this.quantity || 0;
    const unit = this.unit || 'KG';
    const barcode = this.barcode || '';
    
    for (let i = 0; i < this.labelCount; i++) {
      html += `
        <div class="barcode-label">
          <div class="label-content">
            <div class="item-info">${itemName}</div>
            <div class="quantity-info">${quantity} ${unit}</div>
            <svg class="barcode-svg" id="barcode-${i}"></svg>
            <div class="barcode-text">${barcode}</div>
          </div>
        </div>
      `;
    }
    return html;
  }

  close(): void {
    this.modalRef.hide();
  }
}

