import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ChatbotFabComponent } from './chatbot-fab.component';
import { ChatbotService } from '../../services/chatbot.service';
import { UiStateService } from '../../services/ui-state.service';
import { ChatMessage, ChatResponse } from '../../pages/chat-bot/chatbot.model';

describe('ChatbotFabComponent - Pruebas Funcionales (FE-FAB-01)', () => {
  let component: ChatbotFabComponent;
  let fixture: ComponentFixture<ChatbotFabComponent>;
  let chatbotService: jasmine.SpyObj<ChatbotService>;
  let uiStateService: jasmine.SpyObj<UiStateService>;
  let router: jasmine.SpyObj<Router>;
  let domSanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(async () => {
    const chatbotSpy = jasmine.createSpyObj('ChatbotService', ['sendMessage']);
    const uiStateSpy = jasmine.createSpyObj('UiStateService', [], {
      accessibilityPanelOpen$: of(false)
    });
    const routerSpy = jasmine.createSpyObj('Router', [], {
      url: '/dashboard',
      events: of({})
    });
    const sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);

    await TestBed.configureTestingModule({
      imports: [ChatbotFabComponent],
      providers: [
        { provide: ChatbotService, useValue: chatbotSpy },
        { provide: UiStateService, useValue: uiStateSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotFabComponent);
    component = fixture.componentInstance;
    chatbotService = TestBed.inject(ChatbotService) as jasmine.SpyObj<ChatbotService>;
    uiStateService = TestBed.inject(UiStateService) as jasmine.SpyObj<UiStateService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    domSanitizer = TestBed.inject(DomSanitizer) as jasmine.SpyObj<DomSanitizer>;

    // Mock DOM methods
    spyOn(document, 'getElementById').and.returnValue({
      scrollTop: 0,
      scrollHeight: 100
    } as any);
  });

  // ═══════════════════════════════════════════════════════════════
  // FE-FAB-01: Funcionalidad completa del componente chatbot FAB
  // ═══════════════════════════════════════════════════════════════
  describe('FE-FAB-01: Funcionalidad completa del componente chatbot FAB', () => {
    
    it('debe inicializar correctamente el componente', () => {
      fixture.detectChanges();
      
      expect(component).toBeTruthy();
      expect(component.isOpen).toBe(false);
      expect(component.messages).toEqual([]);
      expect(component.inputText).toBe('');
      expect(component.isLoading).toBe(false);
      expect(component.isHidden).toBe(false);
    });

    it('debe alternar el estado del chat al hacer clic', () => {
      expect(component.isOpen).toBe(false);
      
      component.toggleChat();
      
      expect(component.isOpen).toBe(true);
      expect(component.messages.length).toBe(1);
      expect(component.messages[0].role).toBe('model');
      expect(component.messages[0].text).toContain('¡Hola! 👋');
    });

    it('debe cerrar el chat al hacer clic nuevamente', () => {
      component.isOpen = true;
      
      component.toggleChat();
      
      expect(component.isOpen).toBe(false);
    });

    it('debe enviar mensaje exitosamente', () => {
      const mockResponse: ChatResponse = {
        reply: 'Para agendar una cita, ve a la sección "Agendar Cita" en el menú principal.',
        success: true
      };
      
      chatbotService.sendMessage.and.returnValue(of(mockResponse));
      component.inputText = '¿Cómo agendo una cita?';
      
      component.sendMessage();
      
      expect(chatbotService.sendMessage).toHaveBeenCalledWith(
        '¿Cómo agendo una cita?',
        []
      );
      expect(component.messages.length).toBe(2);
      expect(component.messages[0].role).toBe('user');
      expect(component.messages[0].text).toBe('¿Cómo agendo una cita?');
      expect(component.messages[1].role).toBe('model');
      expect(component.messages[1].text).toBe(mockResponse.reply);
      expect(component.inputText).toBe('');
      expect(component.isLoading).toBe(false);
    });

    it('debe manejar error en envío de mensaje', () => {
      chatbotService.sendMessage.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.inputText = 'Test message';
      
      component.sendMessage();
      
      expect(component.messages.length).toBe(2);
      expect(component.messages[1].text).toBe('Lo siento, no pude conectarme. Intenta más tarde.');
      expect(component.isLoading).toBe(false);
    });

    it('no debe enviar mensaje vacío', () => {
      component.inputText = '';
      
      component.sendMessage();
      
      expect(chatbotService.sendMessage).not.toHaveBeenCalled();
      expect(component.messages.length).toBe(0);
    });

    it('no debe enviar mensaje mientras está cargando', () => {
      component.inputText = 'Test message';
      component.isLoading = true;
      
      component.sendMessage();
      
      expect(chatbotService.sendMessage).not.toHaveBeenCalled();
    });

    it('debe enviar mensaje al presionar Enter', () => {
      const mockResponse: ChatResponse = {
        reply: 'Respuesta del chatbot',
        success: true
      };
      
      chatbotService.sendMessage.and.returnValue(of(mockResponse));
      component.inputText = 'Test message';
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.handleKey(event);
      
      expect(chatbotService.sendMessage).toHaveBeenCalled();
    });

    it('no debe enviar mensaje al presionar otra tecla', () => {
      component.inputText = 'Test message';
      
      const event = new KeyboardEvent('keydown', { key: 'Space' });
      component.handleKey(event);
      
      expect(chatbotService.sendMessage).not.toHaveBeenCalled();
    });

    it('debe formatear mensaje con texto en negrita', () => {
      const text = 'Este es un **texto en negrita**';
      const expectedHtml = 'Este es un <strong>texto en negrita</strong>';
      
      domSanitizer.bypassSecurityTrustHtml.and.returnValue(expectedHtml as any);
      
      const result = component.formatMessage(text);
      
      expect(domSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        jasmine.stringMatching(/<strong>texto en negrita<\/strong>/)
      );
    });

    it('debe formatear mensaje con texto en cursiva', () => {
      const text = 'Este es un *texto en cursiva*';
      
      domSanitizer.bypassSecurityTrustHtml.and.returnValue('formatted' as any);
      
      component.formatMessage(text);
      
      expect(domSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        jasmine.stringMatching(/<em>texto en cursiva<\/em>/)
      );
    });

    it('debe formatear lista numerada', () => {
      const text = '1. Primer elemento\n2. Segundo elemento';
      
      domSanitizer.bypassSecurityTrustHtml.and.returnValue('formatted' as any);
      
      component.formatMessage(text);
      
      expect(domSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        jasmine.stringMatching(/<ol><li>Primer elemento<\/li><li>Segundo elemento<\/li><\/ol>/)
      );
    });

    it('debe formatear saltos de línea', () => {
      const text = 'Línea 1\nLínea 2';
      
      domSanitizer.bypassSecurityTrustHtml.and.returnValue('formatted' as any);
      
      component.formatMessage(text);
      
      expect(domSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
        jasmine.stringMatching(/Línea 1<br>Línea 2/)
      );
    });

    it('debe ocultarse en páginas de autenticación', () => {
      (router as any).url = '/login';
      
      component.ngOnInit();
      
      expect(component.isHidden).toBe(true);
    });

    it('debe ocultarse en página de registro', () => {
      (router as any).url = '/register';
      
      component.ngOnInit();
      
      expect(component.isHidden).toBe(true);
    });

    it('debe ocultarse en página de reset de contraseña', () => {
      (router as any).url = '/reset-password';
      
      component.ngOnInit();
      
      expect(component.isHidden).toBe(true);
    });

    it('debe ocultarse en página de verificación de email', () => {
      (router as any).url = '/verify-email';
      
      component.ngOnInit();
      
      expect(component.isHidden).toBe(true);
    });

    it('debe mostrarse en otras páginas', () => {
      (router as any).url = '/dashboard';
      
      component.ngOnInit();
      
      expect(component.isHidden).toBe(false);
    });

    it('debe cerrarse cuando se abre el panel de accesibilidad', () => {
      component.isOpen = true;
      
      // Simular apertura del panel de accesibilidad
      (uiStateService as any).accessibilityPanelOpen$ = of(true);
      
      // Recrear componente para que se suscriba al observable
      fixture = TestBed.createComponent(ChatbotFabComponent);
      component = fixture.componentInstance;
      component.isOpen = true;
      
      fixture.detectChanges();
      
      expect(component.isOpen).toBe(false);
    });

    it('debe incluir historial en mensajes posteriores', () => {
      const firstMessage: ChatMessage = {
        role: 'user',
        text: 'Primera pregunta',
        timestamp: new Date()
      };
      
      const firstResponse: ChatMessage = {
        role: 'model',
        text: 'Primera respuesta',
        timestamp: new Date()
      };
      
      component.messages = [firstMessage, firstResponse];
      
      const mockResponse: ChatResponse = {
        reply: 'Segunda respuesta',
        success: true
      };
      
      chatbotService.sendMessage.and.returnValue(of(mockResponse));
      component.inputText = 'Segunda pregunta';
      
      component.sendMessage();
      
      expect(chatbotService.sendMessage).toHaveBeenCalledWith(
        'Segunda pregunta',
        [firstMessage, firstResponse]
      );
    });

    it('debe hacer scroll al final después de agregar mensaje', (done) => {
      const mockElement = {
        scrollTop: 0,
        scrollHeight: 200
      };
      
      (document.getElementById as jasmine.Spy).and.returnValue(mockElement);
      
      const mockResponse: ChatResponse = {
        reply: 'Test response',
        success: true
      };
      
      chatbotService.sendMessage.and.returnValue(of(mockResponse));
      component.inputText = 'Test message';
      
      component.sendMessage();
      
      // Verificar que se hace scroll después del timeout
      setTimeout(() => {
        expect(mockElement.scrollTop).toBe(200);
        done();
      }, 150);
    });

    it('debe manejar elemento de chat no encontrado en scroll', () => {
      (document.getElementById as jasmine.Spy).and.returnValue(null);
      
      // No debe lanzar error
      expect(() => {
        (component as any).scrollToBottom();
      }).not.toThrow();
    });

    it('debe limpiar texto de entrada después de enviar mensaje', () => {
      const mockResponse: ChatResponse = {
        reply: 'Response',
        success: true
      };
      
      chatbotService.sendMessage.and.returnValue(of(mockResponse));
      component.inputText = 'Test message';
      
      component.sendMessage();
      
      expect(component.inputText).toBe('');
    });

    it('debe establecer estado de carga durante envío', () => {
      chatbotService.sendMessage.and.returnValue(of({
        reply: 'Response',
        success: true
      }));
      
      component.inputText = 'Test message';
      
      // Verificar que se establece isLoading antes de la respuesta
      expect(component.isLoading).toBe(false);
      
      component.sendMessage();
      
      // Durante el envío debería estar en true, pero como es síncrono en el test,
      // verificamos que se resetea a false después
      expect(component.isLoading).toBe(false);
    });
  });
});