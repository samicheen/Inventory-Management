import { Directive, ElementRef, HostListener } from "@angular/core";
import { NgControl } from "@angular/forms";

@Directive({
  selector: '[appDecimalNumber]'
})
export class DecimalNumberDirective{

    allowedKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete', '.'];
    constructor(private control : NgControl) {

    }

    @HostListener('blur',['$event']) onEvent($event){
        if (this.control.value) {
            this.control.control.patchValue(parseFloat(this.control.value).toFixed(2));
        }
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        // Allow Backspace, tab, end, and home keys
        if (this.allowedKeys.indexOf(event.key) !== -1) {
            return;
        }
        let char = String.fromCharCode(event.which);
        if (char.match(/[^0-9]/g)) {
            event.preventDefault();
        }
    }
}