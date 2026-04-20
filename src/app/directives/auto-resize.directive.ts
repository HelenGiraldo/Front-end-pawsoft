import { AfterViewInit, Directive, ElementRef, HostListener, OnInit } from '@angular/core';

/**
 * Directiva que hace que un textarea crezca automáticamente
 * según el contenido, sin mostrar barra de scroll.
 * Se ajusta al cargar, al escribir y cuando el valor cambia por binding.
 *
 * Uso: <textarea autoResize></textarea>
 */
@Directive({
  selector: 'textarea[autoResize]',
  standalone: true
})
export class AutoResizeDirective implements OnInit, AfterViewInit {

  constructor(private el: ElementRef<HTMLTextAreaElement>) {}

  ngOnInit(): void {
    const ta = this.el.nativeElement;
    ta.style.overflow = 'hidden';
    ta.style.resize   = 'none';
  }

  ngAfterViewInit(): void {
    // Ajuste inicial tras renderizar (cubre valores prellenados por binding)
    this.adjust();
    // Segundo ajuste con pequeño delay para cubrir casos de carga asíncrona
    setTimeout(() => this.adjust(), 150);
  }

  @HostListener('input')
  onInput(): void {
    this.adjust();
  }

  @HostListener('ngModelChange')
  onModelChange(): void {
    setTimeout(() => this.adjust(), 0);
  }

  private adjust(): void {
    const ta = this.el.nativeElement;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }
}
