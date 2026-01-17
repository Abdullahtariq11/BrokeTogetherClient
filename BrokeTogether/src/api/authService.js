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
            throw error.response?.data?.message || "Login failed. Please check your credentials.";
        }
    },

    /**  Sends credentials to Railway backend
      * @param {string} fullName 
      * @param {string} email 
      * @param {string} password 
      * @returns {Promise} - Resolves with { token, user }
      */
    register: async (fullName, email, password) => {
        try {
            const response = await client.post("auth/register", {
                username: email,
                name: fullName,
                password: password
            })
        } catch (error) {
            throw error.response?.data?.message || "Registration failed.";
        }
    }
};

export default authService;