import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, X, Check, AlertCircle, Building2, Snowflake, Volume2 } from 'lucide-react';

// IMPORTANT: Replace this with your actual, correct Render URL
const API_URL = 'https://azrachit-booking-api.onrender.com/api';

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    attendees: '',
    notes: ''
  });
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);

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
      } catch (error: any) {
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

  const isTimeInPast = (time: string) => {
    if (selectedDate !== new Date().toISOString().split('T')[0]) {
      return false;
    }
    
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0, 0);
    
    return timeDate < now;
  };

  const showNotification = (message: string, type = 'success') => {
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
    } catch (error: any) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel the booking.');
      }
      
      setBookings(bookings.filter(booking => (booking as any).id !== bookingId));
      showNotification('Booking cancelled successfully');
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  const getDateBookings = () => {
    return bookings.filter(booking => (booking as any).date === selectedDate);
  };

  const getTodayBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => (booking as any).date === today);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
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

  const AzrachITLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses: { [key: string]: string } = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
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
      {/* Header */}
      <div className="bg-white shadow-xl border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <AzrachITLogo size="lg" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-900 bg-clip-text text-transparent">
                  Meeting Room Booking
                </h1>
                <p className="text-blue-600 mt-1 font-medium">AzrachIT Conference Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 rounded-xl border border-blue-200">
                <Calendar className="w-5 h-5 text-blue-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-slate-700 font-medium"
                />
              </div>
              <button
                onClick={() => {
                  setShowBookingForm(true);
                  if (isSelectedDateToday()) {
                    const currentTimeBlock = getCurrentTimeBlock();
                    setBookingForm(prev => ({
                      ...prev,
                      startTime: currentTimeBlock,
                      endTime: ''
                    }));
                  } else {
                    setBookingForm(prev => ({
                      ...prev,
                      startTime: '09:00',
                      endTime: ''
                    }));
                  }
                }}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-sky-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>{loading ? 'Loading...' : 'Book Room'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Info */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800">{meetingRoom.name}</h2>
              </div>
              <div className="flex items-center space-x-8 text-slate-600 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Capacity: {meetingRoom.capacity} people</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{meetingRoom.location}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {meetingRoom.amenities.map((amenity, index) => (
                  <div
                    key={amenity}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 text-sm rounded-lg border border-blue-200 font-medium"
                  >
                    {index === 0 && <Snowflake className="w-4 h-4" />}
                    {index === 1 && <Volume2 className="w-4 h-4" />}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right bg-gradient-to-r from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{getDateBookings().length}</div>
              <div className="text-sm text-slate-600 font-medium">
                bookings {isSelectedDateToday() ? 'today' : 'on selected date'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selected Date Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Bookings for {formatDate(selectedDate)}
                </h2>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {getDateBookings().length} booking{getDateBookings().length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="space-y-4">
                {getDateBookings().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-100 to-sky-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-lg font-medium">No bookings for this date</p>
                    <p className="text-sm text-slate-400 mt-2">The conference room is available all day</p>
                  </div>
                ) : (
                  getDateBookings()
                    .sort((a, b) => (a as any).startTime.localeCompare((b as any).startTime))
                    .map((booking) => (
                      <div key={(booking as any).id} className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-6 hover:from-blue-100 hover:to-sky-100 transition-all duration-200 border border-blue-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg mb-2">{(booking as any).title}</h3>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-slate-700 font-medium">
                                {formatTime((booking as any).startTime)} - {formatTime((booking as any).endTime)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelBooking((booking as any).id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(booking as any).attendees && (
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{(booking as any).attendees} attendees</span>
                            </div>
                          )}
                          {(booking as any).notes && (
                            <div className="text-sm text-slate-600 bg-white p-4 rounded-lg border border-blue-200">
                              <strong className="text-slate-700">Notes:</strong> {(booking as any).notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Today's Bookings Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
              <div className="flex items-center space-x-3 mb-6">
                <AzrachITLogo size="sm" />
                <h2 className="text-xl font-bold text-slate-800">Today's Overview</h2>
              </div>
              <div className="space-y-4">
                {getTodayBookings().length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-3 w-12 h-12 bg-gradient-to-r from-blue-100 to-sky-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-slate-500 font-medium">No bookings for today</p>
                    <p className="text-sm text-slate-400">Room is available</p>
                  </div>
                ) : (
                  getTodayBookings()
                    .sort((a, b) => (a as any).startTime.localeCompare((b as any).startTime))
                    .map((booking) => (
                      <div key={(booking as any).id} className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4 hover:from-blue-100 hover:to-sky-100 transition-all duration-200 border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-slate-800 text-sm">{(booking as any).title}</h3>
                          <button
                            onClick={() => handleCancelBooking((booking as any).id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{formatTime((booking as any).startTime)} - {formatTime((booking as any).endTime)}</span>
                          </div>
                          {(booking as any).attendees && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{(booking as any).attendees} attendees</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-blue-100">
            <div className="flex items-center space-x-4 mb-6">
              <AzrachITLogo size="sm" />
              <h2 className="text-xl font-bold text-slate-800">Book Conference Room</h2>
              <button
                onClick={() => setShowBookingForm(false)}
                className="ml-auto text-slate-500 hover:text-slate-700 p-1 rounded transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Weekly strategy meeting"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Time *
                  </label>
                  <select
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select start time</option>
                    {timeSlots.map(time => (
                      <option 
                        key={time} 
                        value={time}
                        disabled={isTimeInPast(time)}
                        className={isTimeInPast(time) ? 'text-slate-400' : ''}
                      >
                        {formatTime(time)} {isTimeInPast(time) ? '(Past)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Time *
                  </label>
                  <select
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={!bookingForm.startTime}
                  >
                    <option value="">Select end time</option>
                    {timeSlots
                      .filter(time => !bookingForm.startTime || time > bookingForm.startTime)
                      .map(time => (
                        <option 
                          key={time} 
                          value={time}
                          disabled={isTimeInPast(time)}
                          className={isTimeInPast(time) ? 'text-slate-400' : ''}
                        >
                          {formatTime(time)} {isTimeInPast(time) ? '(Past)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Number of Attendees
                </label>
                <input
                  type="number"
                  value={bookingForm.attendees}
                  onChange={(e) => setBookingForm({ ...bookingForm, attendees: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="8"
                  min="1"
                  max={meetingRoom.capacity}
                />
                <p className="text-xs text-slate-500 mt-1">Maximum: {meetingRoom.capacity} people</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Meeting Notes
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                  placeholder="Special requirements or agenda items..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setBookingForm({ title: '', startTime: '', endTime: '', attendees: '', notes: '' });
                }}
                className="flex-1 bg-slate-200 text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBookRoom}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-sky-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                {loading ? 'Booking...' : 'Book Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
