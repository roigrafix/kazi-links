/**
 * Real-time Booking Status Update Service
 * Provides real-time updates for booking status changes using polling
 */

import { Bookings } from '@/entities';
import { BaseCrudService } from '@/integrations';

export type BookingStatusUpdateCallback = (booking: Bookings) => void;

interface RealtimeListener {
  bookingId: string;
  callback: BookingStatusUpdateCallback;
}

class RealtimeService {
  private listeners: Map<string, BookingStatusUpdateCallback[]> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastKnownStatus: Map<string, string> = new Map();
  private pollingInterval = 5000; // 5 seconds

  /**
   * Subscribe to real-time updates for a specific booking
   */
  subscribe(bookingId: string, callback: BookingStatusUpdateCallback): () => void {
    if (!this.listeners.has(bookingId)) {
      this.listeners.set(bookingId, []);
      this.startPolling(bookingId);
    }

    this.listeners.get(bookingId)!.push(callback);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(bookingId, callback);
    };
  }

  /**
   * Unsubscribe from real-time updates
   */
  private unsubscribe(bookingId: string, callback: BookingStatusUpdateCallback): void {
    const callbacks = this.listeners.get(bookingId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Stop polling if no more listeners
      if (callbacks.length === 0) {
        this.stopPolling(bookingId);
        this.listeners.delete(bookingId);
        this.lastKnownStatus.delete(bookingId);
      }
    }
  }

  /**
   * Start polling for updates on a specific booking
   */
  private startPolling(bookingId: string): void {
    if (this.pollingIntervals.has(bookingId)) {
      return; // Already polling
    }

    const interval = setInterval(async () => {
      try {
        const booking = await BaseCrudService.getById<Bookings>('bookings', bookingId);
        
        // Check if status or liveStatus has changed
        const lastStatus = this.lastKnownStatus.get(bookingId);
        const currentStatus = `${booking.bookingStatus}|${booking.liveStatus}`;

        if (lastStatus !== currentStatus) {
          this.lastKnownStatus.set(bookingId, currentStatus);
          this.notifyListeners(bookingId, booking);
        }
      } catch (error) {
        console.error(`Error polling booking ${bookingId}:`, error);
      }
    }, this.pollingInterval);

    this.pollingIntervals.set(bookingId, interval);
  }

  /**
   * Stop polling for a specific booking
   */
  private stopPolling(bookingId: string): void {
    const interval = this.pollingIntervals.get(bookingId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(bookingId);
    }
  }

  /**
   * Notify all listeners of a booking update
   */
  private notifyListeners(bookingId: string, booking: Bookings): void {
    const callbacks = this.listeners.get(bookingId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(booking);
        } catch (error) {
          console.error('Error in booking update callback:', error);
        }
      });
    }
  }

  /**
   * Manually trigger an update for a booking
   */
  async updateBooking(bookingId: string): Promise<void> {
    try {
      const booking = await BaseCrudService.getById<Bookings>('bookings', bookingId);
      const currentStatus = `${booking.bookingStatus}|${booking.liveStatus}`;
      this.lastKnownStatus.set(bookingId, currentStatus);
      this.notifyListeners(bookingId, booking);
    } catch (error) {
      console.error(`Error updating booking ${bookingId}:`, error);
    }
  }

  /**
   * Subscribe to multiple bookings at once
   */
  subscribeToMultiple(bookingIds: string[], callback: (booking: Bookings) => void): () => void {
    const unsubscribers = bookingIds.map(id => this.subscribe(id, callback));

    // Return a function that unsubscribes from all
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Set the polling interval (in milliseconds)
   */
  setPollingInterval(interval: number): void {
    this.pollingInterval = interval;
  }

  /**
   * Get the current polling interval
   */
  getPollingInterval(): number {
    return this.pollingInterval;
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    this.listeners.clear();
    this.lastKnownStatus.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
