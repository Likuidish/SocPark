export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  username: string; // 4 capital letters
  password?: string; // stored plainly for this mock demo only
  assignedSpot: string;
  isAdmin: boolean;
  status: UserStatus;
  passwordResetRequested?: boolean;
}

export interface Availability {
  id: string;
  providerId: string;
  providerUsername: string;
  spotNumber: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
}

export interface Reservation {
  id: string;
  availabilityId: string;
  reserverId: string;
  reserverUsername: string;
  providerId: string;
  spotNumber: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
  status: ReservationStatus;
}

export interface AppState {
  currentUser: User | null;
}