
// Simulierter Authentifizierungsdienst
// In einer realen Anwendung würde dies gegen eine echte Backend-API oder einen Auth-Dienst wie Firebase, Auth0, etc. kommunizieren

// Simulierter User-Store
let currentUser: { 
  id: string; 
  name: string; 
  email: string; 
  twoFactorEnabled: boolean;
  twoFactorMethod: "email" | "phone" | "authenticator" | null;
  phoneNumber: string | null;
} | null = null;

let isEmailVerified = false;

// Google OAuth Konfiguration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"; // Umgebungsvariable oder Fallback
const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google-callback`;
const GOOGLE_SCOPE = "email profile"; // Berechtigungen, die wir von Google anfordern

// Mock-Daten für schnelle Tests
const MOCK_USERS = [
  {
    id: "1",
    email: "test@example.com",
    password: "password123",
    name: "Test User",
    twoFactorEnabled: false,
    twoFactorMethod: null,
    phoneNumber: null,
  },
];

export const authService = {
  // Anmeldung mit E-Mail und Passwort
  signIn: async (email: string, password: string) => {
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
  },
  
  // Anmeldung mit Google
  signInWithGoogle: async () => {
    // Google OAuth Redirect URL erstellen
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SCOPE)}&access_type=offline&prompt=select_account`;
    
    // Zu Google Auth-Seite umleiten
    window.location.href = googleAuthUrl;
    
    // Diese Funktion kehrt nicht zurück, da wir umleiten
    return new Promise<any>(() => {});
  },
  
  // Google OAuth Callback verarbeiten
  handleGoogleCallback: async (code: string) => {
    // In einer echten App würden Sie den Code gegen ein Token austauschen
    // und dann mit diesem Token Benutzerinformationen abrufen
    
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
    };
    
    localStorage.setItem("auth_token", "mock_google_jwt_token");
    
    return currentUser;
  },
  
  // Registrierung
  signUp: async (name: string, email: string, password: string) => {
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
    };
    
    MOCK_USERS.push(newUser);
    
    // E-Mail-Bestätigung simulieren
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
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
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Überprüfen, ob ein Benutzer mit dieser E-Mail existiert
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (!user) {
      // Wir geben keinen Fehler zurück, um nicht preiszugeben, ob ein Benutzer existiert
      // In einer echten App würde dennoch eine E-Mail gesendet werden
    }
    
    return { success: true };
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
    // Token löschen
    localStorage.removeItem("auth_token");
    currentUser = null;
    
    return { success: true };
  },
  
  // Aktuellen Benutzer abrufen
  getCurrentUser: () => {
    // Überprüfen, ob Token vorhanden ist
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      return null;
    }
    
    return currentUser || null;
  },
  
  // Überprüfen, ob Benutzer angemeldet ist
  isAuthenticated: () => {
    return !!localStorage.getItem("auth_token");
  },

  // E-Mail verifizieren
  verifyEmail: async (token: string) => {
    // Simulierte API-Verzögerung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    isEmailVerified = true;
    
    return { success: true };
  }
};
