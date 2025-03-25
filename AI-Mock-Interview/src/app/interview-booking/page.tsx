"use client"
// pages/booking.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Updated import for App Router

// Types
type DateStatus = 'available' | 'almost-full' | 'full';
type TimeSlot = {
  time: string;
  status: DateStatus;
};

type BookingDate = {
  date: Date;
  status: DateStatus;
  timeSlots: TimeSlot[];
};

// Mock data for available dates and slots
const generateMockData = (): BookingDate[] => {
  const today = new Date();
  const mockData: BookingDate[] = [];

  // Generate data for the next 60 days
  for (let i = 0; i < 60; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    
    // Randomly assign status (for demo purposes)
    const statusOptions: DateStatus[] = ['available', 'almost-full', 'full'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    // Generate time slots
    const timeSlots: TimeSlot[] = [];
    if (randomStatus !== 'full') {
      const startHour = 9; // 9 AM
      const endHour = 17; // 5 PM
      
      for (let hour = startHour; hour <= endHour; hour++) {
        const slotStatus: DateStatus = 
          randomStatus === 'almost-full' && Math.random() > 0.7 
            ? 'full' 
            : randomStatus === 'almost-full' && Math.random() > 0.5
              ? 'almost-full'
              : 'available';
              
        timeSlots.push({
          time: `${hour}:00`,
          status: slotStatus
        });
        
        timeSlots.push({
          time: `${hour}:30`,
          status: slotStatus
        });
      }
    }
    
    mockData.push({
      date,
      status: randomStatus,
      timeSlots
    });
  }
  
  return mockData;
};

const BookingCalendar: React.FC = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [bookingData, setBookingData] = useState<BookingDate[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState<boolean>(false);
  
  // Initialize state after component mounts to avoid SSR issues
  useEffect(() => {
    setBookingData(generateMockData());
    setIsMounted(true);
  }, []);
  
  // Function to get all dates in current month view
  const getDatesInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<Date | null> = [];
    
    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  // Get dates for current view
  const datesInCurrentMonth = getDatesInMonth(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };
  
  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentDate(nextMonth);
  };
  
  // Find booking status for a date
  const getDateStatus = (date: Date): DateStatus => {
    if (!date) return 'full';
    
    const matchingDate = bookingData.find(
      booking => booking.date.toDateString() === date.toDateString()
    );
    
    return matchingDate ? matchingDate.status : 'full';
  };
  
  // Handle date selection
  const handleDateClick = (date: Date) => {
    const status = getDateStatus(date);
    if (status === 'full') return;
    
    setSelectedDate(date);
    setShowTimeSlotDialog(true);
  };
  
  // Get time slots for selected date
  const getTimeSlotsForDate = (date: Date): TimeSlot[] => {
    if (!date) return [];
    
    const matchingDate = bookingData.find(
      booking => booking.date.toDateString() === date.toDateString()
    );
    
    return matchingDate ? matchingDate.timeSlots : [];
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (timeSlot.status === 'full') return;
    setSelectedTimeSlot(timeSlot);
  };
  
  // Handle booking confirmation
  const handleBookNow = () => {
    if (!selectedDate || !selectedTimeSlot) return;
    
    // In a real app, you would make an API call here to book the appointment
    alert(`Booking confirmed for ${selectedDate.toDateString()} at ${selectedTimeSlot.time}`);
    
    // Reset state
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setShowTimeSlotDialog(false);
    
    // Safe navigation using window.location if needed
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        // For Next.js App Router
        router.push('/booking-confirmation');
        
        // Alternative for any issues:
        // window.location.href = '/booking-confirmation';
      }, 1000);
    }
  };
  
  // Get status color class
  const getStatusColorClass = (status: DateStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'almost-full':
        return 'bg-orange-500';
      case 'full':
      default:
        return 'bg-red-500';
    }
  };
  
  // Return early if not mounted yet (avoid hydration mismatch)
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-blue-900 font-semibold">Loading booking calendar...</p>
      </div>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-900 text-white p-6">
          <h1 className="text-2xl font-bold">Booking Calendar</h1>
          <p className="mt-2">Select an available date to book your appointment</p>
        </div>
        
        {/* Calendar Controls */}
        <div className="bg-blue-800 text-white p-4 flex justify-between items-center">
          <button 
            onClick={handlePreviousMonth}
            className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-600 transition-colors"
          >
            Previous Month
          </button>
          
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </h2>
          
          <button 
            onClick={handleNextMonth}
            className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-600 transition-colors"
          >
            Next Month
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-blue-900 p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {datesInCurrentMonth.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-16 rounded bg-gray-100" />;
              }
              
              const status = getDateStatus(date);
              const statusClass = getStatusColorClass(status);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={date.toDateString()}
                  onClick={() => handleDateClick(date)}
                  disabled={status === 'full'}
                  className={`
                    h-16 rounded relative
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'ring-2 ring-blue-900' : ''}
                    ${status === 'full' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                  `}
                >
                  <div className={`absolute inset-0 rounded ${statusClass} opacity-70`}></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-lg font-bold">{date.getDate()}</span>
                    <span className="text-xs">
                      {status === 'available' ? 'Available' : status === 'almost-full' ? 'Limited' : 'Full'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
              <span className="text-sm text-gray-700">Limited Availability</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-700">Fully Booked</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Slot Dialog */}
      {showTimeSlotDialog && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="bg-blue-900 -m-6 mb-6 p-6 rounded-t-lg text-white">
              <h2 className="text-xl font-bold">
                Select a Time Slot - {selectedDate.toLocaleDateString()}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {getTimeSlotsForDate(selectedDate).map((slot) => {
                const statusClass = getStatusColorClass(slot.status);
                const isSelected = selectedTimeSlot && selectedTimeSlot.time === slot.time;
                
                return (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSlotSelect(slot)}
                    disabled={slot.status === 'full'}
                    className={`
                      p-3 rounded relative border
                      ${isSelected ? 'ring-2 ring-blue-900' : ''}
                      ${slot.status === 'full' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                    `}
                  >
                    <div className={`absolute inset-0 rounded ${statusClass} opacity-70`}></div>
                    <div className="relative text-white font-semibold">
                      {slot.time}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTimeSlotDialog(false);
                  setSelectedTimeSlot(null);
                }}
                className="px-4 py-2 border border-blue-900 text-blue-900 rounded hover:bg-blue-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleBookNow}
                disabled={!selectedTimeSlot || selectedTimeSlot.status === 'full'}
                className={`
                  px-4 py-2 bg-blue-900 text-white rounded
                  ${!selectedTimeSlot || selectedTimeSlot.status === 'full' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-800'}
                `}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;