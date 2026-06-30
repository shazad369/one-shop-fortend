import { createContext, useState, ReactNode, useContext, useEffect } from 'react';

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  logOut: () => void;
  buyerid: any;
  setbuyerid: React.Dispatch<React.SetStateAction<any>>;
  locationData: any;
}

export const UserContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [buyerid, setbuyerid] = useState(() => {
    const saved = localStorage.getItem('buyerid');
    return saved ? JSON.parse(saved) : null;
  });

  const [locationData, setLocationData] = useState<any>(null);

  // user বদলালে localStorage এ সেভ করো
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // buyerid বদলালে localStorage এ সেভ করো
  useEffect(() => {
    if (buyerid) {
      localStorage.setItem('buyerid', JSON.stringify(buyerid));
    } else {
      localStorage.removeItem('buyerid');
    }
  }, [buyerid]);
useEffect(() => {
  if (!user?.email) return;

 const fetchLocation = () => {
  fetch(
    `${import.meta.env.VITE_API}/userlocation?email=${encodeURIComponent(user.email)}`,
    {
      method: "GET",
      headers: {
          'x-api-key': import.meta.env.VITE_API_KEY,
          'Content-Type': 'application/json',
         'ngrok-skip-browser-warning': 'true'
      },
    }
  )
    .then((r) => r.json())
    .then((data) => {
      if (data && !data.error && data.name) {
        setLocationData(data);
      } else {
        setLocationData(null);
      }
    })
    .catch(() => setLocationData(null));
};

  fetchLocation();

  // DeliveryForm save/delete করলে এই event fire হবে
  window.addEventListener('location-updated', fetchLocation);
  return () => window.removeEventListener('location-updated', fetchLocation);

}, [user?.email]);
  const logOut = () => {
    setUser(null);
    setbuyerid(null);
    setLocationData(null);
    localStorage.removeItem('user');
    localStorage.removeItem('buyerid');
    console.log('User logged out successfully');
  };

  return (
    <UserContext.Provider value={{ user, setUser, buyerid, setbuyerid, logOut, locationData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
