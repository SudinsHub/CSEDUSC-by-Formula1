import { Worker } from 'bullmq';
import { config } from '../config.js';
import { emailService } from '../services/emailService.js';
import pool from '../db.js';

export function startNotificationWorker() {
  const worker = new Worker(
    'notifications',
    async (job) => {
      console.log(`Processing notification job: ${job.name}`, job.data);

      try {
        switch (job.name) {
          case 'user.approved':
            await handleUserApproved(job.data);
            break;
          case 'user.rejected':
            await handleUserRejected(job.data);
            break;
          case 'election.announced':
            await handleElectionAnnounced(job.data);
            break;
          case 'event.registered':
            await handleEventRegistered(job.data);
            break;
          case 'volunteer.decided':
            await handleVolunteerDecided(job.data);
            break;
          case 'budget.decided':
            await handleBudgetDecided(job.data);
            break;
          default:
            console.warn(`Unknown notification job type: ${job.name}`);
        }
      } catch (error) {
        console.error(`Error processing notification job ${job.name}:`, error);
        throw error; // Re-throw to trigger retry
      }
    },
    {
      connection: {
        url: config.redisUrl,
      },
      concurrency: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Notification job ${job.id} failed:`, err);
  });

  console.log('NotificationWorker started');
  return worker;
}

async function handleUserApproved(payload) {
  const { userId, email, name } = payload;
  
  const subject = 'Welcome to CSEDU Students\' Club!';
  const body = emailService.renderTemplate('user.approved', { name });
  
  await emailService.send(email, subject, body);
}

async function handleUserRejected(payload) {
  const { userId, email, name, reason } = payload;
  
  const subject = 'Registration Update - CSEDU Students\' Club';
  const body = emailService.renderTemplate('user.rejected', { name, reason });
  
  await emailService.send(email, subject, body);
}

async function handleElectionAnnounced(payload) {
  const { electionId, title, startTime, endTime, eligibleRoles } = payload;
  
  // Fetch eligible voters from auth schema
  const rolesArray = eligibleRoles || ['student', 'ec_member', 'admin'];
  const placeholders = rolesArray.map((_, i) => `$${i + 1}`).join(',');
  
  const result = await pool.query(
    `SELECT email, name FROM auth.users 
     WHERE role = ANY($1) AND status = 'active'`,
    [rolesArray]
  );
  
  const subject = `New Election: ${title}`;
  
  for (const user of result.rows) {
    const body = emailService.renderTemplate('election.announced', {
      title,
      startTime,
      endTime,
    });
    
    await emailService.send(user.email, subject, body);
  }
}

async function handleEventRegistered(payload) {
  const { userId, email, eventId, eventTitle } = payload;
  
  // Fetch event details from content schema
  const result = await pool.query(
    `SELECT event_date, location FROM content.events WHERE event_id = $1`,
    [eventId]
  );
  
  if (result.rows.length === 0) {
    console.warn(`Event ${eventId} not found for notification`);
    return;
  }
  
  const event = result.rows[0];
  const subject = `Event Registration Confirmed: ${eventTitle}`;
  const body = emailService.renderTemplate('event.registered', {
    eventTitle,
    eventDate: event.event_date,
    location: event.location,
  });
  
  await emailService.send(email, subject, body);
}

async function handleVolunteerDecided(payload) {
  const { userId, email, eventId, eventTitle, status } = payload;
  
  const subject = `Volunteer Application ${status === 'approved' ? 'Approved' : 'Update'}`;
  const body = emailService.renderTemplate('volunteer.decided', {
    eventTitle,
    status,
  });
  
  await emailService.send(email, subject, body);
}

async function handleBudgetDecided(payload) {
  const { userId, email, budgetId, status, comment } = payload;
  
  // Fetch user email if not provided
  let recipientEmail = email;
  if (!recipientEmail) {
    const result = await pool.query(
      `SELECT email FROM auth.users WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length > 0) {
      recipientEmail = result.rows[0].email;
    }
  }
  
  if (!recipientEmail) {
    console.warn(`No email found for user ${userId}`);
    return;
  }
  
  const subject = `Budget Proposal ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  const body = emailService.renderTemplate('budget.decided', {
    budgetId,
    status,
    comment,
  });
  
  await emailService.send(recipientEmail, subject, body);
}
