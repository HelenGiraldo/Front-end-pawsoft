import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from 'src/app/services/accessibility.service';
import { UiStateService } from 'src/app/services/ui-state.service';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accessibility-widget.component.html',
  styleUrls: ['./accessibility-widget.component.scss']
})
export class AccessibilityWidgetComponent {
  
  isOpen = false;

  constructor(
    readonly accessibilityService: AccessibilityService,
    private uiStateService: UiStateService
  ) {}

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    this.uiStateService.setAccessibilityPanelOpen(this.isOpen);
  }

  closePanel(): void {
    this.isOpen = false;
    this.uiStateService.setAccessibilityPanelOpen(false);
  }
}
