/**
 * Event Bus Service - Handles inter-module communication through events
 * This enables modules to communicate without direct dependencies
 */

import { EventEmitter } from 'events';
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger.js';
import {
  PlatformEventBus,
  PlatformEvent,
  EventHandler,
  EventFilter,
  EventHistoryFilter,
  EventBus as ModuleEventBusInterface,
  EventMetadata
} from '../../../../../shared/types/src/index.js';

export class EventBusService extends EventEmitter implements PlatformEventBus {
  private redis: RedisClientType | null = null;
  private localEmitter = new EventEmitter();
  private subscriptions = new Map<string, Set<EventHandler>>();
  private filters = new Map<string, EventFilter>();
  private moduleEventBuses = new Map<string, ModuleEventBus>();
  private logger: Logger;

  constructor(private redisUrl?: string) {
    super();
    this.logger = new Logger('EventBus');
    this.setupLocalEmitter();
  }

  async initialize(): Promise<void> {
    if (this.redisUrl) {
      await this.connectRedis();
    }
    this.logger.info('Event Bus initialized');
  }

  async shutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.logger.info('Event Bus shutdown');
  }

  private async connectRedis(): Promise<void> {
    try {
      this.redis = createClient({ url: this.redisUrl });
      
      this.redis.on('error', (error) => {
        this.logger.error('Redis error', { error: error.message });
      });

      await this.redis.connect();
      
      // Subscribe to all events for distribution
      await this.redis.pSubscribe('events:*', (message, pattern) => {
        try {
          const event: PlatformEvent = JSON.parse(message);
          this.distributeEvent(event);
        } catch (error) {
          this.logger.error('Failed to parse event from Redis', { error: error.message });
        }
      });

      this.logger.info('Connected to Redis for event distribution');
    } catch (error) {
      this.logger.warn('Failed to connect to Redis, using local events only', { error: error.message });
    }
  }

  async publish(event: PlatformEvent): Promise<boolean> {
    try {
      // Add platform metadata
      event.id = event.id || this.generateEventId();
      event.timestamp = event.timestamp || new Date().toISOString();
      event.metadata = event.metadata || { version: '1.0.0' };

      // Store event for history
      await this.storeEvent(event);

      // Publish to Redis if available for distributed systems
      if (this.redis) {
        await this.redis.publish(`events:${event.type}`, JSON.stringify(event));
      } else {
        // Fallback to local distribution
        this.distributeEvent(event);
      }

      this.logger.debug('Event published', { 
        type: event.type, 
        source: event.source,
        id: event.id 
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to publish event', { 
        event: event.type, 
        error: error.message 
      });
      return false;
    }
  }

  subscribe(pattern: string, handler: EventHandler): string {
    const subscriptionId = this.generateSubscriptionId();
    
    if (!this.subscriptions.has(pattern)) {
      this.subscriptions.set(pattern, new Set());
    }
    
    this.subscriptions.get(pattern)!.add(handler);
    
    // Store subscription metadata for cleanup
    (handler as any).__subscriptionId = subscriptionId;
    (handler as any).__pattern = pattern;

    this.logger.debug('Event subscription created', { pattern, subscriptionId });
    
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    // Find and remove the subscription
    for (const [pattern, handlers] of this.subscriptions) {
      for (const handler of handlers) {
        if ((handler as any).__subscriptionId === subscriptionId) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.subscriptions.delete(pattern);
          }
          
          this.logger.debug('Event subscription removed', { pattern, subscriptionId });
          return true;
        }
      }
    }
    
    this.logger.warn('Subscription not found for unsubscribe', { subscriptionId });
    return false;
  }

  createEventFilter(moduleId: string, filter: EventFilter): string {
    const filterId = this.generateFilterId();
    this.filters.set(filterId, filter);
    
    this.logger.debug('Event filter created', { moduleId, filterId, patterns: filter.patterns });
    
    return filterId;
  }

  removeEventFilter(filterId: string): boolean {
    const removed = this.filters.delete(filterId);
    if (removed) {
      this.logger.debug('Event filter removed', { filterId });
    } else {
      this.logger.warn('Event filter not found', { filterId });
    }
    return removed;
  }

  async getEventHistory(filter: EventHistoryFilter): Promise<PlatformEvent[]> {
    try {
      // This would typically query a database or event store
      // For now, return empty array as we haven't implemented persistent storage
      this.logger.debug('Event history requested', { filter });
      return [];
    } catch (error) {
      this.logger.error('Failed to get event history', { error: error.message });
      return [];
    }
  }

  async replayEvents(filter: EventHistoryFilter): Promise<boolean> {
    try {
      const events = await this.getEventHistory(filter);
      
      for (const event of events) {
        this.distributeEvent(event);
      }
      
      this.logger.info('Events replayed', { count: events.length });
      return true;
    } catch (error) {
      this.logger.error('Failed to replay events', { error: error.message });
      return false;
    }
  }

  // Create module-specific event bus
  createModuleEventBus(moduleId: string): ModuleEventBusInterface {
    if (!this.moduleEventBuses.has(moduleId)) {
      this.moduleEventBuses.set(moduleId, new ModuleEventBus(this, moduleId));
    }
    return this.moduleEventBuses.get(moduleId)!;
  }

  private setupLocalEmitter(): void {
    this.localEmitter.setMaxListeners(1000); // Allow many event listeners
  }

  private distributeEvent(event: PlatformEvent): void {
    // Distribute to pattern-based subscriptions
    for (const [pattern, handlers] of this.subscriptions) {
      if (this.matchesPattern(event.type, pattern)) {
        // Check filters
        const allowedHandlers = Array.from(handlers).filter(handler => 
          this.checkEventFilter(event, handler)
        );

        for (const handler of allowedHandlers) {
          try {
            // Execute handler asynchronously to prevent blocking
            setImmediate(() => {
              Promise.resolve(handler(event)).catch(error => {
                this.logger.error('Event handler failed', { 
                  pattern, 
                  eventType: event.type,
                  error: error.message 
                });
              });
            });
          } catch (error) {
            this.logger.error('Synchronous event handler failed', { 
              pattern, 
              eventType: event.type,
              error: error.message 
            });
          }
        }
      }
    }

    // Emit on local emitter for internal platform use
    this.localEmitter.emit(event.type, event);
    this.localEmitter.emit('*', event);
  }

  private matchesPattern(eventType: string, pattern: string): boolean {
    // Simple wildcard pattern matching
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(eventType);
  }

  private checkEventFilter(event: PlatformEvent, handler: EventHandler): boolean {
    // For now, allow all events
    // In a real implementation, you'd check permissions and filters
    return true;
  }

  private async storeEvent(event: PlatformEvent): Promise<void> {
    // Store event for history/audit purposes
    // This would typically go to a database or event store
    // For now, we'll just log it
    this.logger.debug('Event stored', { id: event.id, type: event.type });
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFilterId(): string {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Module-specific event bus wrapper
class ModuleEventBus implements ModuleEventBusInterface {
  private logger: Logger;

  constructor(
    private eventBus: EventBusService,
    private moduleId: string
  ) {
    this.logger = new Logger(`EventBus:${moduleId}`);
  }

  async publish<T = any>(event: string, data: T, metadata?: EventMetadata): Promise<void> {
    const platformEvent: PlatformEvent = {
      id: this.generateEventId(),
      type: event,
      source: this.moduleId,
      timestamp: new Date().toISOString(),
      data,
      metadata: metadata || { version: '1.0.0' }
    };

    const success = await this.eventBus.publish(platformEvent);
    if (!success) {
      throw new Error(`Failed to publish event: ${event}`);
    }
  }

  subscribe<T = any>(event: string, handler: (data: T, metadata: EventMetadata) => void): () => void {
    const wrappedHandler: EventHandler = (platformEvent: PlatformEvent) => {
      // Only handle events we're interested in
      if (platformEvent.type === event || this.matchesWildcard(event, platformEvent.type)) {
        handler(platformEvent.data, platformEvent.metadata);
      }
    };

    const subscriptionId = this.eventBus.subscribe(event, wrappedHandler);
    
    // Return unsubscribe function
    return () => {
      this.eventBus.unsubscribe(subscriptionId);
    };
  }

  unsubscribe(event: string, handler: Function): void {
    // Find and remove specific handler
    // This is a simplified implementation
    this.logger.debug('Unsubscribe requested', { event });
  }

  private matchesWildcard(pattern: string, eventType: string): boolean {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(eventType);
    }
    return pattern === eventType;
  }

  private generateEventId(): string {
    return `${this.moduleId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}