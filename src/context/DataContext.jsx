import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  // Doctors: Updated scheme with isSpecialist and color
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. José Bernardo', isSpecialist: false, color: '#3b82f6', status: 'Activo' },
    { id: 2, name: 'Dra. María José', isSpecialist: true, color: '#10b981', status: 'Activo' },
    { id: 3, name: 'Dr. Aaron Aronin', isSpecialist: true, color: '#8b5cf6', status: 'Activo' },
    { id: 4, name: 'Dra. Elena Marín', isSpecialist: true, color: '#f59e0b', status: 'Activo' }
  ]);

  // Services Catalog
  const [services, setServices] = useState([
    { id: 1, name: 'Limpieza profunda', price: 45, cat: 'Preventiva' },
    { id: 2, name: 'Resina Oclusal', price: 35, cat: 'Restaurativa' },
    { id: 3, name: 'Blanqueamiento', price: 120, cat: 'Estética' }
  ]);

  // Patients
  const [patients, setPatients] = useState([
    { id: 'p1', name: 'Fabian Romero', email: 'fabian@example.com', phone: '+12345678', totalDue: 120, history: []},
    { id: 'p2', name: 'Mariana Sosa', email: 'mariana@example.com', phone: '+87654321', totalDue: 500, history: []},
    { id: 'p3', name: 'Juan Pérez', email: 'juan@example.com', phone: '+11223344', totalDue: 80, history: []}
  ]);

  // Expenses
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Laboratorio', description: 'Corona Zirconio', amount: 45, date: '2024-03-08' },
  ]);

  // Appointments (array of full appointment objects)
  // Format: { id, date: 'YYYY-MM-DD', startTime, endTime, blocks: ['08:00', '08:15'], patientName, patientPhone, doctorId, services: [{serviceId, qty, price, subtotal}], totalCost }
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      date: new Date().toISOString().split('T')[0], // Today
      blocks: ['08:00', '08:15', '08:30'],
      patientName: 'Juan Pérez',
      doctorId: 1,
      services: [{ serviceId: 1, name: 'Limpieza profunda', qty: 1, price: 45, subtotal: 45 }],
      totalCost: 45
    },
    {
      id: 2,
      date: new Date().toISOString().split('T')[0], // Today
      blocks: ['10:00', '10:15'],
      patientName: 'Mariana Sosa',
      doctorId: 3,
      services: [{ serviceId: 2, name: 'Resina Oclusal', qty: 1, price: 35, subtotal: 35 }],
      totalCost: 35
    }
  ]);

  // --- Functions ---
  const addService = (service) => setServices(prev => [...prev, { ...service, id: Date.now() }]);
  const removeService = (id) => setServices(prev => prev.filter(s => s.id !== id));
  const updateService = (updatedService) => setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));

  const addDoctor = (doctor) => setDoctors(prev => [...prev, { ...doctor, id: Date.now() }]);
  const removeDoctor = (id) => setDoctors(prev => prev.filter(d => d.id !== id));
  const updateDoctor = (updatedDoctor) => setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));

  const addPayment = (patientId, payment) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) return { ...p, history: [payment, ...p.history] };
      return p;
    }));
  };

  const addExpense = (expense) => setExpenses(prev => [...prev, { ...expense, id: Date.now() }]);

  // Advanced appointment scheduling
  const addAppointment = (appointmentData) => {
    const newAppointment = {
      ...appointmentData,
      id: Date.now()
    };
    
    // Auto-update patient balance if patient is registered (optional depending on exact patient ID match, but we use name for simplicity or we can search by name)
    const existingPatient = patients.find(p => p.name.toLowerCase() === appointmentData.patientName.toLowerCase());
    if (existingPatient) {
      setPatients(prev => prev.map(p => 
        p.id === existingPatient.id ? { ...p, totalDue: p.totalDue + appointmentData.totalCost } : p
      ));
    }

    setAppointments(prev => [...prev, newAppointment]);
  };

  return (
    <DataContext.Provider value={{
      services, addService, removeService, updateService,
      doctors, addDoctor, removeDoctor, updateDoctor,
      patients, addPayment,
      expenses, addExpense,
      appointments, addAppointment
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
