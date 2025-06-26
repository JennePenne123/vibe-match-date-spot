
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, Friend, Venue, DateInvite } from '@/types';

interface GlobalState {
  // User State
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  
  // App Data
  friends: Friend[];
  venues: Venue[];
  dateInvitations: DateInvite[];
  
  // UI State
  loading: {
    friends: boolean;
    venues: boolean;
    invitations: boolean;
    auth: boolean;
  };
  
  // Preferences
  preferences: {
    selectedCuisines: string[];
    selectedVibes: string[];
    selectedArea: string;
  };
}

type GlobalAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_FRIENDS'; payload: Friend[] }
  | { type: 'SET_VENUES'; payload: Venue[] }
  | { type: 'SET_DATE_INVITATIONS'; payload: DateInvite[] }
  | { type: 'SET_LOADING'; payload: { key: keyof GlobalState['loading']; value: boolean } }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<GlobalState['preferences']> }
  | { type: 'ACCEPT_INVITATION'; payload: number }
  | { type: 'DECLINE_INVITATION'; payload: number }
  | { type: 'TOGGLE_FRIEND_INVITATION'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: GlobalState = {
  user: null,
  isAuthenticated: false,
  authLoading: true,
  friends: [],
  venues: [],
  dateInvitations: [],
  loading: {
    friends: false,
    venues: false,
    invitations: false,
    auth: true,
  },
  preferences: {
    selectedCuisines: [],
    selectedVibes: [],
    selectedArea: '',
  },
};

function globalStateReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        authLoading: false,
      };
    
    case 'SET_AUTH_LOADING':
      return {
        ...state,
        authLoading: action.payload,
      };
    
    case 'SET_FRIENDS':
      return {
        ...state,
        friends: action.payload,
      };
    
    case 'SET_VENUES':
      return {
        ...state,
        venues: action.payload,
      };
    
    case 'SET_DATE_INVITATIONS':
      return {
        ...state,
        dateInvitations: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    
    case 'ACCEPT_INVITATION':
      return {
        ...state,
        dateInvitations: state.dateInvitations.filter(inv => inv.id !== action.payload),
      };
    
    case 'DECLINE_INVITATION':
      return {
        ...state,
        dateInvitations: state.dateInvitations.filter(inv => inv.id !== action.payload),
      };
    
    case 'TOGGLE_FRIEND_INVITATION':
      return {
        ...state,
        friends: state.friends.map(friend =>
          friend.id === action.payload
            ? { ...friend, isInvited: !friend.isInvited }
            : friend
        ),
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

interface GlobalStateContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  actions: {
    setUser: (user: User | null) => void;
    setAuthLoading: (loading: boolean) => void;
    setFriends: (friends: Friend[]) => void;
    setVenues: (venues: Venue[]) => void;
    setDateInvitations: (invitations: DateInvite[]) => void;
    setLoading: (key: keyof GlobalState['loading'], value: boolean) => void;
    updatePreferences: (preferences: Partial<GlobalState['preferences']>) => void;
    acceptInvitation: (id: number) => void;
    declineInvitation: (id: number) => void;
    toggleFriendInvitation: (friendId: string) => void;
    resetState: () => void;
  };
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(globalStateReducer, initialState);

  const actions = {
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    setAuthLoading: (loading: boolean) => dispatch({ type: 'SET_AUTH_LOADING', payload: loading }),
    setFriends: (friends: Friend[]) => dispatch({ type: 'SET_FRIENDS', payload: friends }),
    setVenues: (venues: Venue[]) => dispatch({ type: 'SET_VENUES', payload: venues }),
    setDateInvitations: (invitations: DateInvite[]) => dispatch({ type: 'SET_DATE_INVITATIONS', payload: invitations }),
    setLoading: (key: keyof GlobalState['loading'], value: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: { key, value } }),
    updatePreferences: (preferences: Partial<GlobalState['preferences']>) =>
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences }),
    acceptInvitation: (id: number) => dispatch({ type: 'ACCEPT_INVITATION', payload: id }),
    declineInvitation: (id: number) => dispatch({ type: 'DECLINE_INVITATION', payload: id }),
    toggleFriendInvitation: (friendId: string) => dispatch({ type: 'TOGGLE_FRIEND_INVITATION', payload: friendId }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };

  return (
    <GlobalStateContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
