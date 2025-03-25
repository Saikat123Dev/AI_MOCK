// app/api/cron/send-email/route.ts
import { NextResponse } from 'next/server';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

interface ScheduledEvent {
  id: string;
  scheduledTime: Date;
  recipient: string;
  subject: string;
  message: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


const scheduledEvents: ScheduledEvent[] = [];

const getFiveMinutesBefore = (targetTime: Date): Date => {
  const timeBefore = new Date(targetTime);
  timeBefore.setMinutes(targetTime.getMinutes() - 5);
  return timeBefore;
};

const sendEmail = async (event: ScheduledEvent) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: event.recipient,
      subject: event.subject,
      text: event.message,
    });
    console.log(`Email sent to ${event.recipient}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const scheduleEmail = (event: ScheduledEvent) => {
  const notificationTime = getFiveMinutesBefore(event.scheduledTime);


  const task = cron.schedule('* * * * *', () => {
    const now = new Date();
    if (
      now.getHours() === notificationTime.getHours() &&
      now.getMinutes() === notificationTime.getMinutes()
    ) {
      sendEmail(event);
        task.stop();
    }
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scheduledTime, recipient, subject, message } = body;

    if (!scheduledTime || !recipient || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event: ScheduledEvent = {
      id: Math.random().toString(36).substring(2),
      scheduledTime: new Date(scheduledTime),
      recipient,
      subject,
      message,
    };

    scheduleEmail(event);
    scheduledEvents.push(event);

    const notificationTime = getFiveMinutesBefore(event.scheduledTime);

    return NextResponse.json({
      message: 'Email scheduled successfully',
      eventId: event.id,
      notificationTime: notificationTime.toISOString(),
      scheduledTime: event.scheduledTime.toISOString(),
    });
  } catch (error) {
    console.error('Error scheduling email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    scheduledEvents,
  });
}
