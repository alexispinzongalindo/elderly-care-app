import { google } from 'googleapis';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

function openDatabase() {
  const db = new sqlite3.Database('./patient_care.db');
  
  db.getAsync = promisify(db.get.bind(db));
  db.allAsync = promisify(db.all.bind(db));
  db.runAsync = promisify(db.run.bind(db));
  
  return db;
}

async function syncToGoogleCalendar() {
  try {
    const calendar = await getGoogleCalendarClient();
    const db = openDatabase();
    
    console.log('🔄 Starting sync to Google Calendar...');
    
    const results = {
      medications: 0,
      appointments: 0,
      exercises: 0,
      errors: []
    };

    const medications = await db.allAsync(`
      SELECT ml.*, m.name, m.dosage 
      FROM medication_logs ml 
      JOIN medications m ON ml.medication_id = m.id 
      WHERE ml.status = 'taken'
      ORDER BY ml.taken_at DESC
      LIMIT 100
    `);
    
    for (const med of medications) {
      try {
        const takenDate = new Date(med.taken_at);
        const eventDateTime = takenDate.toISOString();
        
        const event = {
          summary: `💊 ${med.name}`,
          description: `Dosage: ${med.dosage}\nStatus: Taken\nScheduled Time: ${med.scheduled_time}`,
          start: {
            dateTime: eventDateTime,
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(takenDate.getTime() + 5 * 60000).toISOString(),
            timeZone: 'UTC'
          },
          colorId: '10'
        };

        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event
        });
        
        results.medications++;
      } catch (error) {
        results.errors.push(`Medication ${med.name}: ${error.message}`);
      }
    }

    const appointments = await db.allAsync(`
      SELECT * FROM appointments 
      ORDER BY date DESC, time DESC
      LIMIT 50
    `);
    
    for (const appt of appointments) {
      try {
        const apptDateTime = new Date(`${appt.date}T${appt.time}`);
        
        const event = {
          summary: `🏥 ${appt.doctor}`,
          description: `Facility: ${appt.facility || 'N/A'}\nPurpose: ${appt.purpose || 'N/A'}\nNotes: ${appt.notes || 'N/A'}\nStatus: ${appt.completed ? 'Completed' : 'Scheduled'}`,
          start: {
            dateTime: apptDateTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(apptDateTime.getTime() + 60 * 60000).toISOString(),
            timeZone: 'UTC'
          },
          colorId: '11'
        };

        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event
        });
        
        results.appointments++;
      } catch (error) {
        results.errors.push(`Appointment with ${appt.doctor}: ${error.message}`);
      }
    }

    const exercises = await db.allAsync(`
      SELECT el.*, e.name, e.description 
      FROM exercise_logs el 
      JOIN exercises e ON el.exercise_id = e.id 
      ORDER BY el.completed_at DESC
      LIMIT 100
    `);
    
    for (const ex of exercises) {
      try {
        const completedDate = new Date(ex.completed_at);
        const durationMinutes = ex.duration || 30;
        
        const event = {
          summary: `🏃 ${ex.name}`,
          description: `Description: ${ex.description || 'N/A'}\nDuration: ${durationMinutes} minutes\nNotes: ${ex.notes || 'N/A'}`,
          start: {
            dateTime: completedDate.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(completedDate.getTime() + durationMinutes * 60000).toISOString(),
            timeZone: 'UTC'
          },
          colorId: '2'
        };

        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event
        });
        
        results.exercises++;
      } catch (error) {
        results.errors.push(`Exercise ${ex.name}: ${error.message}`);
      }
    }

    db.close();
    
    console.log('✅ Sync completed!');
    console.log(`📊 Results: ${results.medications} medications, ${results.appointments} appointments, ${results.exercises} exercises`);
    
    if (results.errors.length > 0) {
      console.log('⚠️ Errors:', results.errors);
    }
    
    console.log(JSON.stringify(results));
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    console.log(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

syncToGoogleCalendar();
