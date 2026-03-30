import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  private accessibilityPanelOpen = new BehaviorSubject<boolean>(false);
  accessibilityPanelOpen$ = this.accessibilityPanelOpen.asObservable();

  setAccessibilityPanelOpen(isOpen: boolean): void {
    this.accessibilityPanelOpen.next(isOpen);
  }
}
