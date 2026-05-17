import { Component, inject, signal, computed, ElementRef, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AIService } from '../../../../core/services/ai.service';
import { AIConfigService } from '../../../../core/services/ai-config.service';
import { HabitService } from '../../../../core/services/habit.service';
import { UserService } from '../../../../core/services/user.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { AIPromptContext, AIConversationMessage, AIActionChip } from '../../../../models/ai.model';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-ai-coach-chat',
  standalone: true,
  imports: [FormsModule, ModalComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Floating chat button -->
    @if (aiConfigService.isConfigured()) {
      <button
        (click)="isOpen.set(true)"
        class="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all hover:scale-105 flex items-center justify-center">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
        @if (aiService.chatMessages().length > 0) {
          <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span class="text-xs font-bold text-white">{{ aiService.chatMessages().length }}</span>
          </div>
        }
      </button>
    }

    <!-- Chat modal -->
    <app-modal [isOpen]="isOpen()" title="Coach IA" (closed)="isOpen.set(false)">
      <div class="flex flex-col h-[400px] -m-1">
        <!-- Messages area -->
        <div #messagesContainer class="flex-1 overflow-y-auto p-3 space-y-3">
          @if (aiService.chatMessages().length === 0) {
            <div class="text-center py-8">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <span class="text-3xl">🧠</span>
              </div>
              <p class="text-sm font-semibold text-gray-900 mb-1">Coach de habitos IA</p>
              <p class="text-xs text-gray-500">Preguntame sobre tus habitos, pide motivacion o consejos</p>
              <!-- Quick prompts -->
              <div class="flex flex-wrap gap-2 justify-center mt-4">
                @for (prompt of quickPrompts; track prompt) {
                  <button
                    (click)="sendQuickPrompt(prompt)"
                    class="text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                    {{ prompt }}
                  </button>
                }
              </div>
            </div>
          } @else {
            @for (msg of visibleMessages(); track $index) {
              <div class="flex" [class]="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                <div
                  class="max-w-[80%] rounded-2xl px-4 py-2.5"
                  [class]="msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'">
                  @if (msg.content) {
                    <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                  }
                  @if (msg.actionChips?.length) {
                    <div class="flex flex-col gap-1.5" [class.mt-2]="!!msg.content">
                      @for (chip of msg.actionChips; track chip.id) {
                        @if (chip.resourceRoute) {
                          <a
                            [routerLink]="chip.resourceRoute"
                            (click)="isOpen.set(false)"
                            class="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                            [class]="chipClass(chip)">
                            <span>{{ chip.icon }}</span>
                            <span class="flex-1">{{ chip.summary }}</span>
                            <span class="text-[10px] opacity-60">Abrir →</span>
                          </a>
                        } @else {
                          <div
                            class="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium"
                            [class]="chipClass(chip)">
                            <span>{{ chip.icon }}</span>
                            <span class="flex-1">{{ chip.summary }}</span>
                            @if (chip.errorMessage) {
                              <span class="text-[10px] opacity-70">{{ chip.errorMessage }}</span>
                            }
                          </div>
                        }
                      }
                    </div>
                  }
                  <p class="text-xs mt-1"
                     [class]="msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'">
                    {{ formatTime(msg.timestamp) }}
                  </p>
                </div>
              </div>
            }

            <!-- Typing indicator -->
            @if (aiService.chatLoading()) {
              <div class="flex justify-start">
                <div class="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div class="flex gap-1">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              </div>
            }
          }
        </div>

        <!-- Input area -->
        <div class="border-t border-gray-100 p-3">
          <form (ngSubmit)="send()" class="flex gap-2">
            <input
              type="text"
              [(ngModel)]="inputText"
              name="chatInput"
              class="flex-1 input-field text-sm"
              placeholder="Escribe un mensaje..."
              [disabled]="aiService.chatLoading()" />
            <button
              type="submit"
              [disabled]="!inputText.trim() || aiService.chatLoading()"
              class="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div modal-footer class="flex justify-between">
        <button (click)="clearChat()" class="text-xs text-gray-400 hover:text-gray-600">Limpiar chat</button>
        <button (click)="isOpen.set(false)" class="btn-secondary text-sm">Cerrar</button>
      </div>
    </app-modal>
  `,
})
export class AICoachChatComponent {
  aiService = inject(AIService);
  aiConfigService = inject(AIConfigService);
  private habitService = inject(HabitService);
  private userService = inject(UserService);
  private gamificationService = inject(GamificationService);

  messagesContainer = viewChild<ElementRef>('messagesContainer');

  isOpen = signal(false);
  inputText = '';

  visibleMessages = computed<AIConversationMessage[]>(() =>
    this.aiService.chatMessages().filter(m =>
      !(m.role === 'user' && m.toolResults && m.toolResults.length > 0 && !m.content)
    )
  );

  chipClass(chip: AIActionChip): string {
    switch (chip.status) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  }

  quickPrompts = [
    'Dame motivacion',
    'Que habito me recomiendas?',
    'Como mantengo mi racha?',
    'Analiza mis habitos',
  ];

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.inputText = '';
    this.aiService.sendChatMessage(text, this.buildContext());
    this.scrollToBottom();
  }

  sendQuickPrompt(prompt: string): void {
    this.aiService.sendChatMessage(prompt, this.buildContext());
    this.scrollToBottom();
  }

  clearChat(): void {
    this.aiService.clearChat();
  }

  formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  private buildContext(): AIPromptContext {
    const habits = this.habitService.habitsWithStats();
    return {
      habits: habits.map(h => ({
        title: h.title,
        category: h.category,
        type: h.type,
        streak: h.streak.currentStreak,
        completionRate: h.completionRate,
      })),
      userGoals: this.userService.profile()?.goals ?? [],
      recentCompletions: this.habitService.completions().length,
      currentLevel: this.gamificationService.userLevel().level,
      dayOfWeek: new Date().toLocaleDateString('es-ES', { weekday: 'long' }),
    };
  }
}
