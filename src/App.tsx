import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, X, Check, AlertCircle, Building2, Snowflake, Volume2, Type, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

// IMPORTANT: Make sure this URL is correct for your live backend
const API_URL = 'https://azrachit-booking-api.onrender.com/api';

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    attendees: '',
    notes: ''
  });
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  // Memoize the calculation of available time slots
  const availableTimeSlots = useMemo(() => {
    const slots = [];
    const now = new Date();
    const isToday = new Date(selectedDate).setHours(0,0,0,0) === today.getTime();

    const isSlotBooked = (slot: string) => {
      return bookings.some(booking => slot >= booking.startTime && slot < booking.endTime);
    };

    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if ((hour === 8 && minute < 30) || (hour === 17 && minute > 30)) continue;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        if (isToday) {
          const slotTime = new Date(`${selectedDate}T${timeString}`);
          if (slotTime < now) continue;
        }

        if (isSlotBooked(timeString)) continue;
        
        slots.push(timeString);
      }
    }
    return slots;
  }, [selectedDate, bookings, today]);


  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/bookings/${selectedDate}`);
        if (!response.ok) throw new Error('Failed to fetch bookings.');
        const data = await response.json();
        setBookings(data.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)));
      } catch (error: any) {
        showNotification(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [selectedDate]);

  const meetingRoom = {
    name: 'AzrachIT Huddle Room',
    capacity: 10,
    location: 'Prabhu Bank Building, Gabahal Road',
    amenities: ['Air Conditioning', 'Sound Proof']
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
      if (!response.ok) throw new Error(result.error || 'Failed to book room.');

      setBookings([...bookings, result].sort((a,b) => a.startTime.localeCompare(b.startTime)));
      setShowBookingForm(false);
      setBookingForm({ title: '', startTime: '', endTime: '', attendees: '', notes: '' });
      showNotification('Room booked successfully!');
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
      if (!response.ok) throw new Error('Failed to cancel booking.');
      
      setBookings(bookings.filter(booking => (booking as any).id !== bookingId));
      showNotification('Booking cancelled successfully');
    } catch (error: any) {
      showNotification(error.message, 'error');
    }
  };

  const formatTime = (time: string) => new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatShortDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const AzrachITLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses: { [key: string]: string } = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
    return (
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="azrachit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" /><stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          <path d="M20 80 L50 20 L80 80 L65 80 L50 50 L35 80 Z" fill="url(#azrachit-gradient)" className="drop-shadow-sm" />
          <path d="M50 70 L45 80 L50 90 L55 80 Z" fill="url(#azrachit-gradient)" className="drop-shadow-sm" />
        </svg>
      </div>
    );
  };

  const CalendarModal = ({ isOpen, onClose, selected, onSelect }: { isOpen: boolean; onClose: () => void; selected: string; onSelect: (date: string) => void; }) => {
    const [displayDate, setDisplayDate] = useState(new Date(selected + 'T00:00:00'));
  
    if (!isOpen) return null;
  
    const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
  
    const days = Array.from({ length: startDay }, (_, i) => <div key={`empty-${i}`} />);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const isSelected = dateString === selected;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
  
      days.push(
        <button
          key={day}
          disabled={isPast}
          onClick={() => { onSelect(dateString); onClose(); }}
          className={`w-10 h-10 rounded-full transition-colors duration-200 flex items-center justify-center
            ${isPast ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-100'}
            ${isSelected ? 'bg-blue-500 text-white font-bold' : ''}
            ${!isSelected && isToday ? 'border-2 border-blue-500' : ''}
          `}
        >
          {day}
        </button>
      );
    }
  
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full animate-in fade-in-0 zoom-in-95" onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <button onClick={() => setDisplayDate(new Date(displayDate.setMonth(displayDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-slate-100"><ChevronLeft /></button>
            <div className="font-bold text-lg">{displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => setDisplayDate(new Date(displayDate.setMonth(displayDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-slate-100"><ChevronRight /></button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 text-center text-sm text-slate-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center space-x-4">
              <AzrachITLogo size="md" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Room Booking</h1>
                <p className="text-slate-500 text-sm">AzrachIT Simple Room Scheduler</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button onClick={() => setShowDatePicker(true)} className="relative flex-1 bg-white pl-10 pr-3 py-2 rounded-lg border border-slate-200 shadow-sm w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <span className="text-slate-700 font-medium text-sm">{formatShortDate(selectedDate)}</span>
              </button>
              <button
                onClick={() => {
                  setShowBookingForm(true);
                  setBookingForm({ title: '', startTime: '', endTime: '', attendees: '', notes: '' });
                }}
                disabled={loading}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Book Room</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <CalendarModal isOpen={showDatePicker} onClose={() => setShowDatePicker(false)} selected={selectedDate} onSelect={setSelectedDate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 mb-8 border border-slate-200/80">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="w-full md:w-auto">
              <div className="flex items-center space-x-3 mb-3">
                <Building2 className="w-7 h-7 text-blue-600 flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{meetingRoom.name}</h2>
              </div>
              <div className="pl-10 space-y-2 text-slate-600">
                <div className="flex items-center space-x-2 text-sm"><Users className="w-4 h-4 text-slate-500" /><span>Capacity: {meetingRoom.capacity} people</span></div>
                <div className="flex items-center space-x-2 text-sm"><MapPin className="w-4 h-4 text-slate-500" /><span>{meetingRoom.location}</span></div>
              </div>
              <div className="pl-10 mt-4 flex flex-wrap gap-2">
                {meetingRoom.amenities.map((amenity, index) => (
                  <div key={amenity} className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                    {index === 0 ? <Snowflake className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}<span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center bg-slate-50/80 p-4 rounded-lg border border-slate-200 w-full md:w-auto flex-shrink-0">
              <div className="text-4xl font-bold text-blue-600">{getDateBookings().length}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Bookings</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Schedule for {formatDate(selectedDate)}</h2>
          <div className="space-y-4">
            {loading ? <div className="text-center py-12 text-slate-500">Loading schedule...</div>
            : getDateBookings().length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-medium">No bookings for this date.</p>
                <p className="text-sm">The room is available all day.</p>
              </div>
            ) : (
              getDateBookings().map((booking) => (
                <div key={(booking as any).id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-300">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{(booking as any).title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-slate-600 mt-1">
                        <div className="flex items-center space-x-1.5"><Clock className="w-4 h-4 text-blue-500" /><span>{formatTime((booking as any).startTime)} - {formatTime((booking as any).endTime)}</span></div>
                        {(booking as any).attendees && <div className="flex items-center space-x-1.5 mt-1 sm:mt-0"><Users className="w-4 h-4 text-blue-500" /><span>{(booking as any).attendees} attendees</span></div>}
                      </div>
                    </div>
                    <button onClick={() => handleCancelBooking((booking as any).id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                  {(booking as any).notes && <div className="text-sm text-slate-600 bg-white p-3 mt-3 rounded-md border border-slate-200 whitespace-pre-wrap">{(booking as any).notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showBookingForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Book Meeting Room</h2>
              <button onClick={() => setShowBookingForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title *</label>
                <div className="relative"><Type className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={bookingForm.title} onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })} className="w-full bg-slate-50 border-slate-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Weekly Sync" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                  <select value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value, endTime: '' })} className="w-full bg-slate-50 border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    {availableTimeSlots.length > 0 ? availableTimeSlots.map(time => <option key={time} value={time}>{formatTime(time)}</option>) : <option disabled>No slots available</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                  <select value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} className="w-full bg-slate-50 border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!bookingForm.startTime}>
                    <option value="">Select</option>
                    {availableTimeSlots.filter(time => !bookingForm.startTime || time >= bookingForm.startTime).map((time, index, arr) => {
                      // Find the next booked slot after the start time
                      const nextBookedSlot = bookings.find(b => b.startTime > bookingForm.startTime)?.startTime;
                      // If there is a next booked slot, only show times before it
                      if (nextBookedSlot && time >= nextBookedSlot) return null;
                      // Don't show the start time itself in the end time list
                      if (time === bookingForm.startTime) return null;
                      return <option key={time} value={time}>{formatTime(time)}</option>
                    })}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attendees</label>
                <div className="relative"><Users className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="number" value={bookingForm.attendees} onChange={(e) => setBookingForm({ ...bookingForm, attendees: e.target.value })} className="w-full bg-slate-50 border-slate-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={`Max: ${meetingRoom.capacity}`} min="1" max={meetingRoom.capacity} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <div className="relative"><FileText className="w-5 h-5 text-slate-400 absolute left-3 top-3" /><textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} className="w-full bg-slate-50 border-slate-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} placeholder="e.g., Agenda items..." /></div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button onClick={() => setShowBookingForm(false)} className="bg-white text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-100 border border-slate-300 transition-all font-semibold active:scale-95">Cancel</button>
              <button onClick={handleBookRoom} disabled={loading} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold shadow-md hover:shadow-lg active:scale-95">{loading ? 'Booking...' : 'Confirm Booking'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
