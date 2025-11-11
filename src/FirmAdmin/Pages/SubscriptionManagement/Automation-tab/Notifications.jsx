import React, { useState } from 'react';

const Notifications = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(true);
    const [inAppNotifications, setInAppNotifications] = useState(true);
    
    const [reminderDays, setReminderDays] = useState({
        '30': false,
        '14': false,
        '7': true,
        '3': true,
        '1': true
    });
    
    const [quietHoursStart, setQuietHoursStart] = useState('10:00 PM');
    const [quietHoursEnd, setQuietHoursEnd] = useState('08:00 AM');
    const [timezone, setTimezone] = useState('Eastern Time Zone');

    const toggleReminderDay = (day) => {
        setReminderDays({
            ...reminderDays,
            [day]: !reminderDays[day]
        });
    };

    return (
        <div>
            <h6 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Notification Settings</h6>
            <p className="text-sm text-gray-600 font-[BasisGrotesquePro] mb-6">Configure how and when you receive notifications</p>

            <div className="space-y-6">
                {/* Notification Settings Section */}
                <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h6 className="text-base font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">Email Notifications</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Receive notifications via email</p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setEmailNotifications(!emailNotifications)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    emailNotifications ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h6 className="text-base font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">SMS Notifications</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Receive critical alerts via SMS</p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setSmsNotifications(!smsNotifications)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    smsNotifications ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        smsNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* In-App Notifications */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h6 className="text-base font-bold text-gray-900 mb-1 font-[BasisGrotesquePro]">In-App Notifications</h6>
                            <p className="text-sm text-gray-600 font-[BasisGrotesquePro]">Show notifications in the dashboard</p>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={() => setInAppNotifications(!inAppNotifications)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    inAppNotifications ? 'bg-[#F56D2D]' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        inAppNotifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* White Box Container for Reminder Schedule, Quiet Hours, and Timezone */}
                <div className="bg-white !rounded-lg !border border-[#E8F0FF] p-4 sm:p-6 space-y-6">
                    {/* Reminder Schedule Section */}
                    <div>
                        <h6 className="text-base font-bold text-gray-900 mb-3 font-[BasisGrotesquePro]">Reminder Schedule</h6>
                        <div className="flex flex-wrap items-center gap-60">
                            {['30', '14', '7', '3', '1'].map((day) => (
                                <div key={day} className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleReminderDay(day)}
                                        className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            reminderDays[day]
                                                ? 'bg-[#3AD6F2] border-2 border-[#3AD6F2] !rounded-[6px]'
                                                : 'bg-white border-2 border-[#3AD6F2] !rounded-[6px]'
                                        }`}
                                    >
                                        {reminderDays[day] && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                    <label onClick={() => toggleReminderDay(day)} className="text-sm text-gray-700 font-[BasisGrotesquePro] cursor-pointer whitespace-nowrap">
                                        {day} {day === '1' ? 'Day' : 'Days'}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quiet Hours Section */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Quiet Hours Start */}
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Quiet Hours Start</label>
                                <select
                                    className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                                    value={quietHoursStart}
                                    onChange={(e) => setQuietHoursStart(e.target.value)}
                                >
                                    <option value="08:00 AM">08:00 AM</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="01:00 PM">01:00 PM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="03:00 PM">03:00 PM</option>
                                    <option value="04:00 PM">04:00 PM</option>
                                    <option value="05:00 PM">05:00 PM</option>
                                    <option value="06:00 PM">06:00 PM</option>
                                    <option value="07:00 PM">07:00 PM</option>
                                    <option value="08:00 PM">08:00 PM</option>
                                    <option value="09:00 PM">09:00 PM</option>
                                    <option value="10:00 PM">10:00 PM</option>
                                    <option value="11:00 PM">11:00 PM</option>
                                    <option value="12:00 AM">12:00 AM</option>
                                </select>
                            </div>

                            {/* Quiet Hours End */}
                            <div>
                                <label className="block text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Quiet Hours End</label>
                                <select
                                    className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                                    value={quietHoursEnd}
                                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                                >
                                    <option value="06:00 AM">06:00 AM</option>
                                    <option value="07:00 AM">07:00 AM</option>
                                    <option value="08:00 AM">08:00 AM</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="01:00 PM">01:00 PM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="03:00 PM">03:00 PM</option>
                                    <option value="04:00 PM">04:00 PM</option>
                                    <option value="05:00 PM">05:00 PM</option>
                                    <option value="06:00 PM">06:00 PM</option>
                                    <option value="07:00 PM">07:00 PM</option>
                                    <option value="08:00 PM">08:00 PM</option>
                                    <option value="09:00 PM">09:00 PM</option>
                                    <option value="10:00 PM">10:00 PM</option>
                                    <option value="11:00 PM">11:00 PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Timezone Section */}
                    <div>
                        <label className="block text-base font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Timezone</label>
                        <select
                            className="px-3 py-2 bg-white !border border-gray-300 !rounded-lg text-sm text-gray-700 font-[BasisGrotesquePro] w-full"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        >
                            <option value="Eastern Time Zone">Eastern Time Zone</option>
                            <option value="Central Time Zone">Central Time Zone</option>
                            <option value="Mountain Time Zone">Mountain Time Zone</option>
                            <option value="Pacific Time Zone">Pacific Time Zone</option>
                            <option value="Alaska Time Zone">Alaska Time Zone</option>
                            <option value="Hawaii Time Zone">Hawaii Time Zone</option>
                        </select>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-start">
                    <button className="px-6 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#EA580C] transition-colors font-[BasisGrotesquePro] text-sm font-medium">
                        Save Notification Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
