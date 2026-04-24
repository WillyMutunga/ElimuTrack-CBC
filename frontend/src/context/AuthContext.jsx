import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

// Helper to build user object from a decoded JWT
const buildUserFromToken = (decoded) => ({
    id: decoded.id ?? decoded.user_id,
    username: decoded.username,
    role: decoded.role,
    is_verified: decoded.is_verified ?? false,
    is_profile_complete: decoded.is_profile_complete ?? false,
    student_id: decoded.student_id,
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    setUser(buildUserFromToken(decoded));
                } catch (e) {
                    console.error("Invalid token", e);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('token/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            const decoded = jwtDecode(response.data.access);
            setUser(buildUserFromToken(decoded));
            return true;
        } catch (error) {
            // Re-throw so callers can inspect the error detail (e.g. unverified_account)
            throw error;
        }
    };

    // Allows refreshing user state after a profile update
    const refreshUser = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(buildUserFromToken(decoded));
            } catch (e) {}
        }
    };

    const loginWithToken = (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        const decoded = jwtDecode(accessToken);
        setUser(buildUserFromToken(decoded));
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, loginWithToken, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
