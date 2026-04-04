import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState(45.50); // Default placeholder
  const [currency, setCurrency] = useState('USD'); // Default display currency
  const [clinicName, setClinicName] = useState('SmartDental'); // Default clinic name

  // In a real app, this would fetch from the database 'settings' table
  useEffect(() => {
    const savedRate = localStorage.getItem('exchangeRate');
    if (savedRate) setExchangeRate(parseFloat(savedRate));

    const savedClinic = localStorage.getItem('clinicName');
    if (savedClinic) setClinicName(savedClinic);
  }, []);

  const updateExchangeRate = (rate) => {
    setExchangeRate(rate);
    localStorage.setItem('exchangeRate', rate);
  };

  const updateClinicName = (name) => {
    setClinicName(name);
    localStorage.setItem('clinicName', name);
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'VES' : 'USD');
  };

  const formatPrice = (priceUsd) => {
    if (currency === 'VES') {
      return (priceUsd * exchangeRate).toLocaleString('es-VE', { style: 'currency', currency: 'VES' });
    }
    return priceUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <SettingsContext.Provider value={{ 
      exchangeRate, 
      updateExchangeRate, 
      currency, 
      toggleCurrency,
      formatPrice,
      clinicName,
      updateClinicName
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
