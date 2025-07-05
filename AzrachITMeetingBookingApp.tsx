import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, X, Check, AlertCircle, Building2, Snowflake, Volume2 } from 'lucide-react';

// Define the backend API URL
const API_URL = 'https://azrachit-booking-api.onrender.com';

const AzrachITMeetingBookingApp = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    attendees: '',
    notes: ''
  });
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch bookings from the API whenever the selectedDate changes
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/bookings/${selectedDate}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bookings from the server.');
        }
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDate]);

  const meetingRoom = {
    name: 'AzrachIT Conference Suite',
    capacity: 10,
    location: 'Prabhu Bank Building, Gabahal Road',
    amenities: ['Air Conditioning', 'Sound Proof']
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 18 && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getCurrentTimeBlock = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const roundedMinute = Math.ceil(currentMinute / 15) * 15;
    
    if (roundedMinute >= 60) {
      return `${(currentHour + 1).toString().padStart(2, '0')}:00`;
    }
    return `${currentHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
  };

  const isTimeInPast = (time) => {
    if (selectedDate !== new Date().toISOString().split('T')[0]) {
      return false;
    }
    
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0, 0);
    
    return timeDate < now;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBookRoom = async () => {
    if (!bookingForm.title || !bookingForm.startTime || !bookingForm.endTime) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    if (bookingForm.startTime >= bookingForm.endTime) {
      showNotification('End time must be after start time', 'error');
      return;
    }
    if (isTimeInPast(bookingForm.startTime)) {
      showNotification('Cannot book meetings in the past', 'error');
      return;
    }
    if (bookingForm.attendees && parseInt(bookingForm.attendees) > meetingRoom.capacity) {
      showNotification(`Maximum capacity is ${meetingRoom.capacity} people`, 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          date: selectedDate,
          attendees: bookingForm.attendees ? parseInt(bookingForm.attendees) : null
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to book the room.');
      }

      setBookings([...bookings, result]);
      setShowBookingForm(false);
      setBookingForm({ title: '', startTime: '', endTime: '', attendees: '', notes: '' });
      showNotification('Meeting room booked successfully!');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel the booking.');
      }
      
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      showNotification('Booking cancelled successfully');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const getDateBookings = () => {
    return bookings.filter(booking => booking.date === selectedDate);
  };

  const getTodayBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => booking.date === today);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + timezoneOffset);

    return adjustedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isSelectedDateToday = () => {
    return selectedDate === new Date().toISOString().split('T')[0];
  };

  const AzrachITLogo = ({ size = 'md' }) => {
    const sizeClasses = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="azrachit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <path d="M20 80 L50 20 L80 80 L65 80 L50 50 L35 80 Z" fill="url(#azrachit-gradient)" className="drop-shadow-sm" />
          <path d="M50 70 L45 80 L50 90 L55 80 Z" fill="url(#azrachit-gradient)" className="drop-shadow-sm" />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100">
      {/* The rest of your JSX remains the same... */}
    </div>
  );
};

export default AzrachITMeetingBookingApp;
