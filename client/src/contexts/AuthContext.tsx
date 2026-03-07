import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

interface Workspace {
    id: string;
    name: string;
    slug: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (workspace: Workspace) => void;
    loading: boolean;
    login: (token: string) => void;
    refreshProfile: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            const { user, workspaces } = response.data.data;
            setUser(user);
            setWorkspaces(workspaces);

            // Load last active workspace or default to first
            const savedWsId = localStorage.getItem('activeWorkspaceId');
            const active = workspaces.find((ws: Workspace) => ws.id === savedWsId) || workspaces[0];
            if (active) {
                setActiveWorkspaceState(active);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem('token', token);
        fetchProfile();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('activeWorkspaceId');
        setUser(null);
        setWorkspaces([]);
        setActiveWorkspaceState(null);
    };

    const setActiveWorkspace = (workspace: Workspace) => {
        setActiveWorkspaceState(workspace);
        localStorage.setItem('activeWorkspaceId', workspace.id);
    };

    return (
        <AuthContext.Provider value={{
            user,
            workspaces,
            activeWorkspace,
            setActiveWorkspace,
            loading,
            login,
            refreshProfile: fetchProfile,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
