import { User, Availability, Reservation, UserStatus, ReservationStatus } from '../types';
import { getDaysDifference } from '../utils/dateUtils';

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const API_URL = 'https://script.google.com/macros/s/AKfycbxuk3bTLWkQp3orrgJdSEqEmwc9P-v657NUuVZrWl9UU0pjbT3i5vgt_6ZAl6Nfxm7L3A/exec';

// Initial Admin User (Fallback/Bootstrap)
const ADMIN_USER: User = {
  id: 'admin-001',
  username: 'REYE',
  password: 'password123',
  assignedSpot: '42 toriki',
  isAdmin: true,
  status: UserStatus.APPROVED,
  passwordResetRequested: false,
};

// Safe ID Generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

class GoogleSheetsStorage {
  
  // Generic Fetch Helper
  private async request(action: string, payload: any = {}): Promise<any> {
    if (API_URL.includes('CHANGE_THIS')) {
        console.warn("API URL not configured. Using Mock Data.");
        return this.mockRequest(action, payload);
    }

    try {
        // We use POST for everything.
        // IMPORTANT: Content-Type 'text/plain' prevents browser CORS preflight (OPTIONS) requests
        // which Google Apps Script does not handle well.
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: "follow",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action, ...payload })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const json = await response.json();
        if (json.status === 'error') throw new Error(json.message);
        return json.data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
  }

  // --- Fallback Mock System (so the app doesn't crash before you paste the URL) ---
  private mockData = {
      users: [ADMIN_USER],
      availabilities: [] as Availability[],
      reservations: [] as Reservation[]
  };

  private async mockRequest(action: string, payload: any): Promise<any> {
      await new Promise(r => setTimeout(r, 500)); // Simulate latency
      switch(action) {
          case 'get_users': return this.mockData.users;
          case 'save_user': 
              this.mockData.users.push(payload.user); return payload.user;
          case 'update_user':
              this.mockData.users = this.mockData.users.map(u => u.id === payload.user.id ? payload.user : u); return payload.user;
          case 'delete_user':
              this.mockData.users = this.mockData.users.filter(u => u.id !== payload.userId); return true;
          case 'get_availabilities': return this.mockData.availabilities;
          case 'save_availability':
              this.mockData.availabilities.push(payload.availability); return payload.availability;
          case 'delete_availability':
              this.mockData.availabilities = this.mockData.availabilities.filter(a => a.id !== payload.id); return true;
          case 'get_reservations': return this.mockData.reservations;
          case 'save_reservation':
              this.mockData.reservations.push(payload.reservation); return payload.reservation;
          case 'update_reservation':
               this.mockData.reservations = this.mockData.reservations.map(r => r.id === payload.reservation.id ? payload.reservation : r); return payload.reservation;
          default: return null;
      }
  }

  // --- User Methods ---

  async login(username: string, password: string): Promise<User> {
    let users: User[] = await this.request('get_users');
    
    // BOOTSTRAP: If database is empty (fresh deploy), inject the Admin User
    if (!users || users.length === 0) {
        console.log("Base de données vide. Initialisation de l'utilisateur Admin...");
        try {
            await this.request('save_user', { user: ADMIN_USER });
            users = [ADMIN_USER]; // Use local instance immediately
        } catch (e) {
            console.error("Erreur lors de l'initialisation admin", e);
        }
    }

    // Robust comparison: convert both to string to handle numeric passwords in Sheet
    // And trim whitespace
    const user = users.find(u => 
      String(u.username).trim().toUpperCase() === username.trim().toUpperCase() && 
      String(u.password).trim() === password.trim()
    );
    
    if (!user) throw new Error('Identifiants invalides');
    if (user.status === UserStatus.PENDING) throw new Error('Compte en attente de validation par un administrateur');
    if (user.status === UserStatus.REJECTED) throw new Error('Ce compte a été désactivé');
    
    return user;
  }

  async register(user: Omit<User, 'id' | 'status' | 'isAdmin'>): Promise<User> {
    const users: User[] = await this.request('get_users');
    if (users.find(u => String(u.username).trim().toUpperCase() === user.username.trim().toUpperCase())) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    const newUser: User = {
      ...user,
      id: generateId(),
      isAdmin: false,
      status: UserStatus.PENDING,
      passwordResetRequested: false,
    };

    await this.request('save_user', { user: newUser });
    return newUser;
  }

  async adminAddUser(username: string, assignedSpot: string): Promise<User> {
      const users: User[] = await this.request('get_users');
      if (users.find(u => String(u.username).trim().toUpperCase() === username.trim().toUpperCase())) {
          throw new Error('Ce nom d\'utilisateur est déjà pris');
      }

      const newUser: User = {
          id: generateId(),
          username,
          password: '1234',
          assignedSpot,
          isAdmin: false,
          status: UserStatus.APPROVED,
          passwordResetRequested: false,
      };

      await this.request('save_user', { user: newUser });
      return newUser;
  }

  async deleteUser(userId: string): Promise<void> {
      await this.request('delete_user', { userId });
      // We rely on the backend script to handle cascading deletes or we ignore orphans for now
  }

  async getAllUsers(): Promise<User[]> {
    return this.request('get_users');
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const users: User[] = await this.request('get_users');
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = status;
        await this.request('update_user', { user });
    }
  }

  async updateUserSpot(userId: string, newSpot: string): Promise<void> {
    const users: User[] = await this.request('get_users');
    const user = users.find(u => u.id === userId);
    if (user) {
        user.assignedSpot = newSpot;
        await this.request('update_user', { user });
    }
  }

  async requestPasswordReset(username: string): Promise<void> {
    const users: User[] = await this.request('get_users');
    const user = users.find(u => String(u.username).trim().toUpperCase() === username.trim().toUpperCase());
    if (user) {
        user.passwordResetRequested = true;
        await this.request('update_user', { user });
    }
  }

  async adminResetPassword(userId: string): Promise<void> {
    const users: User[] = await this.request('get_users');
    const user = users.find(u => u.id === userId);
    if (user) {
        user.password = '1234';
        user.passwordResetRequested = false;
        await this.request('update_user', { user });
    }
  }

  async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    const users: User[] = await this.request('get_users');
    const user = users.find(u => u.id === userId);
    
    if (!user) throw new Error('Utilisateur non trouvé');
    // Ensure loose comparison for current password too
    if (String(user.password).trim() !== oldPass.trim()) throw new Error('L\'ancien mot de passe est incorrect');

    user.password = newPass;
    await this.request('update_user', { user });
  }

  // --- Spot/Availability Methods ---

  async addAvailability(avail: Omit<Availability, 'id'>): Promise<Availability> {
    const newAvail = { ...avail, id: generateId() };
    await this.request('save_availability', { availability: newAvail });
    return newAvail;
  }

  async getAvailabilitiesForUser(userId: string): Promise<Availability[]> {
    const all: Availability[] = await this.request('get_availabilities');
    return all.filter(a => String(a.providerId) === String(userId));
  }

  async getAllAvailabilities(): Promise<Availability[]> {
    return this.request('get_availabilities');
  }

  async deleteAvailability(id: string): Promise<void> {
    await this.request('delete_availability', { id });
  }

  // --- Reservation Methods ---

  async createReservation(res: Omit<Reservation, 'id' | 'status'>): Promise<Reservation> {
    const list: Reservation[] = await this.request('get_reservations');
    
    // Check for overlapping reservations for the same spot that are NOT rejected
    const exists = list.find(r => 
      String(r.spotNumber) === String(res.spotNumber) && 
      r.status !== ReservationStatus.REJECTED &&
      // Check range overlap: (StartA <= EndB) and (EndA >= StartB)
      (r.startDate <= res.endDate && r.endDate >= res.startDate)
    );
    
    if (exists) throw new Error('Cette place est déjà réservée ou en attente pour cette période');

    const newRes: Reservation = {
      ...res,
      id: generateId(),
      status: ReservationStatus.PENDING
    };
    await this.request('save_reservation', { reservation: newRes });
    return newRes;
  }

  async getMyReservations(userId: string): Promise<Reservation[]> {
    const all: Reservation[] = await this.request('get_reservations');
    return all.filter(r => String(r.reserverId) === String(userId));
  }

  async getIncomingReservations(userId: string): Promise<Reservation[]> {
    const all: Reservation[] = await this.request('get_reservations');
    return all.filter(r => String(r.providerId) === String(userId));
  }

  async getAllReservations(): Promise<Reservation[]> {
    return this.request('get_reservations');
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
    const list: Reservation[] = await this.request('get_reservations');
    const res = list.find(r => r.id === id);
    if (res) {
        res.status = status;
        await this.request('update_reservation', { reservation: res });
    }
  }

  // --- Stats & Leaderboard ---

  async getLeaderboard(): Promise<{ username: string; daysProvided: number }[]> {
    const users = await this.getAllUsers();
    const reservations = await this.getAllReservations();
    
    const stats = users.map(u => {
      // Calculate days based on confirmed reservations provided by this user
      const userProvidedReservations = reservations.filter(r => 
        String(r.providerId) === String(u.id) && 
        r.status === ReservationStatus.APPROVED
      );
      
      let days = 0;
      userProvidedReservations.forEach(r => {
        days += getDaysDifference(r.startDate, r.endDate);
      });
      return { username: u.username, daysProvided: days };
    });

    return stats.sort((a, b) => b.daysProvided - a.daysProvided).filter(s => s.daysProvided > 0);
  }

  async getUserStats(userId: string): Promise<{ daysProvided: number, daysReserved: number }> {
    const avails = await this.getAvailabilitiesForUser(userId);
    const reservations = await this.getMyReservations(userId);
    const approvedRes = reservations.filter(r => r.status === ReservationStatus.APPROVED);

    let daysProvided = 0;
    avails.forEach(a => {
      daysProvided += getDaysDifference(a.startDate, a.endDate);
    });

    let daysReserved = 0;
    approvedRes.forEach(r => {
        daysReserved += getDaysDifference(r.startDate, r.endDate);
    });

    return {
      daysProvided,
      daysReserved
    };
  }
}

export const storage = new GoogleSheetsStorage();