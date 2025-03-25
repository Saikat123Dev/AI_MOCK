// app/components/ScheduleEmail.tsx
'use client';

import { useState } from 'react';

export default function ScheduleEmail() {
  const [formData, setFormData] = useState({
    scheduledTime: '',
    recipient: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/cron/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Email scheduled for:', data.notificationTime);
        alert(`Email scheduled! Will be sent at: ${new Date(data.notificationTime).toLocaleString()}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to schedule email');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="datetime-local"
          name="scheduledTime"
          value={formData.scheduledTime}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
      </div>
      <div>
        <input
          type="email"
          name="recipient"
          value={formData.recipient}
          onChange={handleChange}
          placeholder="Recipient email"
          required
          className="border p-2 rounded w-full"
        />
      </div>
      <div>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Subject"
          required
          className="border p-2 rounded w-full"
        />
      </div>
      <div>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Message"
          required
          className="border p-2 rounded w-full"
        />
      </div>
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Schedule Email
      </button>
    </form>
  );
}
