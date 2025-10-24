import React, { useState } from "react";
import { AddTask, AwaitingIcon, CompletedIcon, Contacted, DoubleuserIcon, DoubleUserIcon, FaildIcon, Task1, ZoomIcon } from "../../component/icons";
import CreateEventModal from "./CreateEventModal";

export default function CalendarPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("Monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Schedule a free Phone consultation",
      date: new Date(2025, 6, 22), // July 22, 2025
      time: "06:00 - 08:00",
      type: "consultation",
      confirmed: true
    }
  ]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getTodayEvents = () => {
    const today = new Date();
    return events.filter(event => 
      event.date.toDateString() === today.toDateString()
    );
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => event.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const cardData = [
    { label: "Total Events", icon: <Task1 />, count: events.length, color: "#00bcd4" },
    { label: "Today", icon: <CompletedIcon />, count: getTodayEvents().length, color: "#4caf50" },
    { label: "This Week", icon: <DoubleuserIcon />, count: events.filter(e => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return e.date >= weekStart && e.date <= weekEnd;
    }).length, color: "#3f51b5" },
    { label: "Confirmed", icon: <ZoomIcon />, count: events.filter(e => e.confirmed).length, color: "#EF4444" },
  ];

  const timePeriods = ["Day", "Week", "Monthly", "Years"];

  // Modal handlers
  const handleOpenCreateEventModal = () => {
    setIsCreateEventModalOpen(true);
  };

  const handleCloseCreateEventModal = () => {
    setIsCreateEventModalOpen(false);
  };

  const handleCreateEvent = (eventData) => {
    // Create new event from modal data
    const newEvent = {
      id: events.length + 1,
      title: eventData.eventTitle,
      date: new Date(eventData.selectedDate.split('/').reverse().join('-')), // Convert DD/MM/YYYY to Date
      time: `${eventData.timeSlots[0]?.startTime || '09:00 am'} - ${eventData.timeSlots[0]?.endTime || '09:30 am'}`,
      type: eventData.eventType,
      confirmed: false
    };
    
    setEvents(prev => [...prev, newEvent]);
    setIsCreateEventModalOpen(false);
  };

  return (
    <div className="p-6 min-h-screen bg-[#F3F7FF]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Calendar</h3>
          <p className="text-gray-600">Manage your appointments and schedule</p>
        </div>
        <button 
          onClick={handleOpenCreateEventModal}
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
          // style={{ borderRadius: '10px' }}
        >
           <AddTask />Create New Event
        </button>
        {/* <button 
          onClick={() => setShowAddTaskModal(true)}
          className="btn dashboard-btn btn-upload d-flex align-items-center gap-2"
        >
          <AddTask />
          Create New Task
        </button> */}
      </div>

      {/* Stats - First 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cardData.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border-[#E8F0FF] p-4">
            <div className="flex justify-between items-center">
              <div style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {timePeriods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedPeriod === period 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`} style={{ borderRadius: '7px' }}
          >
            {period}
          </button>
        ))}
      </div>
        

      <div className="flex gap-6 w-full ">
      {/* Calendar Navigation and Grid Container */}
      <div className="border border-[#E8F0FF]  rounded-lg pt-2 bg-[#F3F7FF] w-[75%]">
        {/* Calendar Navigation */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3 w-full justify-start pl-2">
            
            <h4 className="text-lg font-semibold text-gray-900 mb-0">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h4>
            
          </div>
           <div className="flex items-center gap-2 justify-end w-full pr-2">
           <button 
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors border-[#E8F0FF] bg-white"
              style={{ borderRadius: '10px' }}
              onClick={() => navigateMonth(-1)}
            >
              &lt;
            </button>
            <button 
              className="px-4 py-2  text-black  transition-colors text-sm border border-[#E8F0FF] bg-white"
              style={{ borderRadius: '7px' }}
              onClick={goToToday}
            >
              Today
            </button>
            <button 
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors bg-white"
              style={{ borderRadius: '10px' }}
              onClick={() => navigateMonth(1)}
            >
              &gt;
            </button>
          </div>
          <div></div>
        </div>

         {/* Calendar Grid */}
         <div className="flex gap-6">
           <div className="flex-1">
             <div className="bg-white rounded-lg  border border-gray-200 overflow-hidden">
               {/* Day Headers */}
               <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                 {dayNames.map(day => (
                   <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                     {day}
                   </div>
                 ))}
               </div>
               
               {/* Calendar Days */}
               <div className="grid grid-cols-7">
                 {calendarDays.map((day, index) => {
                   const dayEvents = getEventsForDate(day);
                   const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                   const isToday = day.toDateString() === new Date().toDateString();
                   const isSelected = day.toDateString() === selectedDate.toDateString();
                   
                   return (
                     <div
                       key={index}
                       className={`min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-[#F5F5F5] ${
                         !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                       } ${isToday ? 'bg-[#F5F5F5]' : ''} ${
                         isSelected ? 'bg-orange-50 border-orange-200' : ''
                       } ${
                         // Only add internal borders
                         index % 7 !== 6 ? 'border-r border-[#E8F0FF]' : '' // Right border except last column
                       } ${
                         index < 35 ? 'border-b border-[#E8F0FF]' : '' // Bottom border except last row
                       }`}
                       onClick={() => setSelectedDate(day)}
                     >
                       <div className={`text-sm font-medium mb-1 ${
                         isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                       }`}>
                         {day.getDate()}
                       </div>
                       {dayEvents.map(event => (
                         <div key={event.id} className="bg-orange-500 text-white p-1 rounded text-xs mb-1 shadow-sm">
                           <div className="flex items-center gap-1">
                             <div className="w-1 h-1 bg-white rounded-full"></div>
                             <span className="truncate">{event.title}</span>
                           </div>
                           <div className="text-xs opacity-90">{event.time}</div>
                         </div>
                       ))}
                     </div>
                   );
                 })}
               </div>
             </div>
           </div>
         </div>
       </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Today's Events */}
          <div className="bg-white rounded-lg  border border-[#E8F0FF] p-4">
            <h6 className="font-semibold text-gray-900 mb-2">Today's Events</h6>
            <p className="text-sm text-gray-500 mb-3">
              {new Date().toLocaleDateString()}
            </p>
            {getTodayEvents().length === 0 ? (
              <p className="text-gray-500 text-sm">No events scheduled for today</p>
            ) : (
              <div className="space-y-2">
                {getTodayEvents().map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg  border border-[#E8F0FF] p-4">
            <h6 className="font-semibold text-gray-900 mb-2">Upcoming Events</h6>
            <p className="text-sm text-gray-500 mb-3">Next 5 Scheduled Events</p>
            {getUpcomingEvents().length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {getUpcomingEvents().map(event => (
                  <div key={event.id} className="flex items-start gap-2 p-2 border-b border-gray-100 last:border-b-0">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                      <div className="text-xs text-gray-400">{event.date.toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={handleCloseCreateEventModal}
        onSubmit={handleCreateEvent}
      />
      </div>
  );
}
 
 