const API_URL = '/api';

// Authentication state
let authToken = localStorage.getItem('authToken');
let currentStaff = JSON.parse(localStorage.getItem('currentStaff') || 'null');
let currentResidentId = localStorage.getItem('currentResidentId');

// Edit state tracking
let editingMedicationId = null;
let editingAppointmentId = null;
let editingVitalSignId = null;
let editingBillId = null;
let editingPaymentId = null;

// Set auth token for all API calls
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// Override fetch to include auth token
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    if (url.startsWith('/api/') && !url.includes('/auth/login')) {
        options.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
    }
    return originalFetch(url, options);
};

// Check authentication on page load
function checkAuth() {
    if (!authToken || !currentStaff) {
        showLoginModal();
    } else {
        hideLoginModal();
        if (!currentResidentId) {
            showResidentSelector();
        } else {
            hideResidentSelector();
            initApp();
        }
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('residentSelector').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
}

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showResidentSelector() {
    document.getElementById('residentSelector').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    loadResidentsForSelector();
}

function hideResidentSelector() {
    document.getElementById('residentSelector').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentStaff = data.staff;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentStaff', JSON.stringify(currentStaff));
            
            document.getElementById('userName').textContent = currentStaff.full_name;
            document.getElementById('userInfo').style.display = 'flex';
            
            hideLoginModal();
            showResidentSelector();
            showMessage('Login successful! / ¡Inicio de sesión exitoso!', 'success');
        } else {
            showMessage(data.error || 'Login failed / Error de inicio de sesión', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error connecting to server / Error al conectar con el servidor', 'error');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    authToken = null;
    currentStaff = null;
    currentResidentId = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentStaff');
    localStorage.removeItem('currentResidentId');
    
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('currentResidentInfo').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    
    showLoginModal();
    showMessage('Logged out successfully / Sesión cerrada exitosamente', 'success');
}

async function loadResidentsForSelector() {
    try {
        const response = await fetch('/api/residents?active_only=true');
        const residents = await response.json();
        
        const select = document.getElementById('residentSelect');
        select.innerHTML = '<option value="">-- Select a resident --</option>';
        
        residents.forEach(resident => {
            const option = document.createElement('option');
            option.value = resident.id;
            option.textContent = `${resident.first_name} ${resident.last_name}${resident.room_number ? ' - Room ' + resident.room_number : ''}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading residents:', error);
        showMessage('Error loading residents / Error al cargar residentes', 'error');
    }
}

function selectResident() {
    const select = document.getElementById('residentSelect');
    const residentId = select.value;
    
    if (!residentId) {
        showMessage('Please select a resident / Por favor seleccione un residente', 'error');
        return;
    }
    
    currentResidentId = residentId;
    localStorage.setItem('currentResidentId', residentId);
    
    loadCurrentResidentInfo(residentId);
    
    hideResidentSelector();
    initApp();
    showMessage('Resident selected / Residente seleccionado', 'success');
}

async function loadCurrentResidentInfo(residentId) {
    try {
        const response = await fetch(`/api/residents/${residentId}`);
        const resident = await response.json();
        
        document.getElementById('currentResidentName').textContent = 
            `${resident.first_name} ${resident.last_name}${resident.room_number ? ' - Room ' + resident.room_number : ''}`;
        document.getElementById('currentResidentInfo').style.display = 'block';
    } catch (error) {
        console.error('Error loading resident info:', error);
    }
}

function showAddResidentForm() {
    const form = document.getElementById('addResidentForm');
    if (form) {
        form.style.display = 'block';
    }
}

function hideAddResidentForm() {
    const form = document.getElementById('addResidentForm');
    if (form) {
        form.style.display = 'none';
        document.getElementById('newResidentForm').reset();
    }
}

async function saveNewResident(event) {
    event.preventDefault();
    
    const resident = {
        first_name: document.getElementById('newFirstName').value,
        last_name: document.getElementById('newLastName').value,
        date_of_birth: getDateFromDropdowns('newBirthYear', 'newBirthMonth', 'newBirthDay'),
        gender: document.getElementById('newGender').value,
        room_number: document.getElementById('newRoomNumber').value,
        bed_number: document.getElementById('newBedNumber').value,
        emergency_contact_name: document.getElementById('newEmergencyContact').value,
        emergency_contact_phone: document.getElementById('newEmergencyPhone').value,
        emergency_contact_relation: document.getElementById('newEmergencyRelation').value,
        medical_conditions: document.getElementById('newMedicalConditions').value,
        allergies: document.getElementById('newAllergies').value,
        dietary_restrictions: document.getElementById('newDietaryRestrictions').value
    };
    
    try {
        const response = await fetch('/api/residents', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(resident)
        });
        
        if (response.ok) {
            showMessage('Resident added successfully! / ¡Residente agregado exitosamente!', 'success');
            hideAddResidentForm();
            loadResidentsForSelector();
            if (document.getElementById('residents').classList.contains('active')) {
                loadResidents();
            }
        } else {
            showMessage('Error adding resident / Error al agregar residente', 'error');
        }
    } catch (error) {
        console.error('Error saving resident:', error);
        showMessage('Error saving resident / Error al guardar residente', 'error');
    }
}

function initApp() {
    document.getElementById('mainApp').style.display = 'block';
    initNavigation();
    loadDashboard();
    updateClock();
    setInterval(updateClock, 1000);
    initializeCalendarControls();
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    const clockEl = document.getElementById('liveClock');
    if (clockEl) clockEl.textContent = timeString;
}

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            if (navMenu) navMenu.classList.remove('active');
        });
    });
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        
        if (pageName === 'dashboard') loadDashboard();
        else if (pageName === 'residents') loadResidents();
        else if (pageName === 'medications') loadMedications();
        else if (pageName === 'appointments') loadAppointments();
        else if (pageName === 'vitalsigns') {
            clearVitalSignsForm();
            loadVitalSigns();
        }
        else if (pageName === 'calendar') {
            loadCalendar();
        }
        else if (pageName === 'billing') {
            loadBilling();
            loadPayments();
            loadAccountBalance();
        }
    }
}

function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type} show`;
    
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// Dashboard
async function loadDashboard() {
    try {
        const url = currentResidentId 
            ? `${API_URL}/dashboard?resident_id=${currentResidentId}`
            : `${API_URL}/dashboard`;
        const response = await fetch(url);
        const data = await response.json();
        
        document.getElementById('medsTakenStat').textContent = 
            `${data.medications_taken_today}/${data.total_medications}`;
        document.getElementById('apptsToday').textContent = data.appointments_today;
        
        // Load total residents
        const residentsResponse = await fetch('/api/residents?active_only=true');
        const residents = await residentsResponse.json();
        document.getElementById('totalResidents').textContent = residents.length;
        
        // Show billing summary if available
        if (data.billing_summary) {
            const billingCard = document.getElementById('billingCard');
            const balance = data.billing_summary.balance;
            billingCard.style.display = 'block';
            document.getElementById('accountBalance').textContent = `$${balance.toFixed(2)}`;
            document.getElementById('accountBalance').style.color = balance >= 0 ? 'var(--success-green)' : 'var(--error-red)';
            document.getElementById('balanceLabel').textContent = balance >= 0 ? 'Balance / Saldo' : 'Overdue / Vencido';
        } else {
            document.getElementById('billingCard').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showMessage('Error loading dashboard / Error al cargar el panel', 'error');
    }
}

// Residents Management
async function loadResidents() {
    try {
        const response = await fetch('/api/residents?active_only=true');
        const residents = await response.json();
        
        const listContainer = document.getElementById('residentsList');
        listContainer.innerHTML = '';
        
        if (residents.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No residents added yet. / No hay residentes agregados aún.</p>';
            return;
        }
        
        residents.forEach(resident => {
            const card = document.createElement('div');
            card.className = 'item-card';
            
            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">${resident.first_name} ${resident.last_name}</div>
                        <div class="item-details">
                            ${resident.room_number ? `<p><strong>Room / Habitación:</strong> ${resident.room_number}</p>` : ''}
                            ${resident.bed_number ? `<p><strong>Bed / Cama:</strong> ${resident.bed_number}</p>` : ''}
                            ${resident.date_of_birth ? `<p><strong>Date of Birth / Fecha de Nacimiento:</strong> ${new Date(resident.date_of_birth).toLocaleDateString()}</p>` : ''}
                            ${resident.gender ? `<p><strong>Gender / Género:</strong> ${resident.gender}</p>` : ''}
                            ${resident.emergency_contact_name ? `<p><strong>Emergency Contact / Contacto de Emergencia:</strong> ${resident.emergency_contact_name} (${resident.emergency_contact_phone || ''})</p>` : ''}
                            ${resident.medical_conditions ? `<p><strong>Medical Conditions / Condiciones Médicas:</strong> ${resident.medical_conditions}</p>` : ''}
                            ${resident.allergies ? `<p><strong>Allergies / Alergias:</strong> ${resident.allergies}</p>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick='selectResidentById(${resident.id})'>Select / Seleccionar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteResident(${resident.id})">Delete / Eliminar</button>
                    </div>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading residents:', error);
        showMessage('Error loading residents / Error al cargar residentes', 'error');
    }
}

function selectResidentById(residentId) {
    currentResidentId = residentId;
    localStorage.setItem('currentResidentId', residentId);
    loadCurrentResidentInfo(residentId);
    showPage('dashboard');
    showMessage('Resident selected / Residente seleccionado', 'success');
}

async function deleteResident(id) {
    if (!confirm('Are you sure you want to delete this resident? / ¿Está seguro de que desea eliminar este residente?')) return;
    
    try {
        const response = await fetch(`/api/residents/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Resident deleted successfully / Residente eliminado exitosamente', 'success');
            loadResidents();
            loadResidentsForSelector();
        } else {
            showMessage('Error deleting resident / Error al eliminar residente', 'error');
        }
    } catch (error) {
        console.error('Error deleting resident:', error);
        showMessage('Error deleting resident / Error al eliminar residente', 'error');
    }
}

// Medications
function showMedicationForm() {
    document.getElementById('medicationForm').style.display = 'block';
    editingMedicationId = null;
    // Reset form
    document.getElementById('medForm').reset();
    // Reset date dropdowns
    document.getElementById('medStartYear').value = '';
    document.getElementById('medStartMonth').value = '';
    document.getElementById('medStartDay').value = '';
    document.getElementById('medStartTime').value = '';
    document.getElementById('medEndYear').value = '';
    document.getElementById('medEndMonth').value = '';
    document.getElementById('medEndDay').value = '';
    document.getElementById('medEndTime').value = '';
    // Update form title
    document.querySelector('#medicationForm h3').textContent = 'Add Medication / Agregar Medicamento';
}

async function editMedication(id) {
    try {
        const response = await fetch(`${API_URL}/medications/${id}`);
        const med = await response.json();
        
        editingMedicationId = id;
        document.getElementById('medicationForm').style.display = 'block';
        document.getElementById('medName').value = med.name;
        document.getElementById('medDosage').value = med.dosage;
        document.getElementById('medFrequency').value = med.frequency;
        
        const times = JSON.parse(med.time_slots);
        document.getElementById('medTimes').value = times.join(', ');
        
        if (med.start_date) {
            setDateTimeToDropdowns(med.start_date, 'medStartYear', 'medStartMonth', 'medStartDay', 'medStartTime');
        }
        if (med.end_date) {
            setDateTimeToDropdowns(med.end_date, 'medEndYear', 'medEndMonth', 'medEndDay', 'medEndTime');
        }
        
        // Update form title
        document.querySelector('#medicationForm h3').textContent = 'Edit Medication / Editar Medicamento';
        
        // Scroll to form
        document.getElementById('medicationForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading medication:', error);
        showMessage('Error loading medication / Error al cargar medicamento', 'error');
    }
}

function hideMedicationForm() {
    document.getElementById('medicationForm').style.display = 'none';
    document.getElementById('medForm').reset();
    editingMedicationId = null;
}

async function saveMedication(event) {
    event.preventDefault();
    
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    
    const name = document.getElementById('medName').value;
    const dosage = document.getElementById('medDosage').value;
    const frequency = document.getElementById('medFrequency').value;
    const timesStr = document.getElementById('medTimes').value;
    const time_slots = timesStr.split(',').map(t => t.trim());
    const start_date = getDateTimeFromDropdowns('medStartYear', 'medStartMonth', 'medStartDay', 'medStartTime') || null;
    const end_date = getDateTimeFromDropdowns('medEndYear', 'medEndMonth', 'medEndDay', 'medEndTime') || null;
    
    const medicationData = { 
        name,
        dosage,
        frequency,
        time_slots,
        start_date,
        end_date
    };
    
    try {
        let response;
        if (editingMedicationId) {
            // Update existing medication
            response = await fetch(`${API_URL}/medications/${editingMedicationId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(medicationData)
            });
        } else {
            // Create new medication
            medicationData.resident_id = currentResidentId;
            response = await fetch(`${API_URL}/medications`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(medicationData)
            });
        }
        
        if (response.ok) {
            showMessage(editingMedicationId 
                ? 'Medication updated successfully! / ¡Medicamento actualizado exitosamente!' 
                : 'Medication added successfully! / ¡Medicamento agregado exitosamente!', 'success');
            hideMedicationForm();
            loadMedications();
            loadDashboard();
        } else {
            showMessage('Error saving medication / Error al guardar medicamento', 'error');
        }
    } catch (error) {
        console.error('Error saving medication:', error);
        showMessage('Error saving medication / Error al guardar medicamento', 'error');
    }
}

async function loadMedications() {
    try {
        const url = currentResidentId 
            ? `${API_URL}/medications?resident_id=${currentResidentId}`
            : `${API_URL}/medications`;
        const response = await fetch(url);
        const medications = await response.json();
        
        const listContainer = document.getElementById('medicationList');
        listContainer.innerHTML = '';
        
        if (medications.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No medications added yet. / No hay medicamentos agregados aún.</p>';
            return;
        }
        
        for (const med of medications) {
            const times = JSON.parse(med.time_slots);
            const logsResponse = await fetch(`${API_URL}/medications/${med.id}/logs`);
            const logs = await logsResponse.json();
            
            const card = document.createElement('div');
            card.className = 'item-card';
            
            let timesHTML = times.map(time => {
                const logForTime = logs.find(log => log.scheduled_time === time && log.status === 'taken');
                const status = logForTime ? 'taken' : 'pending';
                
                return `
                    <div style="display: inline-block; margin-right: 1rem; margin-bottom: 0.5rem;">
                        <span>${time}</span>
                        <button class="btn btn-sm ${status === 'taken' ? 'btn-secondary' : 'btn-success'}" 
                                onclick="logMedication(${med.id}, '${time}')"
                                ${status === 'taken' ? 'disabled' : ''}>
                            ${status === 'taken' ? '✓ Taken / Tomado' : 'Mark Taken / Marcar Tomado'}
                        </button>
                    </div>
                `;
            }).join('');
            
            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">${med.name}</div>
                        <div class="item-details">
                            <p><strong>Dosage / Dosis:</strong> ${med.dosage}</p>
                            <p><strong>Frequency / Frecuencia:</strong> ${med.frequency}</p>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editMedication(${med.id})">Edit / Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMedication(${med.id})">Delete / Eliminar</button>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <strong>Scheduled Times / Horarios:</strong><br>
                    ${timesHTML}
                </div>
            `;
            
            listContainer.appendChild(card);
        }
    } catch (error) {
        console.error('Error loading medications:', error);
        showMessage('Error loading medications / Error al cargar medicamentos', 'error');
    }
}

async function logMedication(medId, scheduledTime) {
    try {
        const response = await fetch(`${API_URL}/medications/${medId}/log`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ scheduled_time: scheduledTime, status: 'taken' })
        });
        
        if (response.ok) {
            showMessage('Medication marked as taken! / ¡Medicamento marcado como tomado!', 'success');
            loadMedications();
            loadDashboard();
        } else {
            showMessage('Error logging medication / Error al registrar medicamento', 'error');
        }
    } catch (error) {
        console.error('Error logging medication:', error);
        showMessage('Error logging medication / Error al registrar medicamento', 'error');
    }
}

async function deleteMedication(id) {
    if (!confirm('Are you sure you want to delete this medication? / ¿Está seguro de que desea eliminar este medicamento?')) return;
    
    try {
        const response = await fetch(`${API_URL}/medications/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Medication deleted successfully! / ¡Medicamento eliminado exitosamente!', 'success');
            loadMedications();
            loadDashboard();
        } else {
            showMessage('Error deleting medication / Error al eliminar medicamento', 'error');
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        showMessage('Error deleting medication / Error al eliminar medicamento', 'error');
    }
}

// Appointments
function showAppointmentForm() {
    document.getElementById('appointmentForm').style.display = 'block';
    editingAppointmentId = null;
    // Reset form
    document.getElementById('apptForm').reset();
    // Reset date dropdowns
    const today = new Date();
    setDateToDropdowns(today.toISOString().split('T')[0], 'apptYear', 'apptMonth', 'apptDay');
    document.getElementById('apptTime').value = '';
    // Update form title
    document.querySelector('#appointmentForm h3').textContent = 'Add Appointment / Agregar Cita';
}

async function editAppointment(id) {
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`);
        const appt = await response.json();
        
        editingAppointmentId = id;
        document.getElementById('appointmentForm').style.display = 'block';
        setDateToDropdowns(appt.date, 'apptYear', 'apptMonth', 'apptDay');
        document.getElementById('apptTime').value = appt.time;
        document.getElementById('apptDoctor').value = appt.doctor_name;
        document.getElementById('apptFacility').value = appt.facility || '';
        document.getElementById('apptPurpose').value = appt.purpose || '';
        document.getElementById('apptNotes').value = appt.notes || '';
        
        // Update form title
        document.querySelector('#appointmentForm h3').textContent = 'Edit Appointment / Editar Cita';
        
        // Scroll to form
        document.getElementById('appointmentForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading appointment:', error);
        showMessage('Error loading appointment / Error al cargar cita', 'error');
    }
}

function hideAppointmentForm() {
    document.getElementById('appointmentForm').style.display = 'none';
    document.getElementById('apptForm').reset();
    editingAppointmentId = null;
}

async function saveAppointment(event) {
    event.preventDefault();
    
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    
    const appointment = {
        date: getDateFromDropdowns('apptYear', 'apptMonth', 'apptDay'),
        time: document.getElementById('apptTime').value,
        doctor_name: document.getElementById('apptDoctor').value,
        facility: document.getElementById('apptFacility').value,
        purpose: document.getElementById('apptPurpose').value,
        notes: document.getElementById('apptNotes').value
    };
    
    try {
        let response;
        if (editingAppointmentId) {
            // Update existing appointment
            response = await fetch(`${API_URL}/appointments/${editingAppointmentId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(appointment)
            });
        } else {
            // Create new appointment
            appointment.resident_id = currentResidentId;
            response = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(appointment)
            });
        }
        
        if (response.ok) {
            showMessage(editingAppointmentId 
                ? 'Appointment updated successfully! / ¡Cita actualizada exitosamente!' 
                : 'Appointment added successfully! / ¡Cita agregada exitosamente!', 'success');
            hideAppointmentForm();
            loadAppointments();
            loadDashboard();
        } else {
            showMessage('Error saving appointment / Error al guardar cita', 'error');
        }
    } catch (error) {
        console.error('Error saving appointment:', error);
        showMessage('Error saving appointment / Error al guardar cita', 'error');
    }
}

async function loadAppointments() {
    try {
        const url = currentResidentId 
            ? `${API_URL}/appointments?resident_id=${currentResidentId}`
            : `${API_URL}/appointments`;
        const response = await fetch(url);
        const appointments = await response.json();
        
        const listContainer = document.getElementById('appointmentList');
        listContainer.innerHTML = '';
        
        if (appointments.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No appointments scheduled. / No hay citas programadas.</p>';
            return;
        }
        
        appointments.forEach(appt => {
            const apptDate = new Date(appt.date + 'T' + appt.time);
            const isCompleted = appt.completed;
            const isPast = apptDate < new Date();
            
            let cardClass = 'item-card';
            if (isCompleted) cardClass += ' completed';
            else if (isPast) cardClass += ' missed';
            else cardClass += ' pending';
            
            const card = document.createElement('div');
            card.className = cardClass;
            
            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">${appt.doctor_name}</div>
                        <div class="item-details">
                            <p><strong>Date / Fecha:</strong> ${new Date(appt.date).toLocaleDateString()}</p>
                            <p><strong>Time / Hora:</strong> ${appt.time}</p>
                            ${appt.facility ? `<p><strong>Facility / Instalación:</strong> ${appt.facility}</p>` : ''}
                            ${appt.purpose ? `<p><strong>Purpose / Propósito:</strong> ${appt.purpose}</p>` : ''}
                            ${appt.notes ? `<p><strong>Notes / Notas:</strong> ${appt.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editAppointment(${appt.id})">Edit / Editar</button>
                        ${!isCompleted ? `<button class="btn btn-success btn-sm" onclick="markAppointmentComplete(${appt.id})">Complete / Completar</button>` : ''}
                        <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${appt.id})">Delete / Eliminar</button>
                    </div>
                </div>
                ${isCompleted ? '<span class="badge badge-success">Completed / Completado</span>' : ''}
            `;
            
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading appointments:', error);
        showMessage('Error loading appointments / Error al cargar citas', 'error');
    }
}

async function markAppointmentComplete(id) {
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ completed: 1 })
        });
        
        if (response.ok) {
            showMessage('Appointment marked as completed! / ¡Cita marcada como completada!', 'success');
            loadAppointments();
            loadDashboard();
        } else {
            showMessage('Error updating appointment / Error al actualizar cita', 'error');
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        showMessage('Error updating appointment / Error al actualizar cita', 'error');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment? / ¿Está seguro de que desea eliminar esta cita?')) return;
    
    try {
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Appointment deleted successfully! / ¡Cita eliminada exitosamente!', 'success');
            loadAppointments();
            loadDashboard();
        } else {
            showMessage('Error deleting appointment / Error al eliminar cita', 'error');
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        showMessage('Error deleting appointment / Error al eliminar cita', 'error');
    }
}

// Vital Signs
function showVitalSignsForm() {
    document.getElementById('vitalSignsForm').style.display = 'block';
    editingVitalSignId = null;
    clearVitalSignsForm();
    // Update form title
    const formTitle = document.querySelector('#vitalSignsForm h3');
    if (formTitle) formTitle.textContent = 'Record Vital Signs / Registrar Signos Vitales';
}

function clearVitalSignsForm() {
    document.getElementById('vitalSignsForm').reset();
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDateTimeToDropdowns(now.toISOString().slice(0, 16), 'vsYear', 'vsMonth', 'vsDay', 'vsTime');
    // Clear other fields
    document.getElementById('vsSystolic').value = '';
    document.getElementById('vsDiastolic').value = '';
    document.getElementById('vsGlucose').value = '';
    document.getElementById('vsWeight').value = '';
    document.getElementById('vsTemperature').value = '';
    document.getElementById('vsHeartRate').value = '';
    document.getElementById('vsNotes').value = '';
}

async function editVitalSign(id) {
    try {
        const response = await fetch(`${API_URL}/vital-signs/${id}`);
        const sign = await response.json();
        
        editingVitalSignId = id;
        document.getElementById('vitalSignsForm').style.display = 'block';
        
        setDateTimeToDropdowns(sign.recorded_at, 'vsYear', 'vsMonth', 'vsDay', 'vsTime');
        document.getElementById('vsSystolic').value = sign.systolic || '';
        document.getElementById('vsDiastolic').value = sign.diastolic || '';
        document.getElementById('vsGlucose').value = sign.glucose || '';
        document.getElementById('vsWeight').value = sign.weight || '';
        document.getElementById('vsTemperature').value = sign.temperature || '';
        document.getElementById('vsHeartRate').value = sign.heart_rate || '';
        document.getElementById('vsNotes').value = sign.notes || '';
        
        // Update form title
        const formTitle = document.querySelector('#vitalSignsForm h3');
        if (formTitle) formTitle.textContent = 'Edit Vital Signs / Editar Signos Vitales';
        
        // Scroll to form
        document.getElementById('vitalSignsForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading vital sign:', error);
        showMessage('Error loading vital sign / Error al cargar signo vital', 'error');
    }
}

async function saveVitalSign(event) {
    event.preventDefault();
    
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    
    const data = {
        resident_id: currentResidentId,
        recorded_at: getDateTimeFromDropdowns('vsYear', 'vsMonth', 'vsDay', 'vsTime'),
        systolic: document.getElementById('vsSystolic').value || null,
        diastolic: document.getElementById('vsDiastolic').value || null,
        glucose: document.getElementById('vsGlucose').value || null,
        weight: document.getElementById('vsWeight').value || null,
        temperature: document.getElementById('vsTemperature').value || null,
        heart_rate: document.getElementById('vsHeartRate').value || null,
        notes: document.getElementById('vsNotes').value
    };
    
    if (!data.systolic && !data.diastolic && !data.glucose && !data.weight && !data.temperature && !data.heart_rate) {
        showMessage('Please enter at least one vital sign measurement / Por favor ingrese al menos una medición de signo vital', 'error');
        return;
    }
    
    try {
        let response;
        if (editingVitalSignId) {
            // Update existing vital sign
            response = await fetch(`${API_URL}/vital-signs/${editingVitalSignId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        } else {
            // Create new vital sign
            response = await fetch(`${API_URL}/vital-signs`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
        }
        
        if (response.ok) {
            showMessage(editingVitalSignId 
                ? 'Vital signs updated successfully! / ¡Signos vitales actualizados exitosamente!' 
                : 'Vital signs recorded successfully! / ¡Signos vitales registrados exitosamente!', 'success');
            clearVitalSignsForm();
            loadVitalSigns();
            loadDashboard();
        } else {
            showMessage('Error saving vital signs / Error al guardar signos vitales', 'error');
        }
    } catch (error) {
        console.error('Error saving vital signs:', error);
        showMessage('Error saving vital signs / Error al guardar signos vitales', 'error');
    }
}

async function loadVitalSigns() {
    try {
        const url = currentResidentId 
            ? `${API_URL}/vital-signs?resident_id=${currentResidentId}`
            : `${API_URL}/vital-signs`;
        const response = await fetch(url);
        const signs = await response.json();
        
        displayVitalSignsList(signs);
    } catch (error) {
        console.error('Error loading vital signs:', error);
    }
}

function displayVitalSignsList(signs) {
    const container = document.getElementById('vitalSignsList');
    
    if (signs.length === 0) {
        container.innerHTML = '<p class="empty-state">No vital signs recorded yet. / No hay signos vitales registrados aún.</p>';
        return;
    }
    
    container.innerHTML = signs.map(sign => {
        const date = new Date(sign.recorded_at);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        
        let measurements = [];
        if (sign.systolic && sign.diastolic) {
            measurements.push(`<span>🩸 BP: ${sign.systolic}/${sign.diastolic} mmHg</span>`);
        }
        if (sign.glucose) {
            measurements.push(`<span>🩹 Glucose: ${sign.glucose} mg/dL</span>`);
        }
        if (sign.temperature) {
            measurements.push(`<span>🌡️ Temp: ${sign.temperature} °F</span>`);
        }
        if (sign.heart_rate) {
            measurements.push(`<span>❤️ HR: ${sign.heart_rate} bpm</span>`);
        }
        if (sign.weight) {
            measurements.push(`<span>⚖️ Weight: ${sign.weight} lbs</span>`);
        }
        
        return `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <strong>${dateStr}</strong> at ${timeStr}
                        ${sign.notes ? `<p style="color: var(--dark-gray); margin: 0.25rem 0 0 0; font-size: 0.9rem;">${sign.notes}</p>` : ''}
                        <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.95rem;">
                            ${measurements.join('')}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editVitalSign(${sign.id})">Edit / Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteVitalSign(${sign.id})">Delete / Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteVitalSign(id) {
    if (!confirm('Are you sure you want to delete this vital sign record? / ¿Está seguro de que desea eliminar este registro?')) return;
    
    try {
        const response = await fetch(`${API_URL}/vital-signs/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Vital sign deleted successfully / Signo vital eliminado exitosamente', 'success');
            loadVitalSigns();
        }
    } catch (error) {
        console.error('Error deleting vital sign:', error);
        showMessage('Error deleting vital sign / Error al eliminar signo vital', 'error');
    }
}

// Billing Functions
async function loadAccountBalance() {
    if (!currentResidentId) {
        document.getElementById('accountBalanceCard').style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/billing/balance/${currentResidentId}`);
        const balance = await response.json();
        
        document.getElementById('accountBalanceCard').style.display = 'block';
        document.getElementById('totalBilled').textContent = `$${balance.total_billed.toFixed(2)}`;
        document.getElementById('totalPaid').textContent = `$${balance.total_paid.toFixed(2)}`;
        document.getElementById('currentBalance').textContent = `$${balance.balance.toFixed(2)}`;
        document.getElementById('currentBalance').style.color = balance.balance >= 0 ? 'var(--success-green)' : 'var(--error-red)';
        document.getElementById('pendingAmount').textContent = `$${balance.pending_amount.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading account balance:', error);
    }
}

function showBillForm() {
    document.getElementById('billForm').style.display = 'block';
    editingBillId = null;
    document.getElementById('newBillForm').reset();
    const today = new Date().toISOString().split('T')[0];
    setDateToDropdowns(today, 'billYear', 'billMonth', 'billDay');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    setDateToDropdowns(dueDate.toISOString().split('T')[0], 'billDueYear', 'billDueMonth', 'billDueDay');
    // Update form title
    document.querySelector('#billForm h3').textContent = 'Add New Bill / Agregar Nueva Factura';
}

async function editBill(id) {
    try {
        const response = await fetch(`${API_URL}/billing/${id}`);
        const bill = await response.json();
        
        editingBillId = id;
        document.getElementById('billForm').style.display = 'block';
        
        setDateToDropdowns(bill.billing_date, 'billYear', 'billMonth', 'billDay');
        setDateToDropdowns(bill.due_date, 'billDueYear', 'billDueMonth', 'billDueDay');
        document.getElementById('billAmount').value = bill.amount;
        document.getElementById('billCategory').value = bill.category || '';
        document.getElementById('billDescription').value = bill.description || '';
        document.getElementById('billNotes').value = bill.notes || '';
        
        // Update form title
        document.querySelector('#billForm h3').textContent = 'Edit Bill / Editar Factura';
        
        // Scroll to form
        document.getElementById('billForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading bill:', error);
        showMessage('Error loading bill / Error al cargar factura', 'error');
    }
}

function hideBillForm() {
    document.getElementById('billForm').style.display = 'none';
    document.getElementById('newBillForm').reset();
    editingBillId = null;
}

async function saveBill(event) {
    event.preventDefault();
    
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    
    const bill = {
        resident_id: currentResidentId,
        billing_date: getDateFromDropdowns('billYear', 'billMonth', 'billDay'),
        due_date: getDateFromDropdowns('billDueYear', 'billDueMonth', 'billDueDay'),
        amount: parseFloat(document.getElementById('billAmount').value),
        description: document.getElementById('billDescription').value,
        category: document.getElementById('billCategory').value,
        status: 'pending',
        notes: document.getElementById('billNotes').value
    };
    
    try {
        let response;
        if (editingBillId) {
            // Update existing bill
            response = await fetch(`${API_URL}/billing/${editingBillId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(bill)
            });
        } else {
            // Create new bill
            response = await fetch(`${API_URL}/billing`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(bill)
            });
        }
        
        if (response.ok) {
            showMessage(editingBillId 
                ? 'Bill updated successfully! / ¡Factura actualizada exitosamente!' 
                : 'Bill created successfully! / ¡Factura creada exitosamente!', 'success');
            hideBillForm();
            loadBilling();
            loadAccountBalance();
            loadDashboard();
        } else {
            showMessage('Error saving bill / Error al guardar factura', 'error');
        }
    } catch (error) {
        console.error('Error saving bill:', error);
        showMessage('Error saving bill / Error al guardar factura', 'error');
    }
}

async function loadBilling() {
    try {
        const url = currentResidentId 
            ? `${API_URL}/billing?resident_id=${currentResidentId}`
            : `${API_URL}/billing`;
        const response = await fetch(url);
        const bills = await response.json();
        
        const listContainer = document.getElementById('billsList');
        listContainer.innerHTML = '';
        
        if (bills.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No bills created yet. / No hay facturas creadas aún.</p>';
            return;
        }
        
        bills.forEach(bill => {
            const billDate = new Date(bill.billing_date);
            const dueDate = new Date(bill.due_date);
            const isOverdue = dueDate < new Date() && bill.status === 'pending';
            
            let cardClass = 'item-card';
            if (bill.status === 'paid') cardClass += ' completed';
            else if (isOverdue) cardClass += ' missed';
            else cardClass += ' pending';
            
            const card = document.createElement('div');
            card.className = cardClass;
            
            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">$${parseFloat(bill.amount).toFixed(2)} - ${bill.category || 'Monthly Fee'}</div>
                        <div class="item-details">
                            <p><strong>Billing Date / Fecha:</strong> ${billDate.toLocaleDateString()}</p>
                            <p><strong>Due Date / Fecha de Vencimiento:</strong> ${dueDate.toLocaleDateString()} ${isOverdue ? '<span style="color: var(--error-red);">(Overdue / Vencido)</span>' : ''}</p>
                            ${bill.description ? `<p><strong>Description / Descripción:</strong> ${bill.description}</p>` : ''}
                            <p><strong>Status / Estado:</strong> <span class="badge ${bill.status === 'paid' ? 'badge-success' : bill.status === 'pending' ? 'badge-warning' : 'badge-danger'}">${bill.status === 'paid' ? 'Paid / Pagado' : bill.status === 'pending' ? 'Pending / Pendiente' : bill.status}</span></p>
                            ${bill.notes ? `<p><strong>Notes / Notas:</strong> ${bill.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editBill(${bill.id})">Edit / Editar</button>
                        ${bill.status === 'pending' ? `<button class="btn btn-success btn-sm" onclick="markBillPaid(${bill.id})">Mark Paid / Marcar Pagado</button>` : ''}
                        <button class="btn btn-danger btn-sm" onclick="deleteBill(${bill.id})">Delete / Eliminar</button>
                    </div>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
        
        // Update payment form bill dropdown
        updatePaymentBillDropdown(bills.filter(b => b.status === 'pending'));
    } catch (error) {
        console.error('Error loading bills:', error);
        showMessage('Error loading bills / Error al cargar facturas', 'error');
    }
}

function updatePaymentBillDropdown(bills) {
    const select = document.getElementById('paymentBillId');
    select.innerHTML = '<option value="">-- Select bill -- / Seleccionar factura</option>';
    bills.forEach(bill => {
        const option = document.createElement('option');
        option.value = bill.id;
        option.textContent = `$${parseFloat(bill.amount).toFixed(2)} - ${bill.category || 'Monthly Fee'} (Due: ${new Date(bill.due_date).toLocaleDateString()})`;
        select.appendChild(option);
    });
}

async function markBillPaid(id) {
    try {
        const response = await fetch(`${API_URL}/billing/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'paid' })
        });
        
        if (response.ok) {
            showMessage('Bill marked as paid! / ¡Factura marcada como pagada!', 'success');
            loadBilling();
            loadAccountBalance();
            loadDashboard();
        } else {
            showMessage('Error updating bill / Error al actualizar factura', 'error');
        }
    } catch (error) {
        console.error('Error updating bill:', error);
        showMessage('Error updating bill / Error al actualizar factura', 'error');
    }
}

async function deleteBill(id) {
    if (!confirm('Are you sure you want to delete this bill? / ¿Está seguro de que desea eliminar esta factura?')) return;
    
    try {
        const response = await fetch(`${API_URL}/billing/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Bill deleted successfully! / ¡Factura eliminada exitosamente!', 'success');
            loadBilling();
            loadAccountBalance();
            loadDashboard();
        } else {
            showMessage('Error deleting bill / Error al eliminar factura', 'error');
        }
    } catch (error) {
        console.error('Error deleting bill:', error);
        showMessage('Error deleting bill / Error al eliminar factura', 'error');
    }
}

function showPaymentForm() {
    document.getElementById('paymentForm').style.display = 'block';
    editingPaymentId = null;
    document.getElementById('newPaymentForm').reset();
    const today = new Date().toISOString().split('T')[0];
    setDateToDropdowns(today, 'paymentYear', 'paymentMonth', 'paymentDay');
    loadBilling(); // Load bills for dropdown
    // Update form title
    document.querySelector('#paymentForm h3').textContent = 'Record Payment / Registrar Pago';
}

async function editPayment(id) {
    try {
        const response = await fetch(`${API_URL}/payments/${id}`);
        const payment = await response.json();
        
        editingPaymentId = id;
        document.getElementById('paymentForm').style.display = 'block';
        
        setDateToDropdowns(payment.payment_date, 'paymentYear', 'paymentMonth', 'paymentDay');
        document.getElementById('paymentAmount').value = payment.amount;
        document.getElementById('paymentMethod').value = payment.payment_method || 'Cash';
        document.getElementById('paymentReference').value = payment.reference_number || '';
        document.getElementById('paymentNotes').value = payment.notes || '';
        
        // Load bills and set selected bill if linked
        await loadBilling();
        if (payment.billing_id) {
            document.getElementById('paymentBillId').value = payment.billing_id;
        }
        
        // Update form title
        document.querySelector('#paymentForm h3').textContent = 'Edit Payment / Editar Pago';
        
        // Scroll to form
        document.getElementById('paymentForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading payment:', error);
        showMessage('Error loading payment / Error al cargar pago', 'error');
    }
}

function hidePaymentForm() {
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('newPaymentForm').reset();
    editingPaymentId = null;
}

async function savePayment(event) {
    event.preventDefault();
    
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    
    const payment = {
        resident_id: currentResidentId,
        billing_id: document.getElementById('paymentBillId').value || null,
        payment_date: getDateFromDropdowns('paymentYear', 'paymentMonth', 'paymentDay'),
        amount: parseFloat(document.getElementById('paymentAmount').value),
        payment_method: document.getElementById('paymentMethod').value,
        reference_number: document.getElementById('paymentReference').value,
        notes: document.getElementById('paymentNotes').value
    };
    
    try {
        let response;
        if (editingPaymentId) {
            // Update existing payment
            response = await fetch(`${API_URL}/payments/${editingPaymentId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payment)
            });
        } else {
            // Create new payment
            response = await fetch(`${API_URL}/payments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payment)
            });
        }
        
        if (response.ok) {
            showMessage(editingPaymentId 
                ? 'Payment updated successfully! / ¡Pago actualizado exitosamente!' 
                : 'Payment recorded successfully! / ¡Pago registrado exitosamente!', 'success');
            hidePaymentForm();
            loadPayments();
            loadBilling();
            loadAccountBalance();
            loadDashboard();
        } else {
            showMessage('Error saving payment / Error al guardar pago', 'error');
        }
    } catch (error) {
        console.error('Error saving payment:', error);
        showMessage('Error saving payment / Error al guardar pago', 'error');
    }
}

async function loadPayments() {
    try {
        const url = currentResidentId 
            ? `${API_URL}/payments?resident_id=${currentResidentId}`
            : `${API_URL}/payments`;
        const response = await fetch(url);
        const payments = await response.json();
        
        const listContainer = document.getElementById('paymentsList');
        listContainer.innerHTML = '';
        
        if (payments.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No payments recorded yet. / No hay pagos registrados aún.</p>';
            return;
        }
        
        payments.forEach(payment => {
            const paymentDate = new Date(payment.payment_date);
            
            const card = document.createElement('div');
            card.className = 'item-card completed';
            
            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">$${parseFloat(payment.amount).toFixed(2)} - ${payment.payment_method || 'Cash'}</div>
                        <div class="item-details">
                            <p><strong>Payment Date / Fecha de Pago:</strong> ${paymentDate.toLocaleDateString()}</p>
                            <p><strong>Payment Method / Método de Pago:</strong> ${payment.payment_method || 'Cash'}</p>
                            ${payment.reference_number ? `<p><strong>Reference / Referencia:</strong> ${payment.reference_number}</p>` : ''}
                            ${payment.notes ? `<p><strong>Notes / Notas:</strong> ${payment.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editPayment(${payment.id})">Edit / Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePayment(${payment.id})">Delete / Eliminar</button>
                    </div>
                </div>
            `;
            
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        showMessage('Error loading payments / Error al cargar pagos', 'error');
    }
}

async function deletePayment(id) {
    if (!confirm('Are you sure you want to delete this payment? / ¿Está seguro de que desea eliminar este pago?')) return;
    
    try {
        const response = await fetch(`${API_URL}/payments/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Payment deleted successfully! / ¡Pago eliminado exitosamente!', 'success');
            loadPayments();
            loadAccountBalance();
            loadDashboard();
        } else {
            showMessage('Error deleting payment / Error al eliminar pago', 'error');
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        showMessage('Error deleting payment / Error al eliminar pago', 'error');
    }
}

// Calendar Functions
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let allCalendarActivities = [];

function initializeCalendarControls() {
    const yearSelect = document.getElementById('calendarYear');
    const monthSelect = document.getElementById('calendarMonth');
    
    // Populate year dropdown (current year ± 5 years)
    yearSelect.innerHTML = '';
    for (let year = currentCalendarYear - 5; year <= currentCalendarYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentCalendarYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // Set current month
    monthSelect.value = currentCalendarMonth;
    
    // Add event listeners
    yearSelect.addEventListener('change', () => {
        currentCalendarYear = parseInt(yearSelect.value);
        loadCalendar();
    });
    
    monthSelect.addEventListener('change', () => {
        currentCalendarMonth = parseInt(monthSelect.value);
        loadCalendar();
    });
    
    const searchInput = document.getElementById('calendarSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterCalendarActivities);
    }
}

function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    document.getElementById('calendarMonth').value = currentCalendarMonth;
    document.getElementById('calendarYear').value = currentCalendarYear;
    
    // Update year dropdown if needed
    const yearSelect = document.getElementById('calendarYear');
    if (!yearSelect.querySelector(`option[value="${currentCalendarYear}"]`)) {
        // Add new year option
        const option = document.createElement('option');
        option.value = currentCalendarYear;
        option.textContent = currentCalendarYear;
        option.selected = true;
        yearSelect.appendChild(option);
        yearSelect.value = currentCalendarYear;
    }
    
    loadCalendar();
}

function goToToday() {
    const today = new Date();
    currentCalendarYear = today.getFullYear();
    currentCalendarMonth = today.getMonth();
    
    document.getElementById('calendarYear').value = currentCalendarYear;
    document.getElementById('calendarMonth').value = currentCalendarMonth;
    
    loadCalendar();
}

async function loadCalendar() {
    if (!document.getElementById('calendar')) return;
    
    try {
        const year = currentCalendarYear.toString();
        const month = (currentCalendarMonth + 1).toString();
        
        let url = `${API_URL}/calendar?year=${year}&month=${month}`;
        if (currentResidentId) {
            url += `&resident_id=${currentResidentId}`;
        }
        
        const response = await fetch(url);
        allCalendarActivities = await response.json();
        
        displayCalendar();
        initializeCalendarControls();
    } catch (error) {
        console.error('Error loading calendar:', error);
        showMessage('Error loading calendar / Error al cargar calendario', 'error');
    }
}

function filterCalendarActivities() {
    const searchTerm = document.getElementById('calendarSearch').value.toLowerCase();
    displayCalendar(searchTerm);
}

function displayCalendar(searchTerm = '') {
    const container = document.getElementById('calendarDisplay');
    if (!container) return;
    
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    
    // Filter activities
    let activities = allCalendarActivities;
    if (searchTerm) {
        activities = allCalendarActivities.filter(activity => {
            const searchableText = [
                activity.name,
                activity.dosage,
                activity.facility,
                activity.purpose,
                activity.notes,
                activity.type
            ].filter(Boolean).join(' ').toLowerCase();
            return searchableText.includes(searchTerm);
        });
    }
    
    // Group activities by date
    const activitiesByDate = {};
    activities.forEach(activity => {
        const activityDate = new Date(activity.datetime);
        const dateKey = activityDate.toISOString().split('T')[0];
        if (!activitiesByDate[dateKey]) {
            activitiesByDate[dateKey] = [];
        }
        activitiesByDate[dateKey].push(activity);
    });
    
    // Create calendar
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    container.innerHTML = `
        <div class="form-card">
            <h3 style="text-align: center; margin-bottom: 1rem;">
                ${monthNames[month]} ${year} / ${monthNamesEs[month]} ${year}
            </h3>
            <div class="calendar-grid">
                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                    `<div class="calendar-weekday">${day}</div>`
                ).join('')}
                ${Array(firstDay).fill(0).map(() => '<div class="calendar-day empty"></div>').join('')}
                ${Array.from({length: daysInMonth}, (_, i) => {
                    const day = i + 1;
                    const date = new Date(year, month, day);
                    const dateKey = date.toISOString().split('T')[0];
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayActivities = activitiesByDate[dateKey] || [];
                    
                    return `
                        <div class="calendar-day ${isToday ? 'today' : ''}">
                            <div class="day-number">${day}</div>
                            ${dayActivities.length > 0 ? `
                                <div class="day-activities">
                                    ${dayActivities.slice(0, 3).map(activity => {
                                        let icon = '';
                                        let className = '';
                                        let title = '';
                                        
                                        if (activity.type === 'medication') {
                                            icon = '💊';
                                            className = activity.status === 'taken' ? 'completed' : 'pending';
                                            title = `${activity.name} - ${activity.scheduled_time}`;
                                        } else if (activity.type === 'appointment') {
                                            icon = '🏥';
                                            className = activity.completed ? 'completed' : 'pending';
                                            title = `Dr. ${activity.name} - ${activity.time}`;
                                        } else if (activity.type === 'vital_signs') {
                                            icon = '🩺';
                                            className = 'completed';
                                            title = 'Vital Signs';
                                        }
                                        
                                        return `<div class="activity-item ${className}" title="${title}">${icon} ${title.length > 15 ? title.substring(0, 15) + '...' : title}</div>`;
                                    }).join('')}
                                    ${dayActivities.length > 3 ? `<div class="activity-item">+${dayActivities.length - 3} more</div>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="form-card" style="margin-top: 2rem;">
            <h3>Activities List / Lista de Actividades</h3>
            <div id="calendarActivitiesList" class="item-list"></div>
        </div>
    `;
    
    // Display activities list
    displayCalendarActivitiesList(activities);
}

function displayCalendarActivitiesList(activities) {
    const container = document.getElementById('calendarActivitiesList');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No activities found for this month. / No se encontraron actividades para este mes.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const date = new Date(activity.datetime);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        
        let content = '';
        if (activity.type === 'medication') {
            content = `💊 ${activity.name} (${activity.dosage}) - ${activity.scheduled_time} - ${activity.status}`;
        } else if (activity.type === 'appointment') {
            content = `🏥 Dr. ${activity.name} - ${activity.time} - ${activity.completed ? 'Completed' : 'Scheduled'}`;
        } else if (activity.type === 'vital_signs') {
            content = `🩺 Vital Signs recorded`;
        }
        
        return `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <div class="item-title">${content}</div>
                        <div class="item-details">
                            <p><strong>Date / Fecha:</strong> ${dateStr} at ${timeStr}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Date Helper Functions
function populateYearDropdown(selectId, startYear = 1920, endYear = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentYear = new Date().getFullYear();
    const end = endYear || (currentYear + 10);
    
    select.innerHTML = '<option value="">Year / Año</option>';
    for (let year = end; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }
}

function populateDayDropdown(daySelectId, monthSelectId, yearSelectId) {
    const daySelect = document.getElementById(daySelectId);
    const monthSelect = document.getElementById(monthSelectId);
    const yearSelect = document.getElementById(yearSelectId);
    
    if (!daySelect || !monthSelect || !yearSelect) return;
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    if (!month || !year) {
        daySelect.innerHTML = '<option value="">Day / Día</option>';
        return;
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    daySelect.innerHTML = '<option value="">Day / Día</option>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const option = document.createElement('option');
        option.value = day.toString().padStart(2, '0');
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

function setupDateDropdowns() {
    // Populate all year dropdowns
    const yearSelects = [
        'medStartYear', 'medEndYear', 'apptYear', 'vsYear', 
        'billYear', 'billDueYear', 'paymentYear', 'newBirthYear'
    ];
    
    yearSelects.forEach(selectId => {
        populateYearDropdown(selectId);
    });
    
    // Setup day dropdown updates when month/year changes
    const dateGroups = [
        { day: 'medStartDay', month: 'medStartMonth', year: 'medStartYear' },
        { day: 'medEndDay', month: 'medEndMonth', year: 'medEndYear' },
        { day: 'apptDay', month: 'apptMonth', year: 'apptYear' },
        { day: 'vsDay', month: 'vsMonth', year: 'vsYear' },
        { day: 'billDay', month: 'billMonth', year: 'billYear' },
        { day: 'billDueDay', month: 'billDueMonth', year: 'billDueYear' },
        { day: 'paymentDay', month: 'paymentMonth', year: 'paymentYear' },
        { day: 'newBirthDay', month: 'newBirthMonth', year: 'newBirthYear' }
    ];
    
    dateGroups.forEach(group => {
        const monthSelect = document.getElementById(group.month);
        const yearSelect = document.getElementById(group.year);
        
        if (monthSelect) {
            monthSelect.addEventListener('change', () => populateDayDropdown(group.day, group.month, group.year));
        }
        if (yearSelect) {
            yearSelect.addEventListener('change', () => populateDayDropdown(group.day, group.month, group.year));
        }
    });
}

function getDateFromDropdowns(yearId, monthId, dayId) {
    const year = document.getElementById(yearId)?.value;
    const month = document.getElementById(monthId)?.value;
    const day = document.getElementById(dayId)?.value;
    
    if (!year || !month || !day) return null;
    
    return `${year}-${month}-${day}`;
}

function getDateTimeFromDropdowns(yearId, monthId, dayId, timeId) {
    const date = getDateFromDropdowns(yearId, monthId, dayId);
    const time = document.getElementById(timeId)?.value;
    
    if (!date) return null;
    if (!time) return date;
    
    return `${date}T${time}`;
}

function setDateToDropdowns(dateString, yearId, monthId, dayId) {
    if (!dateString) {
        // Clear dropdowns if no date
        const yearSelect = document.getElementById(yearId);
        const monthSelect = document.getElementById(monthId);
        const daySelect = document.getElementById(dayId);
        if (yearSelect) yearSelect.value = '';
        if (monthSelect) monthSelect.value = '';
        if (daySelect) daySelect.innerHTML = '<option value="">Day / Día</option>';
        return;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return;
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const yearSelect = document.getElementById(yearId);
    const monthSelect = document.getElementById(monthId);
    const daySelect = document.getElementById(dayId);
    
    if (yearSelect) {
        // Make sure year exists in dropdown
        if (!yearSelect.querySelector(`option[value="${year}"]`)) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
        yearSelect.value = year;
    }
    if (monthSelect) monthSelect.value = month;
    if (daySelect) {
        // Populate days first, then set value
        populateDayDropdown(dayId, monthId, yearId);
        setTimeout(() => {
            if (daySelect) daySelect.value = day;
        }, 50);
    }
}

function setDateTimeToDropdowns(dateTimeString, yearId, monthId, dayId, timeId) {
    if (!dateTimeString) return;
    
    const [datePart, timePart] = dateTimeString.split('T');
    setDateToDropdowns(datePart, yearId, monthId, dayId);
    
    if (timePart && timeId) {
        const timeInput = document.getElementById(timeId);
        if (timeInput) {
            const time = timePart.substring(0, 5); // Get HH:MM
            timeInput.value = time;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (authToken && currentStaff && currentResidentId) {
        initApp();
    }
    setupDateDropdowns();
});




