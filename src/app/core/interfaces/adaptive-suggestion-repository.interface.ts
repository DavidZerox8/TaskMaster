import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdaptiveSuggestion,
  AdaptiveSuggestionCreateRequest,
  AdaptiveSuggestionUpdateRequest,
  AdaptiveSuggestionStatus,
} from '../../models/adaptive.model';

export interface IAdaptiveSuggestionRepository {
  getAll(status?: AdaptiveSuggestionStatus): Observable<AdaptiveSuggestion[]>;
  getByRoutine(routineId: string, status?: AdaptiveSuggestionStatus): Observable<AdaptiveSuggestion[]>;
  getById(id: string): Observable<AdaptiveSuggestion | null>;
  create(request: AdaptiveSuggestionCreateRequest): Observable<AdaptiveSuggestion>;
  update(id: string, request: AdaptiveSuggestionUpdateRequest): Observable<AdaptiveSuggestion>;
  delete(id: string): Observable<boolean>;
  hasOpenForRoutineAndType(
    routineId: string,
    type: AdaptiveSuggestion['type'],
  ): Observable<boolean>;
}

export const ADAPTIVE_SUGGESTION_REPOSITORY_TOKEN = new InjectionToken<IAdaptiveSuggestionRepository>(
  'AdaptiveSuggestionRepository',
);
