// Simple persistent user store for JWT authentication
// In production, this would be replaced with a proper database

import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

// File-based storage for development
const USERS_FILE = path.join(process.cwd(), '.users.json');

// Load users from file
const loadUsers = (): Map<string, User> => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const usersArray = JSON.parse(data);
      return new Map(usersArray.map((user: User) => [user.id, user]));
    }
  } catch (error: any) {
    console.error('Error loading users:', error);
  }
  return new Map();
};

// Save users to file
const saveUsers = (users: Map<string, User>) => {
  try {
    const usersArray = Array.from(users.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2));
  } catch (error: any) {
    console.error('Error saving users:', error);
  }
};

// Initialize users from file
let users = loadUsers();
let usersByEmail = new Map<string, User>();

// Rebuild email index
for (const user of users.values()) {
  usersByEmail.set(user.email, user);
}

export const userStore = {
  // Create a new user
  create: (user: User) => {
    users.set(user.id, user);
    usersByEmail.set(user.email, user);
    saveUsers(users);
    return user;
  },

  // Find user by ID
  findById: (id: string): User | undefined => {
    return users.get(id);
  },

  // Find user by email
  findByEmail: (email: string): User | undefined => {
    return usersByEmail.get(email);
  },

  // Update user
  update: (id: string, updates: Partial<User>): User | undefined => {
    const user = users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    users.set(id, updatedUser);
    usersByEmail.set(updatedUser.email, updatedUser);
    saveUsers(users);
    return updatedUser;
  },

  // Delete user
  delete: (id: string): boolean => {
    const user = users.get(id);
    if (!user) return false;

    users.delete(id);
    usersByEmail.delete(user.email);
    saveUsers(users);
    return true;
  },

  // Check if admin exists
  hasAdmin: (): boolean => {
    for (const user of users.values()) {
      if (user.role === 'admin') return true;
    }
    return false;
  },

  // Get all users (admin function)
  getAll: (): User[] => {
    return Array.from(users.values());
  },

  // Get user count
  count: (): number => {
    return users.size;
  },

  // Reload users from file (for development)
  reload: () => {
    users = loadUsers();
    usersByEmail.clear();
    for (const user of users.values()) {
      usersByEmail.set(user.email, user);
    }
  }
};

// For development: expose to global for debugging
if (typeof window !== 'undefined') {
  (window as any).userStore = userStore;
}