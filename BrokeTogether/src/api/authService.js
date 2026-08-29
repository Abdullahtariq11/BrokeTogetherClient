import client from "./client";

/**
 * Authentication service for handling user login and registration
 * @typedef {Object} authService
 * @property {Function} login - Authenticates user with email and password
 * @property {Function} register - Creates a new user account
 */
const authService = {
    /**
       * Sends credentials to Railway backend
       * @param {string} email 
       * @param {string} password 
       * @returns {Promise} - Resolves with { token, user }
       */
    login: async (email, password) => {
        try {
            const response = await client.post("auth/login", {
                username: email,
                password: password
            });
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 423) {
                const msg = error.response?.data || "Account temporarily locked.";
                const lockError = new Error(typeof msg === 'string' ? msg : "Account temporarily locked.");
                lockError.isLocked = true;
                throw lockError;
            }
            if (status === 400 || status === 401 || status === 403) {
                throw "No account found with these credentials. Please check your email and password or create a new account.";
            }
            throw error.response?.data?.message || "Login failed. Please check your credentials.";
        }
    },

    /**  Sends credentials to Railway backend
      * @param {string} fullName 
      * @param {string} email 
      * @param {string} password 
      * @returns {Promise} - Resolves with { token, user }
      */
    register: async ( email,fullName, password) => {
        try {
            const response = await client.post("auth/register", {
                name: fullName,
                username: email,
                password: password
            });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Registration failed.";
        }
    },
    getProfile: async () => {
        try {
            const response = await client.get('/users/me');
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Could not fetch profile";
        }
    },

    deleteAccount: async () => {
        try {
            const response = await client.delete('/users/me');
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Could not delete account. Please try again.";
        }
    },

    resetPassword: async (currentPassword, newPassword) => {
        try {
            await client.post('/users/password-reset', { currentPassword, newPassword });
        } catch (error) {
            const data = error?.response?.data;
            const message =
                (typeof data === 'object' && data?.message)
                || (typeof data === 'string' && data)
                || error?.message
                || "Failed to reset password. Please try again.";
            throw new Error(message);
        }
    },

    editName: async (name) => {
        try {
            const response = await client.put('/users/edit', { name });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Failed to update name. Please try again.";
        }
    },

    /**
     * Mobile Google Sign-In — sends a Google access token to the backend,
     * which verifies it with Google and returns a BrokeTogether JWT.
     * @param {string} accessToken  - Google OAuth2 access token from expo-auth-session
     */
    googleMobileLogin: async (accessToken) => {
        try {
            const response = await client.post('/auth/google/mobile', { accessToken });
            return response.data; // { token, username, name }
        } catch (error) {
            throw error.response?.data?.message || "Google sign-in failed. Please try again.";
        }
    },

    /**
     * Mobile Sign in with Apple — sends the identity token from
     * expo-apple-authentication to the backend, which verifies it with Apple
     * and returns a BrokeTogether JWT.
     * @param {string} identityToken - JWT from AppleAuthentication.signInAsync()
     * @param {string} [fullName] - Only present on the user's first sign-in; Apple omits it afterward.
     */
    appleMobileLogin: async (identityToken, fullName) => {
        try {
            const response = await client.post('/auth/apple/mobile', { identityToken, fullName });
            return response.data; // { token, username, name }
        } catch (error) {
            throw error.response?.data?.message || "Apple sign-in failed. Please try again.";
        }
    },

    /**
     * Sends a password reset email to the given address.
     * Always returns success to prevent email enumeration.
     * @param {string} email
     */
    forgotPassword: async (email) => {
        try {
            const response = await client.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Something went wrong. Please try again.";
        }
    },

    /**
     * Resets the user's password using a valid reset token from the email link.
     * @param {string} token
     * @param {string} newPassword
     */
    resetPasswordWithToken: async (token, newPassword) => {
        try {
            const response = await client.post('/auth/reset-password', { token, newPassword });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || "Reset failed. The link may be expired or already used.";
        }
    },
};

export default authService;