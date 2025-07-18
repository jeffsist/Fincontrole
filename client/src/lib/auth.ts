import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";

export const signInWithGoogle = async () => {
  try {
    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Try popup first, fallback to redirect on mobile or if popup fails
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return null; // Will be handled by getRedirectResult
    } else {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (popupError: any) {
        // If popup fails, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          console.log("Popup failed, trying redirect...");
          await signInWithRedirect(auth, googleProvider);
          return null;
        }
        throw popupError;
      }
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Handle specific error messages
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelado pelo usuário');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup bloqueado pelo navegador');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Domínio não autorizado no Firebase. Adicione este domínio aos domínios autorizados no Firebase Console.');
    } else if (error.message.includes('redirect_uri_mismatch')) {
      throw new Error('Erro 400: Domínio não autorizado. Adicione este domínio ao Firebase Console em Authentication > Settings > Authorized domains');
    } else {
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    // Handle redirect result for mobile/popup blocked users
    if (!user) {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          user = result.user;
        }
      } catch (error) {
        console.error('Error getting redirect result:', error);
      }
    }
    
    if (user) {
      // Store user in localStorage for API requests
      localStorage.setItem('firebase-user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));
      
      // Create user in database if not exists
      try {
        const { apiClient } = await import('./api-client');
        await apiClient.createUser({
          email: user.email!,
          displayName: user.displayName || undefined
        });
      } catch (error) {
        console.error('Error creating user:', error);
      }
    } else {
      // Remove user from localStorage
      localStorage.removeItem('firebase-user');
    }
    
    callback(user);
  });
};
