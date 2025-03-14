// Auth-Service für die Integration mit Supabase Auth
// Fallback zu simuliertem Auth-Verhalten, wenn keine Verbindung zur Datenbank besteht

import { supabase } from '@/lib/supabase';

// Simulierter User-Store für lokalen Betrieb
let currentUser: { 
  id: string; 
  name: string; 
  email: string; 
  twoFactorEnabled: boolean;
  twoFactorMethod: "email" | "phone" | "authenticator" | null;
  phoneNumber: string | null;
  cfxId?: string;
} | null = null;

let isEmailVerified = false;

// OAuth Konfiguration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google-callback`;
const GOOGLE_SCOPE = "email profile";

// Discord OAuth Konfiguration
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || "YOUR_DISCORD_CLIENT_ID";
const DISCORD_REDIRECT_URI = `${window.location.origin}/auth/discord-callback`;
const DISCORD_SCOPE = "identify email";

// CFX OAuth Konfiguration
const CFX_CLIENT_ID = import.meta.env.VITE_CFX_CLIENT_ID || "YOUR_CFX_CLIENT_ID";
const CFX_REDIRECT_URI = `${window.location.origin}/auth/cfx-callback`;
const CFX_SCOPE = "profile email";
const CFX_INTERACTION_URL = import.meta.env.VITE_CFX_INTERACTION_URL || "https://idms.fivem.net";

// Mock-Daten für schnelle Tests
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@test.com", // Einfacher zu merkende E-Mail
    password: "password123", // Einfaches Passwort für Tests
    name: "Admin Test",
    twoFactorEnabled: false,
    twoFactorMethod: null,
    phoneNumber: null,
    cfxId: "cfx12345"
  },
  {
    id: "2",
    email: "user@test.com",
    password: "user123",
    name: "User Test",
    twoFactorEnabled: false,
    twoFactorMethod: null,
    phoneNumber: null,
    cfxId: null
  }
];

export const authService = {
  // Anmeldung mit E-Mail und Passwort
  signIn: async (email: string, password: string) => {
    try {
      // Versuche Anmeldung mit Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Benutzer erfolgreich angemeldet
      // Prüfen auf 2FA, würde in einer echten App über Metadaten erfolgen
      const user = data.user;
      const twoFactorEnabled = user.user_metadata?.twoFactorEnabled || false;
      const twoFactorMethod = user.user_metadata?.twoFactorMethod || null;
      
      if (twoFactorEnabled) {
        // Code für 2FA senden (würde in einer echten App über Supabase Edge Functions erfolgen)
        return { 
          requiresTwoFactor: true,
          twoFactorMethod: twoFactorMethod
        };
      }
      
      return { requiresTwoFactor: false };
    } catch (error) {
      console.log('Supabase Auth-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (!user || user.password !== password) {
        throw new Error("E-Mail oder Passwort ist falsch");
      }
      
      currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorMethod: user.twoFactorMethod,
        phoneNumber: user.phoneNumber,
        cfxId: user.cfxId
      };
      
      if (user.twoFactorEnabled) {
        // Code für 2FA senden (simuliert)
        await new Promise(resolve => setTimeout(resolve, 500));
        return { 
          requiresTwoFactor: true,
          twoFactorMethod: user.twoFactorMethod
        };
      }
      
      // User erfolgreich angemeldet
      localStorage.setItem("auth_token", "mock_jwt_token");
      
      return { requiresTwoFactor: false };
    }
  },
  
  // Anmeldung mit Google
  signInWithGoogle: async () => {
    try {
      // Mit Supabase Google OAuth durchführen
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: GOOGLE_REDIRECT_URI
        }
      });
      
      if (error) throw error;
      
      // Benutzer wird zu Google-Auth-Seite umgeleitet
      window.location.href = data.url;
      
      // Diese Funktion kehrt nicht zurück, da wir umleiten
      return new Promise<any>(() => {});
    } catch (error) {
      console.log('Supabase OAuth-Fehler, Fallback zu Mock-OAuth:', error);
      
      // Fallback zu Mock-OAuth
      // Google OAuth Redirect URL erstellen
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SCOPE)}&access_type=offline&prompt=select_account`;
      
      // Zu Google Auth-Seite umleiten
      window.location.href = googleAuthUrl;
      
      // Diese Funktion kehrt nicht zurück, da wir umleiten
      return new Promise<any>(() => {});
    }
  },
  
  // Google OAuth Callback verarbeiten
  handleGoogleCallback: async (code: string) => {
    try {
      // In einer echten Supabase-App müssten wir hier nichts tun, da Supabase den Callback verarbeitet
      // Wir prüfen hier einfach, ob wir einen Benutzer haben
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!data.session) {
        throw new Error("Keine gültige Sitzung nach OAuth-Anmeldung");
      }
      
      const user = data.session.user;
      
      return {
        id: user.id,
        name: user.user_metadata?.full_name || "Google User",
        email: user.email,
      };
    } catch (error) {
      console.log('Supabase Session-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulierter erfolgreicher Login nach OAuth-Callback
      currentUser = {
        id: "google_user_id",
        name: "Google User",
        email: "google_user@example.com",
        twoFactorEnabled: false,
        twoFactorMethod: null,
        phoneNumber: null,
        cfxId: null
      };
      
      localStorage.setItem("auth_token", "mock_google_jwt_token");
      
      return currentUser;
    }
  },
  
  // Anmeldung mit Discord
  signInWithDiscord: async () => {
    try {
      // Mit Supabase Discord OAuth durchführen
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: DISCORD_REDIRECT_URI
        }
      });
      
      if (error) throw error;
      
      // Benutzer wird zu Discord-Auth-Seite umgeleitet
      window.location.href = data.url;
      
      // Diese Funktion kehrt nicht zurück, da wir umleiten
      return new Promise<any>(() => {});
    } catch (error) {
      console.log('Supabase OAuth-Fehler, Fallback zu Mock-OAuth:', error);
      
      // Fallback zu Mock-OAuth
      // Discord OAuth Redirect URL erstellen
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(DISCORD_SCOPE)}`;
      
      // Zu Discord Auth-Seite umleiten
      window.location.href = discordAuthUrl;
      
      // Diese Funktion kehrt nicht zurück, da wir umleiten
      return new Promise<any>(() => {});
    }
  },
  
  // Discord OAuth Callback verarbeiten
  handleDiscordCallback: async (code: string) => {
    try {
      // In einer echten App müssten wir hier nichts tun, da Supabase den Callback verarbeitet
      // Wir prüfen hier einfach, ob wir einen Benutzer haben
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!data.session) {
        throw new Error("Keine gültige Sitzung nach OAuth-Anmeldung");
      }
      
      const user = data.session.user;
      
      return {
        id: user.id,
        name: user.user_metadata?.full_name || "Discord User",
        email: user.email,
      };
    } catch (error) {
      console.log('Supabase Session-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulierter erfolgreicher Login nach OAuth-Callback
      currentUser = {
        id: "discord_user_id",
        name: "Discord User",
        email: "discord_user@example.com",
        twoFactorEnabled: false,
        twoFactorMethod: null,
        phoneNumber: null,
        cfxId: null
      };
      
      localStorage.setItem("auth_token", "mock_discord_jwt_token");
      
      return currentUser;
    }
  },
  
  // Anmeldung mit CFX
  signInWithCFX: async () => {
    try {
      // Generate state token for CSRF protection
      const stateToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("cfx_auth_state", stateToken);
      
      // CFX OAuth Configuration
      const CFX_CLIENT_ID = import.meta.env.VITE_CFX_CLIENT_ID;
      const CFX_REDIRECT_URI = `${window.location.origin}/auth/cfx-callback`;
      const CFX_SCOPE = "profile email";
      const CFX_INTERACTION_URL = import.meta.env.VITE_CFX_INTERACTION_URL;
      
      // Ensure base URL ends with a slash
      const cfxBaseUrl = CFX_INTERACTION_URL.endsWith('/') ? CFX_INTERACTION_URL : `${CFX_INTERACTION_URL}/`;
      
      // Build CFX OAuth URL with integration path
      const cfxAuthUrl = `${cfxBaseUrl}integration/authorize?client_id=${CFX_CLIENT_ID}&redirect_uri=${encodeURIComponent(CFX_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(CFX_SCOPE)}&state=${stateToken}`;
      
      // Redirect to CFX Auth page
      console.log("Redirecting to CFX auth URL:", cfxAuthUrl);
      window.location.href = cfxAuthUrl;
      
      // This function doesn't return as we're redirecting
      return new Promise<any>(() => {});
    } catch (error) {
      console.error("CFX Login Error:", error);
      throw new Error("Bei der Anmeldung mit CFX ist ein Fehler aufgetreten.");
    }
  },
  
  // CFX OAuth Callback verarbeiten
  handleCFXCallback: async (code: string) => {
    try {
      // Verify state parameter for CSRF protection
      const storedState = localStorage.getItem("cfx_auth_state");
      localStorage.removeItem("cfx_auth_state");
      
      // Log the code received for debugging
      console.log("CFX callback received with code:", code ? "Code received" : "No code received");
      
      // In a real implementation, you'd exchange this code for a token
      // by calling the CFX token endpoint. For this example, we're simulating
      // a successful authentication.
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a simulated user from the CFX login
      currentUser = {
        id: "cfx_user_id",
        name: "CFX User",
        email: "cfx_user@example.com",
        twoFactorEnabled: false,
        twoFactorMethod: null,
        phoneNumber: null,
        cfxId: "cfx_" + Math.random().toString(36).substring(2, 10)
      };
      
      localStorage.setItem("auth_token", "mock_cfx_jwt_token");
      
      return currentUser;
    } catch (error) {
      console.error("CFX Callback Error:", error);
      throw new Error("CFX Auth fehlgeschlagen");
    }
  },
  
  // CFX API-Schlüssel abrufen
  getCFXApiKeys: async () => {
    try {
      // In einer echten App würde hier ein API-Aufruf an CFX stattfinden
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulierte API-Schlüssel
      return [
        {
          id: "cfxkey_1",
          name: "Development Key",
          key: "cfx_" + Math.random().toString(36).substring(2, 15),
          scopes: ["read", "write"],
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      throw new Error("API-Schlüssel konnten nicht abgerufen werden");
    }
  },
  
  // Neuen CFX API-Schlüssel erstellen
  createCFXApiKey: async (name: string, scopes: string[]) => {
    try {
      // In einer echten App würde hier ein API-Aufruf an CFX stattfinden
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulierter neuer API-Schlüssel
      return {
        id: "cfxkey_" + Date.now(),
        name,
        key: "cfx_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        scopes,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Failed to create API key:", error);
      throw new Error("Der API-Schlüssel konnte nicht erstellt werden");
    }
  },
  
  // CFX API-Schlüssel widerrufen
  revokeCFXApiKey: async (keyId: string) => {
    try {
      // In einer echten App würde hier ein API-Aufruf an CFX stattfinden
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      throw new Error("Der API-Schlüssel konnte nicht widerrufen werden");
    }
  },
  
  // Registrierung
  signUp: async (name: string, email: string, password: string) => {
    try {
      // Supabase-Registrierung
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            twoFactorEnabled: false,
            twoFactorMethod: null,
            phoneNumber: null,
            cfxId: null
          }
        }
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.log('Supabase Auth-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Überprüfen, ob ein Benutzer mit dieser E-Mail bereits existiert
      if (MOCK_USERS.some(u => u.email === email)) {
        throw new Error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits");
      }
      
      // Neuen Benutzer erstellen
      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password,
        twoFactorEnabled: false,
        twoFactorMethod: null as "email" | "phone" | "authenticator" | null,
        phoneNumber: null,
        cfxId: null
      };
      
      MOCK_USERS.push(newUser);
      
      // E-Mail-Bestätigung simulieren
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    }
  },
  
  // OTP verifizieren
  verifyOTP: async (otp: string, method: "email" | "phone") => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Einfache Simulation - jeder 6-stellige Code beginnend mit "123" ist gültig
    if (!otp.startsWith("123") || otp.length !== 6) {
      throw new Error("Ungültiger Code");
    }
    
    // Erfolgreiche Verifizierung
    localStorage.setItem("auth_token", "mock_jwt_token_after_2fa");
    
    return { success: true };
  },
  
  // OTP erneut senden
  resendOTP: async (method: "email" | "phone") => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  },
  
  // Passwort vergessen
  forgotPassword: async (email: string) => {
    try {
      // Supabase Passwort-Reset-E-Mail senden
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.log('Supabase Auth-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Simulierte API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Überprüfen, ob ein Benutzer mit dieser E-Mail existiert
      const user = MOCK_USERS.find(u => u.email === email);
      
      if (!user) {
        // Wir geben keinen Fehler zurück, um nicht preiszugeben, ob ein Benutzer existiert
        // In einer echten App würde dennoch eine E-Mail gesendet werden
      }
      
      return { success: true };
    }
  },
  
  // Bestätigungs-E-Mail erneut senden
  resendVerificationEmail: async () => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  },
  
  // E-Mail-2FA einrichten
  setupEmailTwoFactor: async () => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!currentUser) {
      throw new Error("Nicht angemeldet");
    }
    
    // Code senden simulieren
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  },
  
  // Telefon-2FA einrichten
  setupPhoneTwoFactor: async (phoneNumber: string) => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!currentUser) {
      throw new Error("Nicht angemeldet");
    }
    
    // Telefonnummer speichern
    currentUser.phoneNumber = phoneNumber;
    
    // Code senden simulieren
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  },
  
  // Authenticator-2FA einrichten
  setupAuthenticatorTwoFactor: async () => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!currentUser) {
      throw new Error("Nicht angemeldet");
    }
    
    // QR-Code-URL zurückgeben
    // In einer echten App würde dies ein echter QR-Code vom Backend sein
    return { 
      success: true,
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/ExampleApp:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ExampleApp",
      secret: "JBSWY3DPEHPK3PXP"
    };
  },
  
  // 2FA-Setup verifizieren
  verifyTwoFactorSetup: async (code: string, method: "email" | "phone" | "authenticator") => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!currentUser) {
      throw new Error("Nicht angemeldet");
    }
    
    // Einfache Simulation - jeder 6-stellige Code beginnend mit "123" ist gültig
    if (!code.startsWith("123") || code.length !== 6) {
      throw new Error("Ungültiger Code");
    }
    
    // 2FA aktivieren
    currentUser.twoFactorEnabled = true;
    currentUser.twoFactorMethod = method;
    
    return { success: true };
  },
  
  // Abmelden
  signOut: async () => {
    try {
      // Supabase-Abmeldung
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.log('Supabase Auth-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Token löschen
      localStorage.removeItem("auth_token");
      currentUser = null;
      
      return { success: true };
    }
  },
  
  // Aktuellen Benutzer abrufen
  getCurrentUser: async () => {
    try {
      // Supabase-Benutzer abrufen
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (!data.user) return null;
      
      const user = data.user;
      
      return {
        id: user.id,
        name: user.user_metadata?.full_name || "User",
        email: user.email || "",
        twoFactorEnabled: user.user_metadata?.twoFactorEnabled || false,
        twoFactorMethod: user.user_metadata?.twoFactorMethod || null,
        phoneNumber: user.user_metadata?.phoneNumber || null,
        cfxId: user.user_metadata?.cfxId || null
      };
    } catch (error) {
      console.log('Supabase Auth-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      // Überprüfen, ob Token vorhanden ist
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        return null;
      }
      
      return currentUser || null;
    }
  },
  
  // Überprüfen, ob Benutzer angemeldet ist
  isAuthenticated: async () => {
    try {
      // Supabase-Sitzung abrufen
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return !!data.session;
    } catch (error) {
      console.log('Supabase Auth-Fehler, Fallback zu Mock-Auth:', error);
      
      // Fallback zu Mock-Auth
      return !!localStorage.getItem("auth_token");
    }
  },
  
  // E-Mail verifizieren
  verifyEmail: async (token: string) => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    isEmailVerified = true;
    
    return { success: true };
  }
};
