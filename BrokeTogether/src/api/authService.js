import axios from "axios";
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
    }
};

export default authService;