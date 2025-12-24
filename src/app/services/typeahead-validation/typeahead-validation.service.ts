import { Injectable } from '@angular/core';
import { FormControl, FormGroup, FormArray, AbstractControl } from '@angular/forms';
import { Item } from '../../models/item.model';
import { Party } from '../../models/party.model';

@Injectable({
  providedIn: 'root'
})
export class TypeaheadValidationService {

  constructor() { }

  /**
   * Validate and get selected item from typeahead
   * Checks in order: stored object, form value match, stored item_id
   * @param formValue The form control value (display string)
   * @param storedItemObj The stored item object from onSelectItem
   * @param storedItemId The stored item_id from onSelectItem
   * @param itemsList The full list of items to search
   * @param formControl The form control to set errors on
   * @returns The validated Item object, or null if not found
   */
  validateAndGetItem(
    formValue: string,
    storedItemObj: Item | null | undefined,
    storedItemId: string | null | undefined,
    itemsList: Item[] | null | undefined,
    formControl?: FormControl
  ): Item | null {
    let selectedItem: Item | null = null;

    // 1. Prioritize stored item object if it matches form value (autofill selection)
    if (storedItemObj && formValue) {
      const expectedFormat = `${storedItemObj.name} Grade: ${storedItemObj.grade} Size: ${storedItemObj.size}`;
      if (formValue === expectedFormat) {
        selectedItem = storedItemObj;
      }
    }

    // 2. If not found, try to find by parsing the form value (exact match)
    if (!selectedItem && itemsList && formValue) {
      selectedItem = itemsList.find(i => {
        const expectedFormat = `${i.name} Grade: ${i.grade} Size: ${i.size}`;
        return expectedFormat === formValue;
      }) || null;
    }

    // 3. If still not found, try by stored item_id (fallback)
    if (!selectedItem && storedItemId && itemsList) {
      selectedItem = itemsList.find(i => i.item_id === storedItemId) || null;
    }

    // 4. If still not found, set error on form control
    if (!selectedItem && formControl) {
      const currentErrors = formControl.errors || {};
      formControl.setErrors({ ...currentErrors, itemNotSelected: true });
      formControl.markAsTouched();
    } else if (selectedItem && formControl?.errors?.itemNotSelected) {
      // Clear itemNotSelected error if validation passes (but keep other errors like required)
      const errors = { ...formControl.errors };
      delete errors.itemNotSelected;
      formControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return selectedItem;
  }

  /**
   * Validate and get selected party (vendor/customer) from typeahead
   * Checks in order: stored object, exact name match
   * @param formValue The form control value (party name)
   * @param storedPartyObj The stored party object from onSelectParty
   * @param partiesList The full list of parties to search
   * @param formControl The form control to set errors on
   * @param errorKey The error key to use (e.g., 'vendorNotSelected' or 'customerNotSelected')
   * @returns The validated Party object, or null if not found
   */
  validateAndGetParty(
    formValue: string,
    storedPartyObj: Party | null | undefined,
    partiesList: Party[] | null | undefined,
    formControl?: FormControl,
    errorKey: string = 'partyNotSelected'
  ): Party | null {
    let selectedParty: Party | null = null;

    // 1. Prioritize stored party object if it matches form value (autofill selection)
    if (storedPartyObj && storedPartyObj.name === formValue) {
      selectedParty = storedPartyObj;
    }

    // 2. If not found, try to find by exact name match
    if (!selectedParty && partiesList && formValue) {
      selectedParty = partiesList.find(p => p.name === formValue) || null;
    }

    // 3. If still not found, set error on form control
    if (!selectedParty && formControl) {
      const currentErrors = formControl.errors || {};
      formControl.setErrors({ ...currentErrors, [errorKey]: true });
      formControl.markAsTouched();
    } else if (selectedParty && formControl?.errors?.[errorKey]) {
      // Clear the error if validation passes (but keep other errors like required)
      const errors = { ...formControl.errors };
      delete errors[errorKey];
      formControl.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }

    return selectedParty;
  }

  /**
   * Recursively marks all form controls (including FormArray controls) as touched
   * @param control The form control, form group, or form array to mark as touched
   */
  private markAllControlsAsTouched(control: AbstractControl): void {
    control.markAsTouched();
    
    if (control instanceof FormGroup) {
      Object.keys(control.controls).forEach(key => {
        this.markAllControlsAsTouched(control.get(key)!);
      });
    } else if (control instanceof FormArray) {
      control.controls.forEach(c => {
        this.markAllControlsAsTouched(c);
      });
    }
  }

  /**
   * Validates typeahead fields in packages FormArray (for add-inventory-item)
   * Handles both single source mode (selected_item) and mixed mode (output_item)
   * Also marks all controls as touched to ensure errors are displayed
   * @param packagesFormArray The FormArray containing package groups
   * @param isMixedMode Array indicating which packages are in mixed mode
   * @param itemsList The full list of items to search
   * @param parentFormGroup Optional parent form group to mark all controls as touched
   * @returns Object with isValid flag and error message if invalid
   */
  validatePackagesTypeaheadFields(
    packagesFormArray: FormArray,
    isMixedMode: boolean[],
    itemsList: Item[] | null | undefined,
    parentFormGroup?: FormGroup
  ): { isValid: boolean; errorMessage?: string; packageIndex?: number } {
    // Mark all controls as touched (including FormArray controls)
    if (parentFormGroup) {
      this.markAllControlsAsTouched(parentFormGroup);
    } else {
      this.markAllControlsAsTouched(packagesFormArray);
    }
    for (let i = 0; i < packagesFormArray.length; i++) {
      const packageGroup = packagesFormArray.at(i);
      const isMixed = isMixedMode[i];
      
      if (isMixed) {
        // For mixed mode, validate output_item
        const outputItemFormValue = packageGroup.get('output_item')?.value;
        const outputItemId = packageGroup.get('output_item_id')?.value;
        const storedOutputItemObj = packageGroup.get('_outputItemObj')?.value;
        const outputItemControl = packageGroup.get('output_item') as FormControl;
        
        if (!outputItemControl) {
          continue;
        }
        
        const selectedOutputItem = this.validateAndGetItem(
          outputItemFormValue,
          storedOutputItemObj,
          outputItemId,
          itemsList,
          outputItemControl
        );
        
        if (!selectedOutputItem) {
          return {
            isValid: false,
            errorMessage: `Package #${i + 1}: Please select an output item from the dropdown suggestions.`,
            packageIndex: i
          };
        }
      } else {
        // For single source mode, validate selected_item
        const itemFormValue = packageGroup.get('selected_item')?.value;
        const selectedItemId = packageGroup.get('selected_item_id')?.value;
        const storedItemObj = packageGroup.get('_selectedItemObj')?.value;
        const selectedItemControl = packageGroup.get('selected_item') as FormControl;
        
        if (!selectedItemControl) {
          continue;
        }
        
        const selectedItem = this.validateAndGetItem(
          itemFormValue,
          storedItemObj,
          selectedItemId,
          itemsList,
          selectedItemControl
        );
        
        if (!selectedItem) {
          return {
            isValid: false,
            errorMessage: `Package #${i + 1}: Please select an item from the dropdown suggestions.`,
            packageIndex: i
          };
        }
      }
    }
    
    return { isValid: true };
  }
}

