import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { HabitService } from '../../../../core/services/habit.service';
import { AIService } from '../../../../core/services/ai.service';
import { AIConfigService } from '../../../../core/services/ai-config.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BackupService } from '../../../../core/services/backup.service';
import { AuthService } from '../../../../core/services/auth.service';
import { XpBarComponent } from '../../../../shared/components/ui/xp-bar/xp-bar.component';
import {
  AIProviderType,
  AI_PROVIDER_LABELS,
  AI_MODELS,
  AI_PROVIDER_DEFAULTS,
} from '../../../../models/ai.model';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule, XpBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <h1 class="text-2xl font-bold text-gray-900">Mi Perfil</h1>

      <!-- Profile card -->
      <div class="card p-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
            {{ userService.displayName().charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ userService.displayName() }}</h2>
            <p class="text-sm text-indigo-600 font-medium">
              Nivel {{ gamificationService.userLevel().level }} - {{ gamificationService.userLevel().title }}
            </p>
          </div>
        </div>
        <div class="mt-4">
          <app-xp-bar />
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ habitService.activeHabits().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Habitos activos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ gamificationService.unlockedAchievements().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Logros</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-amber-600">{{ gamificationService.availablePoints() }}</p>
          <p class="text-xs text-gray-500 mt-1">Puntos</p>
        </div>
      </div>

      <!-- User settings -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Configuracion</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              class="input-field"
              [ngModel]="userService.displayName()"
              (ngModelChange)="updateName($event)"
              name="displayName" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mis objetivos</label>
            <textarea
              class="input-field"
              [ngModel]="goalsText()"
              (ngModelChange)="updateGoals($event)"
              name="goals"
              rows="3"
              placeholder="Ej: Mejorar mi salud, ser mas productivo..."></textarea>
            <p class="text-xs text-gray-400 mt-1">Tus objetivos ayudan al coach IA a darte mejores sugerencias</p>
          </div>
        </div>
      </div>

      <!-- AI Provider Configuration -->
      <div class="card overflow-hidden">
        <div class="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>
        <div class="p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            <h2 class="text-base font-semibold text-gray-900">Inteligencia Artificial</h2>
          </div>

          <!-- Provider selector -->
          <div class="mb-5">
            <label class="block text-sm font-medium text-gray-700 mb-2">Proveedor activo</label>
            <div class="grid grid-cols-2 gap-2">
              @for (provider of providers; track provider) {
                <button
                  (click)="selectProvider(provider)"
                  class="p-3 rounded-xl border-2 text-left transition-all"
                  [class]="aiConfigService.activeProvider() === provider
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ getProviderIcon(provider) }}</span>
                    <div>
                      <p class="text-sm font-semibold" [class]="aiConfigService.activeProvider() === provider ? 'text-purple-700' : 'text-gray-900'">
                        {{ getProviderLabel(provider) }}
                      </p>
                      <p class="text-xs" [class]="isProviderConfigured(provider) ? 'text-green-600' : 'text-gray-400'">
                        {{ isProviderConfigured(provider) ? 'Configurado' : 'Sin configurar' }}
                      </p>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- API Key configs for each provider -->
          @for (provider of providers; track provider) {
            <div class="border-t border-gray-100 pt-4 mt-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-900">
                  {{ getProviderIcon(provider) }} {{ getProviderLabel(provider) }}
                </h3>
                @if (isProviderConfigured(provider)) {
                  <span class="badge badge-success text-xs">Activo</span>
                }
              </div>

              <!-- API Key input -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                <div class="flex gap-2">
                  <input
                    [type]="showApiKey() === provider ? 'text' : 'password'"
                    class="input-field text-sm font-mono"
                    [value]="getApiKeyDisplay(provider)"
                    (input)="onApiKeyChange(provider, $event)"
                    [placeholder]="getApiKeyPlaceholder(provider)" />
                  <button
                    (click)="toggleShowApiKey(provider)"
                    class="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (showApiKey() === provider) {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Model selector -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
                <select
                  class="input-field text-sm"
                  [ngModel]="getSelectedModel(provider)"
                  (ngModelChange)="onModelChange(provider, $event)"
                  [attr.name]="'model_' + provider">
                  @for (model of getModels(provider); track model.value) {
                    <option [value]="model.value">{{ model.label }}</option>
                  }
                </select>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                @if (isProviderConfigured(provider)) {
                  <button
                    (click)="validateKey(provider)"
                    [disabled]="validating() === provider"
                    class="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50">
                    {{ validating() === provider ? 'Validando...' : 'Probar conexion' }}
                  </button>
                  <button
                    (click)="removeKey(provider)"
                    class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    Eliminar key
                  </button>
                }
              </div>

              <!-- Validation error detail -->
              @if (validationError() && validationError()!.provider === provider) {
                <div class="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div class="flex items-start gap-2">
                    <span class="text-red-500 flex-shrink-0 mt-0.5">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                      </svg>
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-red-700">
                        {{ validationError()!.error }}
                        @if (validationError()!.statusCode) {
                          <span class="text-xs font-normal text-red-400 ml-1">(HTTP {{ validationError()!.statusCode }})</span>
                        }
                      </p>
                      <p class="text-xs text-red-600 mt-1">{{ validationError()!.details }}</p>
                      <button (click)="clearValidationError()" class="text-xs text-red-400 hover:text-red-600 mt-2 underline">
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Info note -->
          <div class="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <p class="text-xs text-amber-700">
              <strong>Nota:</strong> Las API keys se guardan localmente en tu navegador.
              En la version con backend, las keys se gestionaran de forma segura en el servidor.
            </p>
          </div>
        </div>
      </div>

      <!-- Datos y cuenta -->
      <div class="card p-5 space-y-3">
        <h2 class="text-base font-semibold text-gray-900">Datos y cuenta</h2>
        <p class="text-sm text-gray-500">
          Tus datos viven en este dispositivo. Exporta backup regularmente — si pierdes el PIN no hay recuperación.
        </p>
        <div class="flex flex-col sm:flex-row gap-2">
          <button type="button" class="btn-secondary flex-1" (click)="onExport()">
            Exportar backup
          </button>
          <label class="btn-secondary flex-1 text-center cursor-pointer">
            Importar backup
            <input type="file" accept="application/json" class="hidden" (change)="onImport($event)" />
          </label>
        </div>
        <button type="button" class="btn-danger w-full mt-2" (click)="onReset()">
          Reiniciar aplicación
        </button>
        <p class="text-xs text-gray-400">
          "Reiniciar" borra todos tus datos locales incluyendo el PIN. No se puede deshacer.
        </p>
      </div>

      <!-- App info -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-2">TaskMaster</h2>
        <p class="text-sm text-gray-500">Version 3.0 - Habitos, Gamificacion & IA</p>
        <p class="text-xs text-gray-400 mt-1">Construido con Angular 19 + Tailwind CSS + Anthropic Claude / Google Gemini</p>
      </div>
    </div>
  `,
})
export class ProfilePageComponent implements OnInit {
  userService = inject(UserService);
  gamificationService = inject(GamificationService);
  habitService = inject(HabitService);
  aiConfigService = inject(AIConfigService);
  private aiService = inject(AIService);
  private notificationService = inject(NotificationService);
  private backup = inject(BackupService);
  private auth = inject(AuthService);
  private router = inject(Router);

  providers: AIProviderType[] = ['anthropic', 'gemini'];
  showApiKey = signal<AIProviderType | null>(null);
  validating = signal<AIProviderType | null>(null);
  validationError = signal<{ provider: AIProviderType; error: string; details: string; statusCode?: number } | null>(null);

  ngOnInit(): void {
    this.userService.loadUser();
    this.gamificationService.loadData();
    this.habitService.loadHabits();
  }

  goalsText(): string {
    return this.userService.profile()?.goals?.join(', ') ?? '';
  }

  updateName(name: string): void {
    this.userService.updateProfile({ displayName: name });
  }

  updateGoals(text: string): void {
    const goals = text.split(',').map(g => g.trim()).filter(Boolean);
    this.userService.updateGoals(goals);
  }

  // ─── Datos y cuenta ───────────────────────────────────────────

  onExport(): void {
    this.backup.downloadAsJson();
    this.notificationService.success('Backup exportado', 'Guarda este archivo en un lugar seguro');
  }

  async onImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!confirm('Esto reemplazará tus datos actuales con el contenido del archivo. ¿Continuar?')) {
      input.value = '';
      return;
    }
    const result = await this.backup.importFromFile(file);
    input.value = '';
    if (result.ok) {
      this.notificationService.success(
        'Backup importado',
        `${result.keysRestored} claves restauradas. La app se recargará.`,
      );
      setTimeout(() => window.location.reload(), 800);
    } else {
      this.notificationService.error('Error al importar', result.error ?? 'Archivo inválido');
    }
  }

  onReset(): void {
    if (!confirm('Esto borrará TODOS tus datos locales incluyendo el PIN. Acción irreversible. ¿Continuar?')) {
      return;
    }
    this.backup.clearAll();
    this.auth.reset();
    this.router.navigateByUrl('/onboarding/welcome');
    setTimeout(() => window.location.reload(), 200);
  }

  // ─── AI Configuration ─────────────────────────────────────────

  getProviderLabel(provider: AIProviderType): string {
    return AI_PROVIDER_LABELS[provider];
  }

  getProviderIcon(provider: AIProviderType): string {
    return provider === 'anthropic' ? '🤖' : '✨';
  }

  getModels(provider: AIProviderType): { value: string; label: string }[] {
    return AI_MODELS[provider];
  }

  isProviderConfigured(provider: AIProviderType): boolean {
    return this.aiConfigService.getProviderConfig(provider) !== null;
  }

  selectProvider(provider: AIProviderType): void {
    this.aiConfigService.setActiveProvider(provider);
  }

  getApiKeyDisplay(provider: AIProviderType): string {
    const config = this.aiConfigService.config();
    return config.providers[provider]?.apiKey ?? '';
  }

  getApiKeyPlaceholder(provider: AIProviderType): string {
    return provider === 'anthropic' ? 'sk-ant-...' : 'AIza...';
  }

  getSelectedModel(provider: AIProviderType): string {
    const config = this.aiConfigService.config();
    return config.providers[provider]?.model ?? AI_PROVIDER_DEFAULTS[provider].model;
  }

  onApiKeyChange(provider: AIProviderType, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.aiConfigService.setApiKey(provider, value);
  }

  onModelChange(provider: AIProviderType, model: string): void {
    this.aiConfigService.setModel(provider, model);
  }

  toggleShowApiKey(provider: AIProviderType): void {
    this.showApiKey.set(this.showApiKey() === provider ? null : provider);
  }

  removeKey(provider: AIProviderType): void {
    this.aiConfigService.removeApiKey(provider);
    this.notificationService.info(`API key de ${this.getProviderLabel(provider)} eliminada`);
  }

  clearValidationError(): void {
    this.validationError.set(null);
  }

  validateKey(provider: AIProviderType): void {
    const config = this.aiConfigService.getProviderConfig(provider);
    if (!config) return;

    this.validating.set(provider);
    this.validationError.set(null);

    this.aiService.validateApiKey(provider, config.apiKey, config.model).subscribe({
      next: (result) => {
        this.validating.set(null);
        if (result.valid) {
          this.validationError.set(null);
          this.notificationService.success(
            'Conexion exitosa',
            `${this.getProviderLabel(provider)} configurado correctamente`
          );
        } else {
          this.validationError.set({
            provider,
            error: result.error ?? 'Error desconocido',
            details: result.details ?? 'No se obtuvo informacion adicional del error',
            statusCode: result.statusCode,
          });
          this.notificationService.error(
            result.error ?? 'Error de conexion',
            result.details?.substring(0, 80) ?? 'Revisa los detalles en la seccion del proveedor'
          );
        }
      },
      error: (err) => {
        this.validating.set(null);
        const message = err?.message ?? 'Error inesperado';
        this.validationError.set({
          provider,
          error: 'Error inesperado',
          details: `No se pudo completar la validacion. Error: ${message}`,
          statusCode: err?.status,
        });
        this.notificationService.error('Error de conexion', message.substring(0, 80));
      },
    });
  }
}
