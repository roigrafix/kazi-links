/**
 * Google Calendar Service
 * Generates Google Calendar event links and iCalendar files for bookings
 */

interface CalendarEventData {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  location: string;
  attendeeEmail: string;
}

export const googleCalendarService = {
  /**
   * Generate Google Calendar event URL
   * Opens Google Calendar with pre-filled event details
   */
  generateGoogleCalendarUrl(event: CalendarEventData): string {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      location: event.location,
      dates: this.formatDateForGoogle(event.startDateTime) + '/' + this.formatDateForGoogle(event.endDateTime),
      add: event.attendeeEmail
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  /**
   * Generate iCalendar (.ics) file content
   * Can be downloaded and imported into any calendar app
   */
  generateICalendarContent(event: CalendarEventData, bookingId: string): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Service Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WIX-BOOKING-ID:${bookingId}
BEGIN:VEVENT
UID:${bookingId}@servicebooking.local
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.startDateTime)}
DTEND:${formatDate(event.endDateTime)}
SUMMARY:${this.escapeICalendarText(event.title)}
DESCRIPTION:${this.escapeICalendarText(event.description)}
LOCATION:${this.escapeICalendarText(event.location)}
ATTENDEE:mailto:${event.attendeeEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  },

  /**
   * Download iCalendar file
   */
  downloadICalendarFile(event: CalendarEventData, bookingId: string, filename: string = 'booking.ics'): void {
    const icsContent = this.generateICalendarContent(event, bookingId);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  },

  /**
   * Generate Outlook calendar URL
   */
  generateOutlookCalendarUrl(event: CalendarEventData): string {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: this.formatDateForOutlook(event.startDateTime),
      enddt: this.formatDateForOutlook(event.endDateTime),
      subject: event.title,
      body: event.description,
      location: event.location
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  },

  /**
   * Format date for Google Calendar (YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS)
   */
  formatDateForGoogle(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  },

  /**
   * Format date for Outlook (YYYY-MM-DDTHH:MM:SS)
   */
  formatDateForOutlook(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  },

  /**
   * Escape special characters for iCalendar format
   */
  escapeICalendarText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  },

  /**
   * Create calendar event data from booking details
   */
  createEventFromBooking(
    serviceName: string,
    freelancerName: string,
    bookingDate: Date,
    bookingTime: string,
    serviceAddress: string,
    clientEmail: string,
    clientName: string,
    paymentAmount: number
  ): CalendarEventData {
    // Parse booking time (HH:MM format)
    const [hours, minutes] = bookingTime.split(':').map(Number);
    
    // Create start date
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    // Create end date (assume 1 hour duration)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    return {
      title: `${serviceName} - ${freelancerName}`,
      description: `Service Booking\n\nClient: ${clientName}\nService: ${serviceName}\nFreelancer: ${freelancerName}\nAmount: ₹${paymentAmount.toFixed(2)}\n\nLocation: ${serviceAddress}`,
      startDateTime,
      endDateTime,
      location: serviceAddress,
      attendeeEmail: clientEmail
    };
  }
};
