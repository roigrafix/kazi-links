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
  serviceName?: string;
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
  fullAddress?: string;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  serviceArea?: string;
  /** @wixFieldType image */
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
  /** @wixFieldType image */
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
  /** @wixFieldType image */
  serviceImage?: string;
  /** @wixFieldType boolean */
  isBookable?: boolean;
  /** @wixFieldType reference */
  reference?: Freelancers;
}
