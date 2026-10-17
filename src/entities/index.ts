/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: bookings
 * Interface for Bookings
 */
export interface Bookings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  clientLocation?: string;
  /** @wixFieldType text */
  pin?: string;
  /** @wixFieldType text */
  liveStatus?: string;
  /** @wixFieldType text */
  serviceName?: string;
  /** @wixFieldType text */
  serviceCity?: string;
  /** @wixFieldType text */
  serviceState?: string;
  /** @wixFieldType text */
  freelancerName?: string;
  /** @wixFieldType date */
  bookingDate?: Date | string;
  /** @wixFieldType time */
  bookingTime?: any;
  /** @wixFieldType text */
  serviceLocationType?: string;
  /** @wixFieldType text */
  serviceAddress?: string;
  /** @wixFieldType number */
  transportationCost?: number;
  /** @wixFieldType text */
  paymentStatus?: string;
  /** @wixFieldType number */
  paymentAmount?: number;
  /** @wixFieldType text */
  etaStatus?: string;
  /** @wixFieldType text */
  bookingStatus?: string;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType text */
  clientEmail?: string;
  /** @wixFieldType text */
  clientPhone?: string;
  /** @wixFieldType boolean */
  refunded?: boolean;
}


/**
 * Collection ID: clientreviews
 * Interface for ClientReviews
 */
export interface ClientReviews {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  freelancerId?: string;
  /** @wixFieldType text */
  bookingId?: string;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType number */
  rating?: number;
  /** @wixFieldType text */
  reviewContent?: string;
  /** @wixFieldType datetime */
  reviewDate?: Date | string;
  /** @wixFieldType text */
  reviewTitle?: string;
}


/**
 * Collection ID: customerservicerequests
 * Interface for CustomerServiceRequests
 */
export interface CustomerServiceRequests {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType text */
  clientEmail?: string;
  /** @wixFieldType text */
  issueDescription?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  priority?: string;
  /** @wixFieldType datetime */
  submissionDate?: Date | string;
}


/**
 * Collection ID: freelancers
 * Interface for Freelancers
 */
export interface Freelancers {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  city?: string;
  /** @wixFieldType text */
  liveStatus?: string;
  /** @wixFieldType text */
  serviceCities?: string;
  /** @wixFieldType text */
  serviceStates?: string;
  /** @wixFieldType text */
  preferredCities?: string;
  /** @wixFieldType text */
  preferredStates?: string;
  /** @wixFieldType text */
  blockedDates?: string;
  /** @wixFieldType time */
  workingHoursEnd?: any;
  /** @wixFieldType time */
  workingHoursStart?: any;
  /** @wixFieldType text */
  availableDays?: string;
  /** @wixFieldType text */
  fullAddress?: string;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  serviceArea?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  profilePicture?: string;
  /** @wixFieldType text */
  bio?: string;
  /** @wixFieldType text */
  skills?: string;
  /** @wixFieldType text */
  servicesOffered?: string;
  /** @wixFieldType text */
  availabilityDescription?: string;
  /** @wixFieldType number */
  hourlyRate?: number;
  /** @wixFieldType text */
  contactEmail?: string;
  /** @wixFieldType array_document */
  customersReviews?: any;
  /** @wixFieldType text */
  customersReview?: string;
  /** @wixFieldType reference */
  reference?: ClientReviews;
}


/**
 * Collection ID: indianlocations
 * Interface for IndianLocations
 */
export interface IndianLocations {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  stateName?: string;
  /** @wixFieldType text */
  cityName?: string;
  /** @wixFieldType text */
  stateCode?: string;
  /** @wixFieldType text */
  cityCode?: string;
  /** @wixFieldType text */
  region?: string;
}


/**
 * Collection ID: notificationsettings
 * Interface for NotificationSettings
 */
export interface NotificationSettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  userEmail?: string;
  /** @wixFieldType text */
  userId?: string;
  /** @wixFieldType boolean */
  emailNotificationsEnabled?: boolean;
  /** @wixFieldType boolean */
  smsNotificationsEnabled?: boolean;
  /** @wixFieldType boolean */
  pushNotificationsEnabled?: boolean;
  /** @wixFieldType text */
  notificationFrequency?: string;
  /** @wixFieldType text */
  notificationTypes?: string;
}


/**
 * Collection ID: refunds
 * Interface for RefundRequests
 */
export interface RefundRequests {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  bookingReference?: string;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType text */
  clientEmail?: string;
  /** @wixFieldType number */
  refundAmount?: number;
  /** @wixFieldType text */
  refundReason?: string;
  /** @wixFieldType datetime */
  requestDate?: Date | string;
  /** @wixFieldType text */
  status?: string;
}


/**
 * Collection ID: servicecategories
 * Interface for ServiceCategories
 */
export interface ServiceCategories {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  categoryName?: string;
  /** @wixFieldType text */
  categoryDescription?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  categoryImage?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType number */
  sortOrder?: number;
}


/**
 * Collection ID: services
 * Interface for Services
 */
export interface Services {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  serviceName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  price?: number;
  /** @wixFieldType number */
  durationMinutes?: number;
  /** @wixFieldType text */
  categoryName?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  serviceImage?: string;
  /** @wixFieldType boolean */
  isBookable?: boolean;
  /** @wixFieldType reference */
  reference?: Freelancers;
}
