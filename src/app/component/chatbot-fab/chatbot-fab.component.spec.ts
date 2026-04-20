import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChatbotFabComponent } from './chatbot-fab.component';
import { ChatbotService } from '../../services/chatbot.service';
import { UiStateService } from '../../services/ui-state.service';
import { Subject } from 'rxjs';

describe('ChatbotFabComponent', () => {
  let component: ChatbotFabComponent;
  let fixture: ComponentFixture<ChatbotFabComponent>;
  let chatbotServiceSpy: jasmine.SpyObj<ChatbotService>;
  let uiStateServiceSpy: jasmine.SpyObj<UiStateService>;

  beforeEach(async () => {
    chatbotServiceSpy = jasmine.createSpyObj('ChatbotService', ['sendMessage']);
    uiStateServiceSpy = jasmine.createSpyObj('UiStateService', [], {
      accessibilityPanelOpen$: new Subject<boolean>().asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ChatbotFabComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ChatbotService, useValue: chatbotServiceSpy },
        { provide: UiStateService, useValue: uiStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with chat closed', () => {
    expect(component.isOpen).toBe(false);
  });

  it('should toggle chat open', () => {
    component.toggleChat();
    expect(component.isOpen).toBe(true);
  });

  it('should add welcome message when opening chat for first time', () => {
    component.toggleChat();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].role).toBe('model');
  });

  it('should toggle chat closed', () => {
    component.isOpen = true;
    component.toggleChat();
    expect(component.isOpen).toBe(false);
  });

  it('should not send empty message', () => {
    component.inputText = '';
    component.sendMessage();
    expect(chatbotServiceSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('should not send message while loading', () => {
    component.inputText = 'test';
    component.isLoading = true;
    component.sendMessage();
    expect(chatbotServiceSpy.sendMessage).not.toHaveBeenCalled();
  });
});
