import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { UserBehaviorEvent, UserBehaviorEventInput } from '../../models/behavior.model';

export interface IBehaviorRepository {
  getAll(from?: Date, to?: Date): Observable<UserBehaviorEvent[]>;
  appendBatch(events: UserBehaviorEventInput[]): Observable<UserBehaviorEvent[]>;
  pruneOlderThan(date: Date): Observable<number>;
  clear(): Observable<boolean>;
}

export const BEHAVIOR_REPOSITORY_TOKEN = new InjectionToken<IBehaviorRepository>(
  'BehaviorRepository',
);
