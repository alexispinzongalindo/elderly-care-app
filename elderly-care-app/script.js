// FORCE IMMEDIATE CONSOLE LOG - IF YOU SEE THIS, SCRIPT IS LOADING
console.log('%c🚀🚀🚀 SCRIPT.JS LOADED - Version 7.0 - Network Request Logging Enabled! 🚀🚀🚀', 'background: #00ff00; color: #000; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('Timestamp:', new Date().toISOString());
console.log('%c📡 TIP: Open Network tab (not Console) to see HTTP requests!', 'background: #2196F3; color: #fff; font-size: 14px; padding: 5px;');

const API_URL = '/api';

function safeStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        try {
            return sessionStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }
}

function getTrainingJournalReportPayload() {
    const sinceEl = document.getElementById('trainingReportSince');
    const untilEl = document.getElementById('trainingReportUntil');
    const since = sinceEl?.value ? new Date(sinceEl.value).toISOString() : null;
    const until = untilEl?.value ? new Date(untilEl.value).toISOString() : null;
    return { since, until };
}

async function loadTrainingPage() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        await loadTrainingResidents();
    } catch (error) {
        console.error('Error loading training page:', error);
        showMessage(`Error loading training: ${error.message}`, 'error');
    }
}

async function loadTrainingResidents() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        const select = document.getElementById('trainingResidentSelect');
        if (!select) return;

        const res = await fetch('/api/training/residents', { headers: getAuthHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load training residents: ${res.status}`);
        const residents = await res.json();

        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Select Training Resident --';
        select.appendChild(placeholder);

        (residents || []).forEach(r => {
            const opt = document.createElement('option');
            opt.value = String(r.id);
            opt.textContent = r.display_name || `${r.first_name || ''} ${r.last_name || ''}`.trim();
            select.appendChild(opt);
        });
    } catch (error) {
        console.error('Error loading training residents:', error);
        showMessage(`Error loading training residents: ${error.message}`, 'error');
    }
}

async function createTrainingDemoData() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        const countEl = document.getElementById('trainingDemoCount');
        const count = countEl ? Number(countEl.value) : 3;

        const response = await fetch('/api/training/demo-data', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ count })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Failed to create demo data (${response.status})`);
        }
        showMessage('Training demo data created / Datos de entrenamiento creados', 'success');
        await loadTrainingResidents();
        loadResidentsForSelector();
    } catch (error) {
        console.error('Error creating training demo data:', error);
        showMessage(`Error creating training demo data: ${error.message}`, 'error');
    }
}

async function clearTrainingDemoData() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }

        const ok = confirm('Delete ALL training demo residents and practice data? This cannot be undone.');
        if (!ok) return;

        const response = await fetch('/api/training/clear-data', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || `Failed to delete training data (${response.status})`);
        }

        showMessage(payload.message || 'Training data deleted', 'success');
        await loadTrainingResidents();
        loadResidentsForSelector();
    } catch (error) {
        console.error('Error deleting training demo data:', error);
        showMessage(`Error deleting training demo data: ${error.message}`, 'error');
    }
}

async function downloadTrainingJournalPdf() {
    try {
        const payload = getTrainingJournalReportPayload();
        const res = await fetch('/api/training/reports/journal/pdf', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to generate practice PDF', 'error');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'practice_journal_report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('downloadTrainingJournalPdf error:', e);
        showMessage('Failed to download practice PDF', 'error');
    }
}

async function printTrainingJournalPdf() {
    try {
        const payload = getTrainingJournalReportPayload();

        const w = window.open('', '_blank');
        if (!w) {
            showMessage('Popup blocked. Please allow popups to print.', 'error');
            return;
        }

        const res = await fetch('/api/training/reports/journal/pdf', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to generate practice PDF', 'error');
            try { w.close(); } catch { /* ignore */ }
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const revoke = () => {
            try { URL.revokeObjectURL(url); } catch { /* ignore */ }
        };

        try {
            w.document.open();
            w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Print</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; }
      iframe { width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe id="pdfFrame" src="${url}"></iframe>
  </body>
</html>`);
            w.document.close();
        } catch {
            try { w.location.href = url; } catch { /* ignore */ }
        }

        const cleanup = () => {
            setTimeout(revoke, 1000);
        };

        const doPrint = () => {
            try {
                w.focus();
                w.print();
            } finally {
                setTimeout(cleanup, 1500);
            }
        };

        try {
            const frame = w.document.getElementById('pdfFrame');
            if (frame) {
                frame.addEventListener('load', () => setTimeout(doPrint, 150), { once: true });
            }
        } catch { /* ignore */ }

        setTimeout(() => {
            try { doPrint(); } catch { /* ignore */ }
        }, 1500);
    } catch (e) {
        console.error('printTrainingJournalPdf error:', e);
        showMessage('Failed to print practice PDF', 'error');
    }
}

async function loadDocumentsPage() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        if (currentStaff.role !== 'admin') {
            showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
            showPage('dashboard');
            return;
        }

        const residentSelect = document.getElementById('documentsResidentSelect');
        if (!residentSelect) return;

        const res = await fetch('/api/residents?active_only=true', { headers: getAuthHeaders(), cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load residents: ${res.status}`);
        const residents = await res.json();

        residentSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Select Resident --';
        residentSelect.appendChild(placeholder);

        (residents || []).forEach(r => {
            const opt = document.createElement('option');
            opt.value = String(r.id);
            opt.textContent = r.display_name || `${r.first_name || ''} ${r.last_name || ''}`.trim();
            residentSelect.appendChild(opt);
        });

        const defaultId = (currentResidentId ? String(currentResidentId) : '');
        if (defaultId && residentSelect.querySelector(`option[value="${defaultId}"]`)) {
            residentSelect.value = defaultId;
        } else if (residentSelect.options.length > 1) {
            residentSelect.selectedIndex = 1;
        }

        residentSelect.onchange = () => loadDocumentsList();
        await loadDocumentsList();
    } catch (error) {
        console.error('Error loading documents page:', error);
        showMessage(`Error loading documents: ${error.message}`, 'error');
    }
}

async function loadDocumentsList() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        if (currentStaff.role !== 'admin') return;

        const residentSelect = document.getElementById('documentsResidentSelect');
        const listContainer = document.getElementById('documentsList');
        if (!residentSelect || !listContainer) return;

        const residentId = (residentSelect.value || '').trim();
        if (!residentId) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 1rem;">Please select a resident.</p>';
            return;
        }

        const response = await fetch(`/api/documents?resident_id=${encodeURIComponent(residentId)}`, { headers: getAuthHeaders(), cache: 'no-store' });
        if (!response.ok) {
            const txt = await response.text();
            throw new Error(txt || `HTTP ${response.status}`);
        }
        const docs = await response.json();

        listContainer.innerHTML = '';
        if (!docs || docs.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 1rem;">No documents yet.</p>';
            return;
        }

        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'item-card';

            const header = document.createElement('div');
            header.className = 'item-header';

            const details = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'item-title';
            title.textContent = doc.title || doc.original_filename || 'Document';
            details.appendChild(title);

            const meta = document.createElement('div');
            meta.className = 'item-details';
            const cat = doc.category ? `Category: ${doc.category}` : '';
            const fn = doc.original_filename ? `File: ${doc.original_filename}` : '';
            meta.innerHTML = [cat, fn].filter(Boolean).map(x => `<p>${escapeHtml(x)}</p>`).join('');
            details.appendChild(meta);

            header.appendChild(details);

            const actions = document.createElement('div');
            actions.className = 'item-actions';

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary btn-sm';
            downloadBtn.textContent = 'Download';
            downloadBtn.onclick = () => window.open(`/api/documents/${doc.id}/download`, '_blank');
            actions.appendChild(downloadBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteDocument(doc.id);
            actions.appendChild(deleteBtn);

            header.appendChild(actions);
            card.appendChild(header);
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading documents list:', error);
        showMessage(`Error loading documents: ${error.message}`, 'error');
    }
}

async function uploadDocument(event) {
    event.preventDefault();
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        if (currentStaff.role !== 'admin') {
            showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
            return;
        }

        const residentId = (document.getElementById('documentsResidentSelect')?.value || '').trim();
        const title = (document.getElementById('documentTitle')?.value || '').trim();
        const category = (document.getElementById('documentCategory')?.value || '').trim();
        const fileInput = document.getElementById('documentFile');
        const file = fileInput?.files?.[0];

        if (!residentId) {
            showMessage('Please select a resident / Por favor seleccione un residente', 'error');
            return;
        }
        if (!file) {
            showMessage('Please choose a file / Por favor seleccione un archivo', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('resident_id', residentId);
        formData.append('title', title);
        formData.append('category', category);
        formData.append('file', file);

        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch('/api/documents', {
            method: 'POST',
            headers,
            body: formData,
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.error || errorData.message || `Upload failed (${response.status})`;
            throw new Error(msg);
        }

        showMessage('Document uploaded successfully / Documento subido exitosamente', 'success');
        if (fileInput) fileInput.value = '';
        const titleEl = document.getElementById('documentTitle');
        if (titleEl) titleEl.value = '';
        const catEl = document.getElementById('documentCategory');
        if (catEl) catEl.value = '';
        await loadDocumentsList();
    } catch (error) {
        console.error('Error uploading document:', error);
        showMessage(`Error uploading document: ${error.message}`, 'error');
    }
}

async function deleteDocument(documentId) {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        if (currentStaff.role !== 'admin') return;

        if (!confirm('Delete this document?')) return;

        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            cache: 'no-store'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.error || errorData.message || `Delete failed (${response.status})`;
            throw new Error(msg);
        }

        showMessage('Document deleted / Documento eliminado', 'success');
        await loadDocumentsList();
    } catch (error) {
        console.error('Error deleting document:', error);
        showMessage(`Error deleting document: ${error.message}`, 'error');
    }
}

async function loadArchivedResidents() {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }

        if (currentStaff.role !== 'admin') {
            showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
            showPage('dashboard');
            return;
        }

        const response = await fetch('/api/residents/archived', { headers: getAuthHeaders(), cache: 'no-store' });
        if (!response.ok) {
            if (response.status === 401) {
                safeStorageRemove('authToken');
                safeStorageRemove('currentStaff');
                safeStorageRemove('currentResidentId');
                authToken = null;
                currentStaff = null;
                currentResidentId = null;
                checkAuth();
                return;
            }
            const errorText = await response.text();
            throw new Error(`Archived residents API returned ${response.status}: ${errorText}`);
        }

        const residents = await response.json();
        const listContainer = document.getElementById('archivedResidentsList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (!residents || residents.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No archived residents. / No hay residentes archivados.</p>';
            return;
        }

        residents.forEach(resident => {
            const card = document.createElement('div');
            card.className = 'item-card';

            const residentName = `${resident.first_name || ''}\u00A0${resident.last_name || ''}`.trim() || 'Unnamed Resident / Residente Sin Nombre';

            const header = document.createElement('div');
            header.className = 'item-header';

            const detailsContainer = document.createElement('div');
            detailsContainer.style.flex = '1';

            const title = document.createElement('div');
            title.className = 'item-title';
            title.style.cssText = 'font-size: 1.3rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-color);';
            title.textContent = residentName;
            detailsContainer.appendChild(title);

            const details = document.createElement('div');
            details.className = 'item-details';
            if (resident.room_number) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Room / Habitación:</strong>&nbsp;${resident.room_number}`;
                details.appendChild(p);
            }
            if (resident.bed_number) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Bed / Cama:</strong>&nbsp;${resident.bed_number}`;
                details.appendChild(p);
            }
            if (resident.date_of_birth) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Date of Birth / Fecha de Nacimiento:</strong>&nbsp;${new Date(resident.date_of_birth).toLocaleDateString()}`;
                details.appendChild(p);
            }
            detailsContainer.appendChild(details);
            header.appendChild(detailsContainer);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'item-actions';

            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'btn btn-success btn-sm';
            restoreBtn.textContent = 'Restore';
            restoreBtn.onclick = () => restoreArchivedResident(resident.id, residentName);
            actionsDiv.appendChild(restoreBtn);

            card.appendChild(header);
            card.appendChild(actionsDiv);
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading archived residents:', error);
        showMessage(`Error loading archived residents: ${error.message}`, 'error');
    }
}

async function restoreArchivedResident(residentId, residentName) {
    try {
        if (!authToken || !currentStaff) {
            checkAuth();
            return;
        }
        if (currentStaff.role !== 'admin') {
            showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
            return;
        }

        const confirmText = `Restore resident ${residentName}?`;
        if (!confirm(confirmText)) return;

        const response = await fetch(`/api/residents/${residentId}/restore`, {
            method: 'POST',
            headers: getAuthHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        showMessage('Resident restored successfully / Residente restaurado exitosamente', 'success');
        loadArchivedResidents();
        loadResidentsForSelector();
        if (document.getElementById('residents')?.classList.contains('active')) {
            loadResidents();
        }
    } catch (error) {
        console.error('Error restoring resident:', error);
        showMessage(`Error restoring resident: ${error.message}`, 'error');
    }
}

function safeStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return;
    } catch (e) {
        try {
            sessionStorage.setItem(key, value);
        } catch (_) {
            // ignore
        }
    }
}

function safeStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        // ignore
    }
    try {
        sessionStorage.removeItem(key);
    } catch (_) {
        // ignore
    }
}

// Authentication state
let authToken = safeStorageGet('authToken');
let currentStaff = JSON.parse(safeStorageGet('currentStaff') || 'null');
let currentResidentId = safeStorageGet('currentResidentId');
let isTrainingMode = false;
let currentResidentIsTraining = false;

function isAdminStaff(staff) {
    if (!staff) return false;
    const raw = staff.role;
    if (!raw) return false;
    const role = String(raw).trim().toLowerCase();
    return role === 'admin' || role === 'administrator';
}

function normalizeAuthState() {
    // iOS/Safari can sometimes persist unexpected string values; treat them as logged-out.
    const badStrings = new Set(['undefined', 'null', 'NaN', '[object Object]']);
    if (badStrings.has(String(authToken))) authToken = null;
    if (badStrings.has(String(currentResidentId))) currentResidentId = null;

    if (currentStaff && (typeof currentStaff !== 'object' || !currentStaff.id)) {
        currentStaff = null;
    }

    if (!authToken || !currentStaff) {
        currentUser = null;
    }
}

function setTrainingModeIndicator(on) {
    isTrainingMode = !!on;
    const el = document.getElementById('trainingModeIndicator');
    if (!el) return;
    el.style.display = isTrainingMode ? 'inline-flex' : 'none';
}

// Edit state tracking
let editingMedicationId = null;
let editingAppointmentId = null;
let editingVitalSignId = null;
let editingBillId = null;
let editingPaymentId = null;

// Language system
let currentLanguage = 'en'; // Default to English
let appInitialized = false;
let currentUser = null;

let showPageInProgress = false;
let lastShowPageName = null;
let lastShowPageAt = 0;

let languageObserver = null;
let languageObserverTimer = null;
let isApplyingLanguageUpdate = false;

function installLanguageObserver() {
    if (languageObserver) return;
    if (!document.body) return;

    languageObserver = new MutationObserver(() => {
        if (isApplyingLanguageUpdate) return;
        if (languageObserverTimer) window.clearTimeout(languageObserverTimer);
        languageObserverTimer = window.setTimeout(() => {
            try {
                if (isApplyingLanguageUpdate) return;
                isApplyingLanguageUpdate = true;

                // Avoid observer feedback loops: disconnect while we mutate text/attributes
                try {
                    languageObserver.disconnect();
                } catch (e) {
                    // ignore
                }
                updateTranslations();
                replaceDualLanguageText();

                // Reconnect observer
                try {
                    languageObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        attributes: true
                    });
                } catch (e) {
                    console.error('Error re-installing language observer:', e);
                }
            } catch (e) {
                console.error('Error applying language updates:', e);
            } finally {
                isApplyingLanguageUpdate = false;
            }
        }, 80);
    });

    languageObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
    });
}

// Phone number formatting function - formats as (XXX) XXX-XXXX
function formatPhoneNumber(phone) {
    if (!phone) return phone;

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Remove leading 1 if present (US country code)
    const cleaned = digits.startsWith('1') && digits.length === 11 ? digits.substring(1) : digits;

    // Format as (XXX) XXX-XXXX if 10 digits
    if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
    }

    // Return original if can't format
    return phone;
}

// Translation dictionary
const translations = {
    en: {
        // App
        'app.browserTitle': 'Elder Care Management - Puerto Rico',
        'app.navTitle': 'Elder Care Tracker',

        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.residents': 'Residents',
        'nav.medications': 'Medications',
        'nav.appointments': 'Appointments',
        'nav.vitalSigns': 'Vital Signs',
        'nav.calendar': 'Calendar',
        'nav.billing': 'Billing',
        'nav.financial': 'Financial Management',
        'nav.incidents': 'Incidents',
        'nav.careNotes': 'Care Notes',
        'nav.notifications': 'Notifications',
        'nav.reports': 'Reports',
        'nav.staff': 'Staff',
        'nav.logout': 'Logout',
        'nav.history': 'History',
        'nav.training': 'Training',
        'nav.documents': 'Documents',
        'nav.archivedResidents': 'Archived Residents',
        'nav.settings': 'Settings',
        'nav.group.care': 'Care Management',
        'nav.group.records': 'Records & Reports',
        'nav.group.financial': 'Financial',
        'nav.group.system': 'System',

        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.medications': 'Medications',
        'dashboard.medicationsTaken': 'Taken Today',
        'dashboard.appointments': 'Appointments',
        'dashboard.appointmentsScheduled': 'Scheduled Today',
        'dashboard.residents': 'Residents',
        'dashboard.residentsActive': 'Active',
        'dashboard.vitalSigns': 'Vital Signs',
        'dashboard.vitalSignsRecorded': 'Recorded Today',
        'dashboard.accountBalance': 'Account Balance',
        'dashboard.balance': 'Balance',
        'dashboard.overdue': 'Overdue',
        'dashboard.quickAccess': 'Quick Access',

        'dashboard.kpi.medAdherence': 'Medication Adherence',
        'dashboard.kpi.takenToday': 'Taken today',
        'dashboard.kpi.medsDueNextHour': 'Medications Due (Next Hour)',
        'dashboard.kpi.needsAction': 'Needs action',
        'dashboard.kpi.medsScheduledToday': 'Medications Scheduled Today',
        'dashboard.kpi.activeMeds': 'Active meds',
        'dashboard.kpi.vitalsRecordedToday': 'Vital Signs Recorded Today',
        'dashboard.kpi.activeStaff': 'Active Staff',
        'dashboard.kpi.availableToday': 'Available today',
        'dashboard.kpi.incidents7d': 'Incidents (Last 7 Days)',
        'dashboard.kpi.safetyFollowups': 'Safety & follow-ups',
        'dashboard.kpi.careNotes24h': 'Care Notes (Last 24 Hours)',
        'dashboard.kpi.documentationActivity': 'Documentation activity',
        'dashboard.kpi.activeResidents': 'Active Residents',
        'dashboard.kpi.currentlyInCare': 'Currently in care',
        'dashboard.kpi.appointmentsToday': 'Appointments Today',
        'dashboard.kpi.scheduled': 'Scheduled',

        'dashboard.widget.needsAttention': 'Needs Attention',
        'dashboard.widget.upcomingAppointments': 'Upcoming Appointments',
        'dashboard.widget.medicationSchedule': 'Medication Schedule',
        'dashboard.widget.recentActivity': 'Recent Activity',
        'dashboard.widget.quickActions': 'Quick Actions',

        'dashboard.empty.allCaughtUp': 'All caught up',
        'dashboard.empty.noUpcomingAppointments': 'No upcoming appointments',
        'dashboard.empty.noMedicationsScheduled': 'No medications scheduled',
        'dashboard.empty.noRecentActivity': 'No recent activity',

        // Common
        'common.search': 'Search',
        'common.logout': 'Logout',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.add': 'Add',
        'common.close': 'Close',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.markAllRead': 'Mark All Read',
        'common.viewAll': 'View All',
        'common.refresh': 'Refresh',
        'common.applyRefresh': 'Apply / Refresh',
        'common.viewHistory': 'View History',
        'common.notes': 'Notes',
        'common.reset': 'Reset',
        'common.select': 'Select',
        'common.required': 'Required',
        'common.continue': 'Continue',
        'common.submit': 'Submit',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.clear': 'Clear',
        'common.darkMode': 'Dark Mode',
        'common.print': 'Print',
        'common.keyboardShortcuts': 'Keyboard Shortcuts',
        'common.selectStaff': 'Select Staff',
        'common.selectResidents': 'Select Residents',
        'common.selectBill': 'Select bill',
        'common.noItems': 'No items',
        'common.noResidents': 'No residents added yet.',
        'common.noMedications': 'No medications added yet.',
        'common.noAppointments': 'No appointments scheduled.',
        'common.noVitalSigns': 'No vital signs recorded yet.',
        'common.noBills': 'No bills created yet.',
        'common.noPayments': 'No payments recorded yet.',
        'common.noStaff': 'No staff members found.',
        'common.noCareNotes': 'No care notes found.',
        'common.noIncidents': 'No incidents found.',
        'common.noNotifications': 'No notifications',
        'common.loading': 'Loading...',
        'common.errorLoading': 'Error loading',
        'common.tapToTakePhoto': 'Tap to take photo',
        'common.cameraAutoOpen': 'Camera will open automatically',

        // Financial
        'financial.subtitle': 'Manage bank accounts, transactions, and reconciliation',
        'financial.tab.accounts': 'Bank Accounts',
        'financial.tab.transactions': 'Transactions',
        'financial.tab.reconciliation': 'Reconciliation',
        'financial.tab.receipts': 'Payment Receipts',
        'financial.accounts.title': 'Bank Accounts',
        'financial.accounts.add': '+ Add Bank Account',
        'financial.bankAccount': 'Bank Account *',
        'financial.accountType.checking': 'Checking',
        'financial.accountType.savings': 'Savings',
        'financial.accountType.other': 'Other',
        'financial.transactionType.deposit': 'Deposit',
        'financial.transactionType.withdrawal': 'Withdrawal',
        'financial.transactions.title': 'Transactions',
        'financial.transactions.add': '+ Add Transaction',
        'financial.transactions.filterByAccount': 'Filter by Account',
        'financial.transactions.allAccounts': 'All Accounts',
        'financial.transactions.showReconciled': 'Show Reconciled',
        'financial.transactions.reconciledFilter.all': 'All',
        'financial.transactions.reconciledFilter.reconciledOnly': 'Reconciled Only',
        'financial.transactions.reconciledFilter.unreconciledOnly': 'Unreconciled Only',
        'financial.reconciliation.title': 'Reconcile Account',
        'financial.reconciliation.statementDate': 'Statement Date *',
        'financial.reconciliation.statementBalance': 'Statement Balance ($) *',
        'financial.reconciliation.currentBalance': 'Current Balance',
        'financial.reconciliation.selectTransactions': 'Select Transactions to Reconcile',
        'financial.reconciliation.reconcile': 'Reconcile',
        'financial.receipts.title': 'Payment Receipts',
        'financial.receipts.searchLabel': 'Search by Receipt Number or Payment ID',
        'financial.receipts.searchPlaceholder': 'Receipt Number or Payment ID',

        // Reports
        'reports.generate': 'Generate Report',
        'reports.type': 'Report Type *',
        'reports.type.incidents': 'Incident Report',
        'reports.type.care_notes': 'Care Notes Summary',
        'reports.type.medications': 'Medication Report',
        'reports.type.appointments': 'Appointments Report',
        'reports.type.vital_signs': 'Vital Signs Report',
        'reports.type.comprehensive': 'Comprehensive Report',
        'reports.from': 'From Date',
        'reports.to': 'To Date',
        'reports.generatePreview': 'Generate Preview',
        'reports.exportCsv': 'Export CSV',
        'reports.printSaveAsPdf': 'Print (Save as PDF)',
        'reports.preview.title': 'Report Preview',
        'reports.stats.totalIncidents': 'Total Incidents',
        'reports.stats.careNotes': 'Care Notes',
        'reports.stats.medicationsDue': 'Medications Due',
        'reports.stats.appointments': 'Appointments',
        'reports.stats.thisMonth': 'This Month',
        'reports.stats.today': 'Today',
        'reports.stats.thisWeek': 'This Week',
        'reports.journal.fromDateTime': 'From Date & Time',
        'reports.journal.toDateTime': 'To Date & Time',
        'reports.journal.staff': 'Staff',
        'reports.journal.emailTo': 'Email PDF To',
        'reports.journal.emailPlaceholder': 'name@example.com',
        'reports.journal.downloadPdf': 'Download PDF',
        'reports.journal.emailPdf': 'Email PDF',

        // Incidents
        'incident.selectStaff': '-- Select Staff --',
        'incident.selectResidents': '-- Select Residents --',
        'incident.multiSelectHint': 'Hold Ctrl/Cmd to select multiple',
        'incident.photos.tapToUpload': 'Tap to Upload Photos',
        'incident.photos.multiHint': 'You can select multiple photos',
        'incident.witnesses.placeholder': 'Names of witnesses',
        'incident.actions.placeholder': 'What was done in response...',

        // Care Notes
        'carenote.shift.morning': 'Morning',
        'carenote.shift.afternoon': 'Afternoon',
        'carenote.shift.evening': 'Evening',
        'carenote.shift.night': 'Night',
        'carenote.appetite.poor': 'Poor',
        'carenote.appetite.fair': 'Fair',
        'carenote.appetite.good': 'Good',
        'carenote.appetite.excellent': 'Excellent',
        'carenote.pain.none': 'None',
        'carenote.pain.mild': 'Mild (1-3)',
        'carenote.pain.moderate': 'Moderate (4-6)',
        'carenote.pain.severe': 'Severe (7-10)',

        'carenote.section.nutrition': 'Nutrition & Hydration',
        'carenote.section.personalCare': 'Personal Care',
        'carenote.section.mobilityPain': 'Mobility & Pain',
        'carenote.section.sleep': 'Sleep',
        'carenote.section.moodBehavior': 'Mood & Behavior',
        'carenote.fluidIntake.placeholder': 'e.g., 6 glasses of water, 2 cups of juice',
        'carenote.meal.placeholder': 'What was eaten, how much...',
        'carenote.bathing.placeholder': 'Bathing details...',
        'carenote.hygiene.placeholder': 'Hygiene details...',
        'carenote.toileting.placeholder': 'Frequency, type, any issues...',
        'carenote.skinCondition.placeholder': 'Any redness, sores, wounds, pressure points...',
        'carenote.mobility.placeholder': 'How the resident moved, assistance needed, distance...',
        'carenote.painLocation.placeholder': 'Where the pain is located...',
        'carenote.sleepHours.placeholder': 'e.g., 7.5',
        'carenote.behaviorNotes.placeholder': 'Behavior observations...',
        'carenote.activities.placeholder': 'Activities participated in...',
        'carenote.generalNotes.placeholder': 'Any other observations or notes...',

        // History
        'history.title': 'History / Journal',
        'history.allResidents': 'All Residents',
        'history.selectResident': 'Select Resident',
        'history.yesterday': 'Yesterday',

        // Archived Residents
        'archivedResidents.title': 'Residentes Archivados',
        'archivedResidents.subtitle': 'Restaure residentes previamente eliminados (archivados).',

        // Settings
        'settings.title': 'Configuración',
        'settings.enabledAreas': 'Áreas habilitadas',

        // Documents
        'documents.title': 'Documents',
        'documents.resident': 'Resident',
        'documents.category': 'Category',
        'documents.category.insurance': 'Insurance',
        'documents.category.id': 'ID',
        'documents.category.poa': 'POA',
        'documents.category.medical': 'Medical',
        'documents.category.billing': 'Billing',
        'documents.category.other': 'Other',
        'documents.docTitle': 'Title',
        'documents.docTitle.placeholder': 'e.g., Insurance Card, POA',
        'documents.file': 'File (PDF or Photo)',
        'documents.upload': 'Upload',

        // Training
        'training.title': 'Training (Practice Mode)',
        'training.modeIndicator': 'TRAINING MODE',
        'training.demo.title': 'Create Demo Training Residents',
        'training.demo.count': 'How many demo residents?',
        'training.demo.create': 'Create Demo Data',
        'training.demo.clear': 'Delete All Training Data',
        'training.demo.hint': 'Training data is hidden from normal Residents/History/Reports.',
        'training.selector.title': 'Training Resident Selector',
        'training.selector.resident': 'Training Resident',
        'training.selector.hint': 'Staff should practice selecting a resident using the normal resident selector too.',
        'training.reports.title': 'Practice Reports (All Training Residents)',
        'training.reports.from': 'From (date/time)',
        'training.reports.to': 'To (date/time)',
        'training.reports.downloadPdf': 'Download Practice PDF',
        'training.reports.printPdf': 'Print Practice PDF',

        // Keyboard Shortcuts
        'shortcuts.focusSearch': 'Focus search',
        'shortcuts.closeModals': 'Close modals',
        'shortcuts.print': 'Print current page',
        'shortcuts.toggleDarkMode': 'Toggle dark mode',
        'shortcuts.goDashboard': 'Go to Dashboard',
        'shortcuts.goResidents': 'Go to Residents',
        'shortcuts.goMedications': 'Go to Medications',
        'shortcuts.goAppointments': 'Go to Appointments',
        'shortcuts.showHelp': 'Show this help',

        // Login
        'login.title': 'Elder Care Management',
        'login.subtitle': 'Login',
        'login.username': 'Username',
        'login.password': 'Password',
        'login.submit': 'Login',
        'login.placeholder.username': 'Enter username',
        'login.placeholder.password': 'Enter password',
        'login.hint': 'Default credentials: admin (password: admin123)',

        // Resident Selector
        'resident.select': 'Select Resident',
        'resident.choose': 'Choose Resident',
        'resident.selectOption': 'Select a resident',
        'resident.addNew': 'Add New Resident',
        'resident.noneSelected': 'No resident selected',
        'resident.change': 'Change Resident',

        // Resident Form
        'resident.title': 'Residents Management',
        'resident.add': 'Add New Resident',
        'resident.edit': 'Edit Resident',
        'resident.fullName': 'Full Name',
        'resident.firstName': 'First Name', // Deprecated - kept for backwards compatibility
        'resident.lastName': 'Last Name', // Deprecated - kept for backwards compatibility
        'resident.dateOfBirth': 'Date of Birth',
        'resident.gender': 'Gender',
        'resident.photo': 'Photo',
        'resident.roomNumber': 'Room Number',
        'resident.bedNumber': 'Bed Number',
        'resident.emergencyContact': 'Emergency Contact Name',
        'resident.emergencyPhone': 'Emergency Contact Phone',
        'resident.emergencyRelation': 'Relation',
        'resident.emergencyEmail': 'Emergency Contact Email',
        'resident.medicalConditions': 'Medical Conditions',
        'resident.allergies': 'Allergies',
        'resident.dietaryRestrictions': 'Dietary Restrictions',
        'resident.save': 'Save Resident',
        'resident.year': 'Year',
        'resident.month': 'Month',
        'resident.day': 'Day',
        'resident.gender.male': 'Male',
        'resident.gender.female': 'Female',
        'resident.gender.other': 'Other',
        'resident.relation.placeholder': 'e.g., Son, Daughter',
        'resident.uploadPhoto': 'Upload Photo',
        'resident.removePhoto': 'Remove Photo',

        // Months
        'month.january': 'January',
        'month.february': 'February',
        'month.march': 'March',
        'month.april': 'April',
        'month.may': 'May',
        'month.june': 'June',
        'month.july': 'July',
        'month.august': 'August',
        'month.september': 'September',
        'month.october': 'October',
        'month.november': 'November',
        'month.december': 'December',

        // Medications
        'medication.title': 'Medication Management',
        'medication.addNew': 'Add New Medication',
        'medication.add': 'Add Medication',
        'medication.edit': 'Edit Medication',
        'medication.name': 'Medication Name',
        'medication.dosage': 'Dosage',
        'medication.frequency': 'Frequency',
        'medication.startDate': 'Start Date',
        'medication.endDate': 'End Date',
        'medication.instructions': 'Instructions',
        'medication.save': 'Save Medication',
        'medication.frequency.onceDaily': 'Once daily',
        'medication.frequency.twiceDaily': 'Twice daily',
        'medication.frequency.threeTimesDaily': 'Three times daily',
        'medication.frequency.every4Hours': 'Every 4 hours',
        'medication.frequency.every6Hours': 'Every 6 hours',
        'medication.frequency.every8Hours': 'Every 8 hours',
        'medication.frequency.atIntervals': 'At intervals',
        'medication.frequency.asNeeded': 'As needed',
        'medication.noEndDate': 'No end date (Ongoing)',
        'medication.ongoing': 'Ongoing',
        'medication.scheduledTimes': 'Scheduled Times',
        'medication.markTaken': 'Mark Taken',
        'medication.taken': 'Taken',

        // Calendar
        'calendar.title': 'Activity Calendar',
        'calendar.previous': '← Previous',
        'calendar.next': 'Next →',
        'calendar.today': 'Today',
        'calendar.search': 'Search Activities',
        'calendar.searchPlaceholder': 'Search by name, doctor, medication...',

        // Appointments
        'appointment.title': 'Appointment Tracking',
        'appointment.add': 'Add Appointment',
        'appointment.edit': 'Edit Appointment',
        'appointment.addNew': 'Add New Appointment',
        'appointment.date': 'Date',
        'appointment.time': 'Time',
        'appointment.type': 'Type',
        'appointment.provider': 'Doctor/Provider',
        'appointment.facility': 'Facility',
        'appointment.purpose': 'Purpose',
        'appointment.location': 'Location',
        'appointment.notes': 'Notes',
        'appointment.save': 'Save Appointment',

        // Billing
        'billing.title': 'Billing & Payments',
        'billing.add': 'Add New Bill',
        'billing.edit': 'Edit Bill',
        'billing.create': 'Create Bill',
        'billing.accountBalance': 'Account Balance',
        'billing.totalBilled': 'Total Billed',
        'billing.totalPaid': 'Total Paid',
        'billing.balance': 'Balance',
        'billing.pending': 'Pending',
        'billing.date': 'Billing Date',
        'billing.amount': 'Amount',
        'billing.description': 'Description',
        'billing.dueDate': 'Due Date',
        'billing.status': 'Status',
        'billing.save': 'Save Bill',
        'billing.status.pending': 'Pending',
        'billing.status.paid': 'Paid',
        'billing.status.overdue': 'Overdue',
        'payment.add': 'Record Payment',
        'payment.edit': 'Edit Payment',

        // Vital Signs
        'vitals.title': 'Vital Signs Tracker',
        'vitals.add': 'Record Vital Signs',
        'vitals.edit': 'Edit Vital Signs',
        'vitals.history': 'Vital Signs History',
        'vitals.dateTime': 'Date & Time',
        'vitals.date': 'Date',
        'vitals.time': 'Time',
        'vitals.bloodPressure': 'Blood Pressure',
        'vitals.heartRate': 'Heart Rate',
        'vitals.temperature': 'Temperature',
        'vitals.oxygenSaturation': 'Oxygen Saturation',
        'vitals.weight': 'Weight',
        'vitals.notes': 'Notes',
        'vitals.save': 'Save Vital Signs',

        'vitals.systolic': 'Systolic (mmHg)',
        'vitals.diastolic': 'Diastolic (mmHg)',
        'vitals.glucose': 'Glucose Level (mg/dL)',
        'vitals.notesPlaceholder': 'Any observations...',

        'vitals.section.bloodPressure': 'Blood Pressure',
        'vitals.section.bloodGlucose': 'Blood Glucose',
        'vitals.section.temperature': 'Temperature',
        'vitals.section.heartRate': 'Heart Rate',
        'vitals.section.weight': 'Weight',

        // Care Notes
        'carenote.title': 'Care Notes',
        'carenote.add': 'Add Care Note',
        'carenote.edit': 'Edit Care Note',
        'carenote.date': 'Date',
        'carenote.time': 'Time',
        'carenote.category': 'Category',
        'carenote.note': 'Note',
        'carenote.save': 'Save Care Note',

        // Incidents
        'incident.title': 'Incident Reports',
        'incident.add': 'Report Incident',
        'incident.edit': 'Edit Incident',
        'incident.editReport': 'Edit Incident Report',
        'incident.date': 'Date',
        'incident.time': 'Time',
        'incident.type': 'Type',
        'incident.description': 'Description',
        'incident.severity': 'Severity',
        'incident.actionTaken': 'Action Taken',
        'incident.save': 'Save Incident',

        // Staff
        'staff.title': 'Staff Management',
        'staff.add': 'Add New Staff Member',
        'staff.edit': 'Edit Staff Member',
        'staff.username': 'Username',
        'staff.fullName': 'Full Name',
        'staff.role': 'Role',
        'staff.email': 'Email',
        'staff.phone': 'Phone',
        'staff.password': 'Password',
        'staff.password.placeholder': 'Enter new password',
        'staff.save': 'Save Staff',
        'staff.passwordHint.new': '(Required for new staff)',
        'staff.passwordHint.edit': '(Leave blank to keep current)',
        'staff.active': 'Active',
        'staff.role.caregiver': 'Caregiver',
        'staff.role.nurse': 'Nurse',
        'staff.role.admin': 'Administrator',
        'staff.role.doctor': 'Doctor',
        'staff.role.therapist': 'Therapist',

        'staff.payRate': 'Pay Rate (per hour)',
        'staff.pin': '4-Digit PIN',
        'staff.generatePin': 'Generate PIN',
        'staff.pinHint': 'Admin only. PIN is shown once when generated.',

        'nav.timeclock': 'Time Clock',
        'nav.payroll': 'Payroll',
        'timeclock.tab.staff': 'Staff Clock In',
        'timeclock.tab.admin': 'Admin Login',
        'timeclock.pin': '4-Digit Code (PIN)',
        'timeclock.clockInAndLogin': 'Clock In & Login',
        'timeclock.breakStart': 'Start Break',
        'timeclock.breakEnd': 'End Break',
        'timeclock.clockOut': 'Clock Out',
        'timeclock.subtitle': 'Clock actions require your 4-digit PIN.',
        'timeclock.myHours': 'My Hours',

        'payroll.subtitle': 'Generate payroll reports by date range. Admin only.',
        'payroll.since': 'From',
        'payroll.until': 'To',
        'payroll.staff': 'Staff',
        'payroll.staffAll': 'All Staff',
        'payroll.run': 'Run Report',
        'payroll.exportCsv': 'Export CSV',
    },
    es: {
        // App
        'app.browserTitle': 'Gestión de Cuidado de Adultos Mayores - Puerto Rico',
        'app.navTitle': 'Registro de Cuidado',

        // Navigation
        'nav.dashboard': 'Panel de Control',
        'nav.residents': 'Residentes',
        'nav.medications': 'Medicamentos',
        'nav.appointments': 'Citas',
        'nav.vitalSigns': 'Signos Vitales',
        'nav.calendar': 'Calendario',
        'nav.billing': 'Facturación',
        'nav.financial': 'Gestión Financiera',
        'nav.incidents': 'Incidentes',
        'nav.careNotes': 'Notas de Cuidado',
        'nav.notifications': 'Notificaciones',
        'nav.reports': 'Reportes',
        'nav.staff': 'Personal',
        'nav.logout': 'Cerrar Sesión',
        'nav.history': 'Historial',
        'nav.training': 'Entrenamiento',
        'nav.documents': 'Documentos',
        'nav.archivedResidents': 'Residentes Archivados',
        'nav.settings': 'Configuración',
        'nav.group.care': 'Gestión de Cuidado',
        'nav.group.records': 'Registros y Reportes',
        'nav.group.financial': 'Financiero',
        'nav.group.system': 'Sistema',

        // Dashboard
        'dashboard.title': 'Panel de Control',
        'dashboard.medications': 'Medicamentos',
        'dashboard.medicationsTaken': 'Tomados Hoy',
        'dashboard.appointments': 'Citas',
        'dashboard.appointmentsScheduled': 'Programadas Hoy',
        'dashboard.residents': 'Residentes',
        'dashboard.residentsActive': 'Activos',
        'dashboard.vitalSigns': 'Signos Vitales',
        'dashboard.vitalSignsRecorded': 'Registrados Hoy',
        'dashboard.accountBalance': 'Saldo de Cuenta',
        'dashboard.balance': 'Saldo',
        'dashboard.overdue': 'Vencido',
        'dashboard.quickAccess': 'Acceso Rápido',
        'dashboard.kpi.medAdherence': 'Adherencia a Medicamentos',
        'dashboard.kpi.takenToday': 'Tomados hoy',
        'dashboard.kpi.medsDueNextHour': 'Medicamentos Pendientes (Próxima Hora)',
        'dashboard.kpi.needsAction': 'Requiere acción',
        'dashboard.kpi.medsScheduledToday': 'Medicamentos Programados Hoy',
        'dashboard.kpi.activeMeds': 'Medicamentos activos',
        'dashboard.kpi.vitalsRecordedToday': 'Signos Vitales Registrados Hoy',
        'dashboard.kpi.activeStaff': 'Personal Activo',
        'dashboard.kpi.availableToday': 'Disponible hoy',
        'dashboard.kpi.incidents7d': 'Incidentes (Últimos 7 Días)',
        'dashboard.kpi.safetyFollowups': 'Seguridad y seguimientos',
        'dashboard.kpi.careNotes24h': 'Notas de Cuidado (Últimas 24 Horas)',
        'dashboard.kpi.documentationActivity': 'Actividad de documentación',
        'dashboard.kpi.activeResidents': 'Residentes Activos',
        'dashboard.kpi.currentlyInCare': 'Actualmente en cuidado',
        'dashboard.kpi.appointmentsToday': 'Citas Hoy',
        'dashboard.kpi.scheduled': 'Programadas',
        'dashboard.widget.needsAttention': 'Requiere Atención',
        'dashboard.widget.upcomingAppointments': 'Próximas Citas',
        'dashboard.widget.medicationSchedule': 'Horario de Medicamentos',
        'dashboard.widget.recentActivity': 'Actividad Reciente',
        'dashboard.widget.quickActions': 'Acciones Rápidas',
        'dashboard.empty.allCaughtUp': 'Todo al día',
        'dashboard.empty.noUpcomingAppointments': 'No hay citas próximas',
        'dashboard.empty.noMedicationsScheduled': 'No hay medicamentos programados',
        'dashboard.empty.noRecentActivity': 'No hay actividad reciente',
        'dashboard.attention.medsDueSoon': 'dosis de medicamento(s) pronto',
        'dashboard.attention.nextHourWindow': 'Ventana de medicamentos de la próxima hora',
        'dashboard.attention.incidentsIn7d': 'incidente(s) en los últimos 7 días',
        'dashboard.attention.reviewFollowups': 'Revisar seguimientos y documentación',

        // Common
        'common.search': 'Buscar',
        'common.logout': 'Cerrar Sesión',
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.edit': 'Editar',
        'common.delete': 'Eliminar',
        'common.add': 'Agregar',
        'common.close': 'Cerrar',
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.success': 'Éxito',
        'common.markAllRead': 'Marcar Todas',
        'common.viewAll': 'Ver Todas',
        'common.refresh': 'Actualizar',
        'common.applyRefresh': 'Aplicar / Actualizar',
        'common.viewHistory': 'Ver Historial',
        'common.notes': 'Notas',
        'common.reset': 'Restablecer',
        'common.select': 'Seleccionar',
        'common.required': 'Requerido',
        'common.continue': 'Continuar',
        'common.submit': 'Enviar',
        'common.back': 'Atrás',
        'common.next': 'Siguiente',
        'common.yes': 'Sí',
        'common.no': 'No',
        'common.clear': 'Limpiar',
        'common.darkMode': 'Modo Oscuro',
        'common.print': 'Imprimir',
        'common.keyboardShortcuts': 'Atajos de Teclado',
        'common.selectStaff': 'Seleccionar Personal',
        'common.selectResidents': 'Seleccionar Residentes',
        'common.selectBill': 'Seleccionar factura',
        'common.noItems': 'Sin elementos',
        'common.noResidents': 'No hay residentes agregados aún.',
        'common.noMedications': 'No hay medicamentos agregados aún.',
        'common.noAppointments': 'No hay citas programadas.',
        'common.noVitalSigns': 'No hay signos vitales registrados aún.',
        'common.noBills': 'No hay facturas creadas aún.',
        'common.noPayments': 'No hay pagos registrados aún.',
        'common.noStaff': 'No se encontró personal.',
        'common.noCareNotes': 'No se encontraron notas de cuidado.',
        'common.noIncidents': 'No se encontraron incidentes.',
        'common.noNotifications': 'Sin notificaciones',
        'common.loading': 'Cargando...',
        'common.errorLoading': 'Error al cargar',
        'common.tapToTakePhoto': 'Toca para tomar foto',
        'common.cameraAutoOpen': 'La cámara se abrirá automáticamente',
        'common.today': 'Hoy',
        'common.justNow': 'Ahora mismo',
        'common.minutesAgo': 'm',
        'common.hoursAgo': 'h',
        'common.daysAgo': 'd',

        // Financial
        'financial.subtitle': 'Gestionar cuentas bancarias, transacciones y conciliación',
        'financial.tab.accounts': 'Cuentas Bancarias',
        'financial.tab.transactions': 'Transacciones',
        'financial.tab.reconciliation': 'Conciliación',
        'financial.tab.receipts': 'Recibos de Pago',
        'financial.accounts.title': 'Cuentas Bancarias',
        'financial.accounts.add': '+ Agregar Cuenta Bancaria',
        'financial.accountType.checking': 'Cheque',
        'financial.accountType.savings': 'Ahorros',
        'financial.accountType.other': 'Otra',
        'financial.transactionType.deposit': 'Depósito',
        'financial.transactionType.withdrawal': 'Retiro',
        'financial.transactions.title': 'Transacciones',
        'financial.transactions.add': '+ Agregar Transacción',
        'financial.transactions.filterByAccount': 'Filtrar por Cuenta',
        'financial.transactions.allAccounts': 'Todas las Cuentas',
        'financial.transactions.showReconciled': 'Mostrar Conciliadas',
        'financial.transactions.reconciledFilter.all': 'Todas',
        'financial.transactions.reconciledFilter.reconciledOnly': 'Solo Conciliadas',
        'financial.transactions.reconciledFilter.unreconciledOnly': 'Solo No Conciliadas',
        'financial.reconciliation.title': 'Conciliar Cuenta',
        'financial.receipts.title': 'Recibos de Pago',
        'financial.receipts.searchLabel': 'Buscar por Número de Recibo o ID de Pago',

        // Reports
        'reports.generate': 'Generar Reporte',
        'reports.type': 'Tipo de Reporte *',
        'reports.type.incidents': 'Reporte de Incidentes',
        'reports.type.care_notes': 'Resumen de Notas de Cuidado',
        'reports.type.medications': 'Reporte de Medicamentos',
        'reports.type.appointments': 'Reporte de Citas',
        'reports.type.vital_signs': 'Reporte de Signos Vitales',
        'reports.type.comprehensive': 'Reporte Integral',
        'reports.from': 'Desde',
        'reports.to': 'Hasta',
        'reports.generatePreview': 'Generar Vista Previa',
        'reports.exportCsv': 'Exportar CSV',

        // Incidents
        'incident.selectStaff': '-- Seleccionar Personal --',
        'incident.selectResidents': '-- Seleccionar Residentes --',
        'incident.multiSelectHint': 'Mantenga Ctrl/Cmd para seleccionar varios',
        'incident.photos.tapToUpload': 'Toque para subir fotos',
        'incident.photos.multiHint': 'Puede seleccionar varias fotos',
        'incident.witnesses.placeholder': 'Nombres de los testigos',
        'incident.actions.placeholder': 'Describa lo que se hizo en respuesta...',

        // Care Notes
        'carenote.shift.morning': 'Mañana',
        'carenote.shift.afternoon': 'Tarde',
        'carenote.shift.evening': 'Noche',
        'carenote.shift.night': 'Madrugada',
        'carenote.appetite.poor': 'Pobre',
        'carenote.appetite.fair': 'Regular',
        'carenote.appetite.good': 'Buena',
        'carenote.appetite.excellent': 'Excelente',
        'carenote.pain.none': 'Ninguno',
        'carenote.pain.mild': 'Leve (1-3)',
        'carenote.pain.moderate': 'Moderado (4-6)',
        'carenote.pain.severe': 'Severo (7-10)',

        'carenote.section.nutrition': 'Nutrición e hidratación',
        'carenote.section.personalCare': 'Cuidado personal',
        'carenote.section.mobilityPain': 'Movilidad y dolor',
        'carenote.section.sleep': 'Sueño',
        'carenote.section.moodBehavior': 'Estado de ánimo y conducta',
        'carenote.fluidIntake.placeholder': 'ej., 6 vasos de agua, 2 tazas de jugo',
        'carenote.meal.placeholder': 'Qué comió y cuánto...',
        'carenote.bathing.placeholder': 'Detalles del baño...',
        'carenote.hygiene.placeholder': 'Detalles de higiene...',
        'carenote.toileting.placeholder': 'Frecuencia, tipo, cualquier problema...',
        'carenote.skinCondition.placeholder': 'Enrojecimiento, llagas, heridas, puntos de presión...',
        'carenote.mobility.placeholder': 'Cómo se movió el residente, asistencia necesaria, distancia...',
        'carenote.painLocation.placeholder': 'Dónde está localizado el dolor...',
        'carenote.sleepHours.placeholder': 'ej., 7.5',
        'carenote.behaviorNotes.placeholder': 'Observaciones sobre la conducta...',
        'carenote.activities.placeholder': 'Actividades en las que participó...',
        'carenote.generalNotes.placeholder': 'Cualquier otra observación o nota...',

        'activity.vitalRecorded': 'Signos vitales registrados',
        'activity.careNoteAdded': 'Nota de cuidado agregada',

        // Login
        'login.title': 'Gestión de Cuidado de Ancianos',
        'login.subtitle': 'Iniciar Sesión',
        'login.username': 'Usuario',
        'login.password': 'Contraseña',
        'login.submit': 'Iniciar Sesión',
        'login.placeholder.username': 'Ingrese usuario',
        'login.placeholder.password': 'Ingrese contraseña',
        'login.hint': 'Credenciales por defecto: admin (contraseña: admin123)',

        // Resident Selector
        'resident.select': 'Seleccionar Residente',
        'resident.choose': 'Elegir Residente',
        'resident.selectOption': 'Seleccione un residente',
        'resident.addNew': 'Agregar Nuevo Residente',

        // Resident Form
        'resident.title': 'Gestión de Residentes',
        'resident.add': 'Agregar Nuevo Residente',
        'resident.edit': 'Editar Residente',
        'resident.fullName': 'Nombre Completo',
        'resident.firstName': 'Nombre', // Deprecated - kept for backwards compatibility
        'resident.lastName': 'Apellido', // Deprecated - kept for backwards compatibility
        'resident.dateOfBirth': 'Fecha de Nacimiento',
        'resident.gender': 'Género',
        'resident.photo': 'Foto',
        'resident.roomNumber': 'Número de Habitación',
        'resident.bedNumber': 'Número de Cama',
        'resident.emergencyContact': 'Nombre del Contacto de Emergencia',
        'resident.emergencyPhone': 'Teléfono de Emergencia',
        'resident.emergencyRelation': 'Relación',
        'resident.emergencyEmail': 'Correo de Contacto de Emergencia',
        'resident.medicalConditions': 'Condiciones Médicas',
        'resident.allergies': 'Alergias',
        'resident.dietaryRestrictions': 'Restricciones Dietéticas',
        'resident.save': 'Guardar Residente',
        'resident.year': 'Año',
        'resident.month': 'Mes',
        'resident.day': 'Día',
        'resident.gender.male': 'Masculino',
        'resident.gender.female': 'Femenino',
        'resident.gender.other': 'Otro',
        'resident.relation.placeholder': 'ej., Hijo, Hija',
        'resident.uploadPhoto': 'Subir Foto',
        'resident.removePhoto': 'Eliminar Foto',

        // Months
        'month.january': 'Enero',
        'month.february': 'Febrero',
        'month.march': 'Marzo',
        'month.april': 'Abril',
        'month.may': 'Mayo',
        'month.june': 'Junio',
        'month.july': 'Julio',
        'month.august': 'Agosto',
        'month.september': 'Septiembre',
        'month.october': 'Octubre',
        'month.november': 'Noviembre',
        'month.december': 'Diciembre',

        // Medications
        'medication.title': 'Gestión de Medicamentos',
        'medication.addNew': 'Agregar Nuevo Medicamento',
        'medication.add': 'Agregar Medicamento',
        'medication.edit': 'Editar Medicamento',
        'medication.name': 'Nombre del Medicamento',
        'medication.dosage': 'Dosis',
        'medication.frequency': 'Frecuencia',
        'medication.startDate': 'Fecha de Inicio',
        'medication.endDate': 'Fecha de Fin',
        'medication.instructions': 'Instrucciones',
        'medication.save': 'Guardar Medicamento',
        'medication.times': 'Hora(s)',
        'medication.timesHint': 'Ingrese horas separadas por comas',
        'medication.hoursBetween': 'Horas Entre Dosis',
        'medication.frequency.onceDaily': 'Una vez al día',
        'medication.frequency.twiceDaily': 'Dos veces al día',
        'medication.frequency.threeTimesDaily': 'Tres veces al día',
        'medication.frequency.every4Hours': 'Cada 4 horas',
        'medication.frequency.every6Hours': 'Cada 6 horas',
        'medication.frequency.every8Hours': 'Cada 8 horas',
        'medication.frequency.atIntervals': 'A intervalos',
        'medication.frequency.asNeeded': 'Según sea necesario',
        'medication.noEndDate': 'Sin fecha de fin (Continuo)',
        'medication.ongoing': 'Continuo',
        'medication.scheduledTimes': 'Horarios',
        'medication.markTaken': 'Marcar Tomado',
        'medication.taken': 'Tomado',

        // Calendar
        'calendar.title': 'Calendario de Actividades',
        'calendar.previous': '← Anterior',
        'calendar.next': 'Siguiente →',
        'calendar.today': 'Hoy',
        'calendar.search': 'Buscar Actividades',
        'calendar.searchPlaceholder': 'Buscar por nombre, doctor, medicamento...',

        // Appointments
        'appointment.title': 'Seguimiento de Citas',
        'appointment.add': 'Agregar Cita',
        'appointment.edit': 'Editar Cita',
        'appointment.addNew': 'Agregar Nueva Cita',
        'appointment.date': 'Fecha',
        'appointment.time': 'Hora',
        'appointment.type': 'Tipo',
        'appointment.provider': 'Doctor/Proveedor',
        'appointment.facility': 'Instalación',
        'appointment.purpose': 'Propósito',
        'appointment.location': 'Ubicación',
        'appointment.notes': 'Notas',
        'appointment.save': 'Guardar Cita',

        // Billing
        'billing.title': 'Facturación y Pagos',
        'billing.add': 'Agregar Nueva Factura',
        'billing.edit': 'Editar Factura',
        'billing.create': 'Crear Factura',
        'billing.accountBalance': 'Saldo de Cuenta',
        'billing.totalBilled': 'Total Facturado',
        'billing.totalPaid': 'Total Pagado',
        'billing.balance': 'Saldo',
        'billing.pending': 'Pendiente',
        'billing.date': 'Fecha de Factura',
        'billing.amount': 'Monto',
        'billing.description': 'Descripción',
        'billing.dueDate': 'Fecha de Vencimiento',
        'billing.status': 'Estado',
        'billing.save': 'Guardar Factura',
        'billing.status.pending': 'Pendiente',
        'billing.status.paid': 'Pagado',
        'billing.status.overdue': 'Vencido',
        'payment.add': 'Registrar Pago',
        'payment.edit': 'Editar Pago',

        // Vital Signs
        'vitals.title': 'Registro de Signos Vitales',
        'vitals.add': 'Registrar Signos Vitales',
        'vitals.edit': 'Editar Signos Vitales',
        'vitals.history': 'Historial de Signos Vitales',
        'vitals.dateTime': 'Fecha y Hora',
        'vitals.date': 'Fecha',
        'vitals.time': 'Hora',
        'vitals.bloodPressure': 'Presión Arterial',
        'vitals.heartRate': 'Frecuencia Cardíaca',
        'vitals.temperature': 'Temperatura',
        'vitals.oxygenSaturation': 'Saturación de Oxígeno',
        'vitals.weight': 'Peso',
        'vitals.notes': 'Notas',
        'vitals.save': 'Guardar Signos Vitales',

        'vitals.systolic': 'Sistólica (mmHg)',
        'vitals.diastolic': 'Diastólica (mmHg)',
        'vitals.glucose': 'Nivel de Glucosa (mg/dL)',
        'vitals.notesPlaceholder': 'Observaciones...',

        'vitals.section.bloodPressure': 'Presión Arterial',
        'vitals.section.bloodGlucose': 'Glucosa en Sangre',
        'vitals.section.temperature': 'Temperatura',
        'vitals.section.heartRate': 'Frecuencia Cardíaca',
        'vitals.section.weight': 'Peso',

        // Care Notes
        'carenote.title': 'Notas de Cuidado',
        'carenote.add': 'Agregar Nota de Cuidado',
        'carenote.edit': 'Editar Nota de Cuidado',
        'carenote.date': 'Fecha',
        'carenote.time': 'Hora',
        'carenote.category': 'Categoría',
        'carenote.note': 'Nota',
        'carenote.save': 'Guardar Nota de Cuidado',

        // Incidents
        'incident.title': 'Reportes de Incidentes',
        'incident.add': 'Reportar Incidente',
        'incident.edit': 'Editar Incidente',
        'incident.editReport': 'Editar Reporte de Incidente',
        'incident.date': 'Fecha',
        'incident.time': 'Hora',
        'incident.type': 'Tipo',
        'incident.description': 'Descripción',
        'incident.severity': 'Severidad',
        'incident.actionTaken': 'Acción Tomada',
        'incident.save': 'Guardar Incidente',

        // Staff
        'staff.title': 'Gestión de Personal',
        'staff.add': 'Agregar Nuevo Personal',
        'staff.edit': 'Editar Personal',
        'staff.username': 'Usuario',
        'staff.fullName': 'Nombre Completo',
        'staff.role': 'Rol',
        'staff.email': 'Correo Electrónico',
        'staff.phone': 'Teléfono',
        'staff.password': 'Contraseña',
        'staff.password.placeholder': 'Ingrese nueva contraseña',
        'staff.save': 'Guardar Personal',
        'staff.passwordHint.new': '(Requerido para nuevo personal)',
        'staff.passwordHint.edit': '(Dejar en blanco para mantener actual)',
        'staff.active': 'Activo',
        'staff.role.caregiver': 'Cuidador',
        'staff.role.nurse': 'Enfermero(a)',
        'staff.role.admin': 'Administrador',
        'staff.role.doctor': 'Médico',
        'staff.role.therapist': 'Terapeuta',

        'staff.payRate': 'Tarifa (por hora)',
        'staff.pin': 'PIN de 4 dígitos',
        'staff.generatePin': 'Generar PIN',
        'staff.pinHint': 'Solo admin. El PIN se muestra una sola vez al generarse.',

        'nav.timeclock': 'Reloj Ponche',
        'nav.payroll': 'Nómina',
        'timeclock.tab.staff': 'Ponche del Personal',
        'timeclock.tab.admin': 'Acceso Admin',
        'timeclock.pin': 'Código de 4 dígitos (PIN)',
        'timeclock.clockInAndLogin': 'Marcar Entrada y Entrar',
        'timeclock.breakStart': 'Iniciar Descanso',
        'timeclock.breakEnd': 'Terminar Descanso',
        'timeclock.clockOut': 'Marcar Salida',
        'timeclock.subtitle': 'Las acciones requieren su PIN de 4 dígitos.',
        'timeclock.myHours': 'Mis Horas',

        'payroll.subtitle': 'Genere reportes de nómina por rango de fechas. Solo admin.',
        'payroll.since': 'Desde',
        'payroll.until': 'Hasta',
        'payroll.staff': 'Personal',
        'payroll.staffAll': 'Todo el Personal',
        'payroll.run': 'Generar',
        'payroll.exportCsv': 'Exportar CSV',
    }
};

function showLoginTab(tab) {
    const staffPanel = document.getElementById('staffClockInPanel');
    const adminForm = document.getElementById('loginForm');
    const staffBtn = document.getElementById('loginTabStaff');
    const adminBtn = document.getElementById('loginTabAdmin');

    if (!staffPanel || !adminForm || !staffBtn || !adminBtn) return;
    if (tab === 'admin') {
        staffPanel.style.display = 'none';
        adminForm.style.display = 'block';
        adminBtn.classList.remove('btn-secondary');
        adminBtn.classList.add('btn-primary');
        staffBtn.classList.remove('btn-primary');
        staffBtn.classList.add('btn-secondary');
    } else {
        staffPanel.style.display = 'block';
        adminForm.style.display = 'none';
        staffBtn.classList.remove('btn-secondary');
        staffBtn.classList.add('btn-primary');
        adminBtn.classList.remove('btn-primary');
        adminBtn.classList.add('btn-secondary');
    }
    replaceDualLanguageText();
}

function _getPinFromDom(inApp) {
    const el = document.getElementById(inApp ? 'timeclockPinInApp' : 'timeclockPin');
    return (el?.value || '').trim();
}

function _setPinDom(inApp, value) {
    const el = document.getElementById(inApp ? 'timeclockPinInApp' : 'timeclockPin');
    if (el) el.value = value;
}

function _applyAuthSuccess(data) {
    authToken = data.token;
    currentStaff = data.staff;
    currentUser = data.staff;
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentStaff', JSON.stringify(currentStaff));

    const userLanguage = currentStaff.preferred_language || localStorage.getItem('preferredLanguage') || 'en';
    setLanguage(userLanguage);

    document.getElementById('userName').textContent = currentStaff.full_name;
    const userRoleEl = document.getElementById('userRole');
    if (userRoleEl) {
        userRoleEl.textContent = isAdminStaff(currentStaff) ? 'Administrator' : 'Caregiver';
        userRoleEl.style.display = 'inline-block';
    }
    document.getElementById('userInfo').style.display = 'flex';

    const staffNavLink = document.getElementById('staffNavLink');
    if (staffNavLink && isAdminStaff(currentStaff)) {
        staffNavLink.style.display = 'block';
    } else if (staffNavLink) {
        staffNavLink.style.display = 'none';
    }

    const financialNavLink = document.getElementById('financialNavLink');
    if (financialNavLink) {
        financialNavLink.style.display = isAdminStaff(currentStaff) ? 'block' : 'none';
    }

    const payrollNavLink = document.getElementById('payrollNavLink');
    if (payrollNavLink) {
        payrollNavLink.style.display = isAdminStaff(currentStaff) ? 'block' : 'none';
    }

    const settingsNavLink = document.getElementById('settingsNavLink');
    if (settingsNavLink) {
        settingsNavLink.style.display = isAdminStaff(currentStaff) ? 'block' : 'none';
    }

    const settingsHeaderBtn = document.getElementById('settingsHeaderBtn');
    if (settingsHeaderBtn) {
        settingsHeaderBtn.style.display = isAdminStaff(currentStaff) ? 'inline-flex' : 'none';
    }

    hideLoginModal();
    checkAuth();
}

function getDefaultModuleSettings() {
    return {
        residents: true,
        medications: true,
        appointments: true,
        vitalsigns: true,
        carenotes: true,
        incidents: true,
        calendar: true,
        reports: true,
        billing: true,
        notifications: true,
        timeclock: true,
        history: true,
        payroll: true,
        financial: true,
        staff: true,
        archivedResidents: true,
        documents: true,
        training: true
    };
}

function getModuleSettings() {
    try {
        const raw = localStorage.getItem('moduleSettings');
        if (!raw) return getDefaultModuleSettings();
        const parsed = JSON.parse(raw);
        return { ...getDefaultModuleSettings(), ...(parsed || {}) };
    } catch (e) {
        return getDefaultModuleSettings();
    }
}

function setModuleSettings(settings) {
    try {
        localStorage.setItem('moduleSettings', JSON.stringify(settings));
    } catch (e) {
        // ignore
    }
}

function isPageEnabled(pageName) {
    const settings = getModuleSettings();
    const pageToKey = {
        residents: 'residents',
        medications: 'medications',
        appointments: 'appointments',
        vitalsigns: 'vitalsigns',
        carenotes: 'carenotes',
        incidents: 'incidents',
        calendar: 'calendar',
        reports: 'reports',
        billing: 'billing',
        notifications: 'notifications',
        timeclock: 'timeclock',
        history: 'history',
        payroll: 'payroll',
        financial: 'financial',
        staff: 'staff',
        archivedResidents: 'archivedResidents',
        documents: 'documents',
        training: 'training'
    };
    const key = pageToKey[pageName];
    if (!key) return true;
    return !!settings[key];
}

function applyModuleSettings() {
    const settings = getModuleSettings();
    const navMap = {
        residents: null,
        medications: null,
        appointments: null,
        vitalsigns: null,
        carenotes: null,
        incidents: null,
        calendar: null,
        reports: null,
        billing: null,
        notifications: null,
        timeclock: null,
        history: null,
        payroll: 'payrollNavLink',
        financial: 'financialNavLink',
        staff: 'staffNavLink',
        archivedResidents: 'archivedResidentsNavLink',
        documents: 'documentsNavLink',
        training: 'trainingNavLink'
    };

    const navSelectorMap = {
        residents: '.nav-link[data-page="residents"]',
        medications: '.nav-link[data-page="medications"]',
        appointments: '.nav-link[data-page="appointments"]',
        vitalsigns: '.nav-link[data-page="vitalsigns"]',
        carenotes: '.nav-link[data-page="carenotes"]',
        incidents: '.nav-link[data-page="incidents"]',
        calendar: '.nav-link[data-page="calendar"]',
        reports: '.nav-link[data-page="reports"]',
        billing: '.nav-link[data-page="billing"]',
        notifications: '.nav-link[data-page="notifications"]',
        timeclock: '.nav-link[data-page="timeclock"]',
        history: '.nav-link[data-page="history"]'
    };

    const setNavVisibility = (el, visible) => {
        if (!el) return;
        const li = el.closest ? el.closest('li') : null;
        if (li) {
            li.style.display = visible ? '' : 'none';
            return;
        }
        el.style.display = visible ? '' : 'none';
    };

    Object.keys(navMap).forEach((key) => {
        if (navMap[key]) {
            const el = document.getElementById(navMap[key]);
            if (!el) return;

            const roleAllows = !currentStaff || isAdminStaff(currentStaff);
            const enabled = !!settings[key];
            setNavVisibility(el, roleAllows && enabled);
            return;
        }

        const selector = navSelectorMap[key];
        if (!selector) return;
        const el = document.querySelector(selector);
        if (!el) return;
        const enabled = !!settings[key];
        setNavVisibility(el, enabled);
    });

    const settingsNavLink = document.getElementById('settingsNavLink');
    if (settingsNavLink) {
        setNavVisibility(settingsNavLink, !!(currentStaff && isAdminStaff(currentStaff)));
    }

    const settingsHeaderBtn = document.getElementById('settingsHeaderBtn');
    if (settingsHeaderBtn) {
        settingsHeaderBtn.style.display = currentStaff && isAdminStaff(currentStaff) ? 'inline-flex' : 'none';
    }

    // Dashboard quick actions (grid will reflow automatically when items are display:none)
    try {
        const quickActionButtons = document.querySelectorAll('.quick-action-btn[data-module]');
        quickActionButtons.forEach((btn) => {
            const mod = (btn.getAttribute('data-module') || '').trim();
            if (!mod) return;

            // Respect admin-only items
            if (mod === 'staff') {
                const adminAllowed = currentStaff && isAdminStaff(currentStaff);
                btn.style.display = adminAllowed && !!settings.staff ? '' : 'none';
                return;
            }

            btn.style.display = isPageEnabled(mod) ? '' : 'none';
        });
    } catch (e) {
        // ignore
    }

    // Navbar height can change when items are hidden/shown
    try {
        if (typeof window.updateStickyHeaderOffset === 'function') {
            window.updateStickyHeaderOffset();
            window.requestAnimationFrame(() => window.updateStickyHeaderOffset());
        }
    } catch (e) {
        // ignore
    }
}

function loadModuleSettingsIntoForm() {
    const settings = getModuleSettings();
    const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!value;
    };
    setChecked('moduleToggleResidents', settings.residents);
    setChecked('moduleToggleMedications', settings.medications);
    setChecked('moduleToggleAppointments', settings.appointments);
    setChecked('moduleToggleVitalSigns', settings.vitalsigns);
    setChecked('moduleToggleCareNotes', settings.carenotes);
    setChecked('moduleToggleIncidents', settings.incidents);
    setChecked('moduleToggleCalendar', settings.calendar);
    setChecked('moduleToggleReports', settings.reports);
    setChecked('moduleToggleBilling', settings.billing);
    setChecked('moduleToggleNotifications', settings.notifications);
    setChecked('moduleToggleTimeClock', settings.timeclock);
    setChecked('moduleToggleHistory', settings.history);
    setChecked('moduleTogglePayroll', settings.payroll);
    setChecked('moduleToggleFinancial', settings.financial);
    setChecked('moduleToggleStaff', settings.staff);
    setChecked('moduleToggleArchivedResidents', settings.archivedResidents);
    setChecked('moduleToggleDocuments', settings.documents);
    setChecked('moduleToggleTraining', settings.training);
}

function saveModuleSettings() {
    const getChecked = (id) => {
        const el = document.getElementById(id);
        return el ? !!el.checked : true;
    };
    const next = {
        residents: getChecked('moduleToggleResidents'),
        medications: getChecked('moduleToggleMedications'),
        appointments: getChecked('moduleToggleAppointments'),
        vitalsigns: getChecked('moduleToggleVitalSigns'),
        carenotes: getChecked('moduleToggleCareNotes'),
        incidents: getChecked('moduleToggleIncidents'),
        calendar: getChecked('moduleToggleCalendar'),
        reports: getChecked('moduleToggleReports'),
        billing: getChecked('moduleToggleBilling'),
        notifications: getChecked('moduleToggleNotifications'),
        timeclock: getChecked('moduleToggleTimeClock'),
        history: getChecked('moduleToggleHistory'),
        payroll: getChecked('moduleTogglePayroll'),
        financial: getChecked('moduleToggleFinancial'),
        staff: getChecked('moduleToggleStaff'),
        archivedResidents: getChecked('moduleToggleArchivedResidents'),
        documents: getChecked('moduleToggleDocuments'),
        training: getChecked('moduleToggleTraining')
    };

    // Dashboard and Settings are always enabled
    next.dashboard = true;
    next.settings = true;

    setModuleSettings(next);
    applyModuleSettings();
    showMessage('Settings saved / Configuración guardada', 'success');

    const activePageId = document.querySelector('.page.active')?.id;
    if (activePageId && !isPageEnabled(activePageId)) {
        showPage('dashboard');
    }
}

function resetModuleSettings() {
    setModuleSettings(getDefaultModuleSettings());
    loadModuleSettingsIntoForm();
    applyModuleSettings();
    showMessage('Settings reset / Configuración restablecida', 'success');
}

async function handlePinClockIn() {
    const pin = _getPinFromDom(false);
    if (!pin || pin.length !== 4) {
        showMessage('Please enter your 4-digit code / Por favor ingrese su código de 4 dígitos', 'error');
        return;
    }
    try {
        const res = await fetch('/api/timeclock/pin/clock-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ pin }),
            cache: 'no-store'
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            showMessage((data && (data.error || data.message)) || 'Clock in failed / Error al marcar entrada', 'error');
            return;
        }
        _applyAuthSuccess(data);
        showMessage('Clocked in / Entrada registrada', 'success');
        _setPinDom(false, '');
    } catch (e) {
        showMessage(`Error: ${e.message}`, 'error');
    }
}

async function handlePinBreakStart(inApp = false) {
    const pin = _getPinFromDom(inApp);
    if (!pin || pin.length !== 4) {
        showMessage('Please enter your 4-digit code / Por favor ingrese su código de 4 dígitos', 'error');
        return;
    }
    try {
        const res = await fetch('/api/timeclock/pin/break-start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ pin }),
            cache: 'no-store'
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            showMessage((data && (data.error || data.message)) || 'Break start failed / Error al iniciar descanso', 'error');
            return;
        }
        showMessage('Break started / Descanso iniciado', 'success');
    } catch (e) {
        showMessage(`Error: ${e.message}`, 'error');
    }
}

async function handlePinBreakEnd(inApp = false) {
    const pin = _getPinFromDom(inApp);
    if (!pin || pin.length !== 4) {
        showMessage('Please enter your 4-digit code / Por favor ingrese su código de 4 dígitos', 'error');
        return;
    }
    try {
        const res = await fetch('/api/timeclock/pin/break-end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ pin }),
            cache: 'no-store'
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            showMessage((data && (data.error || data.message)) || 'Break end failed / Error al terminar descanso', 'error');
            return;
        }
        showMessage('Break ended / Descanso terminado', 'success');
    } catch (e) {
        showMessage(`Error: ${e.message}`, 'error');
    }
}

async function handlePinClockOut(inApp = false) {
    const pin = _getPinFromDom(inApp);
    if (!pin || pin.length !== 4) {
        showMessage('Please enter your 4-digit code / Por favor ingrese su código de 4 dígitos', 'error');
        return;
    }
    try {
        const res = await fetch('/api/timeclock/pin/clock-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ pin }),
            cache: 'no-store'
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            showMessage((data && (data.error || data.message)) || 'Clock out failed / Error al marcar salida', 'error');
            return;
        }
        showMessage('Clocked out / Salida registrada', 'success');
        if (inApp) {
            handleLogout();
        } else {
            _setPinDom(false, '');
        }
    } catch (e) {
        showMessage(`Error: ${e.message}`, 'error');
    }
}

function _fmtHoursFromMinutes(mins) {
    const h = Math.floor((mins || 0) / 60);
    const m = (mins || 0) % 60;
    return `${h}h ${m}m`;
}

async function loadMyHoursSummary() {
    if (!authToken) return;
    try {
        const res = await fetch('/api/timeclock/me/summary', { headers: getAuthHeaders(), cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const todayEl = document.getElementById('myHoursToday');
        const weekEl = document.getElementById('myHoursWeek');
        if (todayEl) {
            todayEl.innerHTML = `
                <div><strong>Today / Hoy:</strong> ${_fmtHoursFromMinutes(data?.today?.work_minutes || 0)}</div>
                <div style="color: var(--dark-gray); margin-top: 0.25rem;"><strong>Breaks / Descansos:</strong> ${_fmtHoursFromMinutes(data?.today?.break_minutes || 0)}</div>
            `;
        }
        if (weekEl) {
            const rows = (data?.week || []).map(d => {
                return `<div style="display:flex; justify-content:space-between; gap:1rem; padding:0.25rem 0; border-bottom:1px solid #eee;">
                    <div>${d.date}</div>
                    <div>${_fmtHoursFromMinutes(d.work_minutes || 0)}</div>
                </div>`;
            }).join('');
            weekEl.innerHTML = `<div style="margin-top:0.5rem;"><strong>Week / Semana:</strong></div>${rows || ''}`;
        }
    } catch (e) {
        console.error('loadMyHoursSummary error', e);
    }
}

async function loadPayrollStaffOptions() {
    try {
        const res = await fetch('/api/staff', { headers: getAuthHeaders(), cache: 'no-store' });
        if (!res.ok) return;
        const staffList = await res.json();
        const sel = document.getElementById('payrollStaff');
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = `<option value="" data-translate="payroll.staffAll">${t('payroll.staffAll')}</option>` +
            staffList.map(s => `<option value="${s.id}">${(s.full_name || s.username || s.id)}</option>`).join('');
        sel.value = current;
        replaceDualLanguageText();
        updateTranslations();
    } catch (e) {
        console.error('loadPayrollStaffOptions error', e);
    }
}

async function loadPayrollReport() {
    const since = document.getElementById('payrollSince')?.value;
    const until = document.getElementById('payrollUntil')?.value;
    const staffId = document.getElementById('payrollStaff')?.value;
    if (!since || !until) {
        showMessage('Please select a date range / Por favor seleccione un rango de fechas', 'error');
        return;
    }
    try {
        const params = new URLSearchParams({ since, until });
        if (staffId) params.set('staff_id', staffId);
        const res = await fetch(`/api/timeclock/payroll?${params.toString()}`, { headers: getAuthHeaders(), cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            showMessage((data && (data.error || data.message)) || 'Failed to load payroll / Error al cargar nómina', 'error');
            return;
        }
        const container = document.getElementById('payrollTable');
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">No records / Sin registros</div>';
            return;
        }
        const rowsHtml = data.map(r => {
            const rate = (r.pay_rate === null || r.pay_rate === undefined) ? '' : `$${Number(r.pay_rate).toFixed(2)}`;
            const gross = (r.gross_pay === null || r.gross_pay === undefined) ? '' : `$${Number(r.gross_pay).toFixed(2)}`;
            return `<tr>
                <td>${r.full_name || ''}</td>
                <td>${r.clock_in_at || ''}</td>
                <td>${r.clock_out_at || ''}</td>
                <td>${r.work_hours || 0}</td>
                <td>${rate}</td>
                <td>${gross}</td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <div style="overflow:auto;">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Staff</th>
                            <th>In</th>
                            <th>Out</th>
                            <th>Hours</th>
                            <th>Rate</th>
                            <th>Gross</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    } catch (e) {
        showMessage(`Error: ${e.message}`, 'error');
    }
}

function downloadPayrollCsv() {
    const since = document.getElementById('payrollSince')?.value;
    const until = document.getElementById('payrollUntil')?.value;
    const staffId = document.getElementById('payrollStaff')?.value;
    if (!since || !until) {
        showMessage('Please select a date range / Por favor seleccione un rango de fechas', 'error');
        return;
    }
    const params = new URLSearchParams({ since, until });
    if (staffId) params.set('staff_id', staffId);
    window.open(`/api/timeclock/payroll/csv?${params.toString()}`, '_blank');
}

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

function normalizeBilingualString(text) {
    if (!text || typeof text !== 'string') return text;
    if (!text.includes(' / ')) return text;
    const dualLangPattern = /([^/]+)\s*\/\s*([^/]+)/g;
    return text.replace(dualLangPattern, (match, englishPart, spanishPart) => {
        const en = String(englishPart).trim();
        const es = String(spanishPart).trim();
        return currentLanguage === 'es' ? es : en;
    });
}

// Set language and update UI
// Replace dual-language text (English / Spanish) with single language
function replaceDualLanguageText() {
    // Pattern: "English / Spanish" -> extract only the needed language
    const dualLangPattern = /([^/]+)\s*\/\s*([^/]+)/g;

    function replaceText(text) {
        if (!text || !text.includes(' / ')) return text;
        return text.replace(dualLangPattern, (match, englishPart, spanishPart) => {
            const en = englishPart.trim();
            const es = spanishPart.trim();
            return currentLanguage === 'es' ? es : en;
        });
    }

    // Process all text nodes directly
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let textNode;
    while (textNode = walker.nextNode()) {
        // Skip text nodes inside script, style, and noscript tags
        const parent = textNode.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT')) {
            continue;
        }

        // Skip if parent has data-translate (handled by updateTranslations)
        if (parent && (parent.hasAttribute('data-translate') ||
            parent.hasAttribute('data-translate-placeholder') ||
            parent.hasAttribute('data-translate-title'))) {
            continue;
        }

        const text = textNode.textContent;
        if (text && text.includes(' / ')) {
            const newText = replaceText(text);
            if (newText !== text) {
                textNode.textContent = newText;
            }
        }
    }

    // Process element textContent for headings, buttons, labels, options, etc.
    // This handles cases where text might be in element.textContent but not in a direct text node
    // For headings and buttons, be more aggressive and process them directly
    const elementsToProcess = document.querySelectorAll('h1, h2, h3, h4, h5, h6, button, label, option, span, div, p, td, th, li, a');
    elementsToProcess.forEach(el => {
        // Skip elements with data-translate (handled by updateTranslations)
        if (el.hasAttribute('data-translate') ||
            el.hasAttribute('data-translate-placeholder') ||
            el.hasAttribute('data-translate-title')) {
            return;
        }

        // Skip script, style, noscript
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
            return;
        }

        // For headings and buttons, always process textContent directly if it contains dual-language pattern
        // For other elements, only process if they have simple text content (not nested elements)
        const isHeadingOrButton = el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' ||
                                  el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6' ||
                                  el.tagName === 'BUTTON';

        if (el.textContent && el.textContent.includes(' / ')) {
            if (isHeadingOrButton) {
                // For headings and buttons, always process textContent
                const newText = replaceText(el.textContent);
                if (newText !== el.textContent) {
                    el.textContent = newText;
                }
            } else {
                // For other elements, only process if it has simple text content
                const hasOnlyTextNodes = Array.from(el.childNodes).every(node =>
                    node.nodeType === Node.TEXT_NODE ||
                    (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length === 0)
                );

                if (hasOnlyTextNodes) {
                    const newText = replaceText(el.textContent);
                    if (newText !== el.textContent) {
                        el.textContent = newText;
                    }
                }
            }
        }
    });

    // Process attributes (placeholder, title, value)
    document.querySelectorAll('[placeholder], [title], [value], option, button').forEach(el => {
        // Skip elements with data-translate attributes
        if (el.hasAttribute('data-translate') ||
            el.hasAttribute('data-translate-placeholder') ||
            el.hasAttribute('data-translate-title')) {
            return;
        }

        // Process placeholder
        if (el.placeholder && el.placeholder.includes(' / ')) {
            el.placeholder = replaceText(el.placeholder);
        }

        // Process title
        if (el.title && el.title.includes(' / ')) {
            el.title = replaceText(el.title);
        }

        // Process value (for input elements)
        if (el.value && el.value.includes(' / ')) {
            el.value = replaceText(el.value);
        }
    });
}

function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'es') {
        console.error('Invalid language:', lang);
        return;
    }

    currentLanguage = lang;
    document.documentElement.lang = lang;

    // Save to localStorage
    localStorage.setItem('preferredLanguage', lang);

    // Update language selector
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.value = lang;
    }

    // Update all translatable elements
    updateTranslations();

    // Replace all dual-language text with single language
    replaceDualLanguageText();

    // Update dashboard date to new language
    const dateEl = document.getElementById('dashboardDate');
    if (dateEl) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const locale = currentLanguage === 'es' ? 'es-PR' : 'en-US';
        dateEl.textContent = today.toLocaleDateString(locale, options);
    }

    // Save to server if user is logged in
    if (currentUser && authToken) {
        fetch('/api/staff/language', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ language: lang })
        }).catch(err => console.error('Error updating language preference:', err));
    }
}

// Update all translatable text on the page
function updateTranslations() {
    // Update navigation and text content
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (el.tagName === 'OPTION') {
            // For select options, update text but preserve value
            const value = el.getAttribute('value');
            if (value && value !== '') {
                el.textContent = t(key);
            } else {
                el.textContent = t(key);
            }
        } else {
            el.textContent = t(key);
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        el.placeholder = t(key);
    });

    // Update titles
    document.querySelectorAll('[data-translate-title]').forEach(el => {
        const key = el.getAttribute('data-translate-title');
        el.title = t(key);
    });

    // Update select options with data-translate-option
    document.querySelectorAll('[data-translate-option]').forEach(el => {
        const key = el.getAttribute('data-translate-option');
        el.textContent = t(key);
    });

    const monthNames = {
        '0': 'january',
        '1': 'february',
        '2': 'march',
        '3': 'april',
        '4': 'may',
        '5': 'june',
        '6': 'july',
        '7': 'august',
        '8': 'september',
        '9': 'october',
        '10': 'november',
        '11': 'december',

        '01': 'january',
        '02': 'february',
        '03': 'march',
        '04': 'april',
        '05': 'may',
        '06': 'june',
        '07': 'july',
        '08': 'august',
        '09': 'september',
        '10': 'october',
        '11': 'november',
        '12': 'december'
    };

    // Update month options dynamically (all month selects across the app)
    const monthSelects = document.querySelectorAll('select[id*="Month"], select[id*="month"]');
    monthSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            const v = option.value;
            if (!v) {
                option.textContent = t('resident.month');
                return;
            }

            // Support both numeric 0-11 and string 01-12 month values
            if (monthNames[v] || monthNames[String(v)]) {
                const key = monthNames[v] ? monthNames[v] : monthNames[String(v)];
                option.textContent = t(`month.${key}`);
            }
        });
    });

    // Normalize common Year/Month/Day placeholder options for date dropdowns
    const dateSelects = document.querySelectorAll('select');
    dateSelects.forEach(select => {
        const id = (select.id || '').toLowerCase();
        const firstOpt = select.options && select.options.length ? select.options[0] : null;
        if (!firstOpt || firstOpt.value !== '') return;

        if (id.includes('year')) firstOpt.textContent = t('resident.year');
        else if (id.includes('month')) firstOpt.textContent = t('resident.month');
        else if (id.includes('day')) firstOpt.textContent = t('resident.day');
    });

    // Update gender options
    const genderSelects = document.querySelectorAll('select[id*="Gender"], select[id*="gender"]');
    genderSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === 'Male') {
                option.textContent = t('resident.gender.male');
            } else if (option.value === 'Female') {
                option.textContent = t('resident.gender.female');
            } else if (option.value === 'Other') {
                option.textContent = t('resident.gender.other');
            } else if (option.value === '') {
                option.textContent = t('common.select');
            }
        });
    });

    // Update frequency options in medication forms
    const frequencySelects = document.querySelectorAll('select[id*="Frequency"], select[id*="frequency"]');
    frequencySelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            const freqMap = {
                'Once daily': t('medication.frequency.onceDaily'),
                'Twice daily': t('medication.frequency.twiceDaily'),
                'Three times daily': t('medication.frequency.threeTimesDaily'),
                'Every 4 hours': t('medication.frequency.every4Hours'),
                'Every 6 hours': t('medication.frequency.every6Hours'),
                'Every 8 hours': t('medication.frequency.every8Hours'),
                'At intervals': t('medication.frequency.atIntervals'),
                'As needed': t('medication.frequency.asNeeded')
            };
            if (freqMap[option.value]) {
                option.textContent = freqMap[option.value];
            }
        });
    });

    // Update billing status options
    const statusSelects = document.querySelectorAll('select[id*="Status"], select[id*="status"]');
    statusSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === 'pending' || option.value === 'Pending') {
                option.textContent = t('billing.status.pending');
            } else if (option.value === 'paid' || option.value === 'Paid') {
                option.textContent = t('billing.status.paid');
            } else if (option.value === 'overdue' || option.value === 'Overdue') {
                option.textContent = t('billing.status.overdue');
            }
        });
    });
}

// Set auth token for all API calls
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// Override fetch to include auth token and log all requests
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    const method = options.method || 'GET';
    const timestamp = new Date().toISOString();

    // Disable cache for all API requests to ensure they show in Network tab
    if (url.startsWith('/api/')) {
        options.cache = 'no-store'; // Force network request, never use cache
        options.headers = options.headers || {};

        // Add cache-control headers
        if (!options.headers['Cache-Control']) {
            options.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        }
        if (!options.headers['Pragma']) {
            options.headers['Pragma'] = 'no-cache';
        }

        // Log all API requests - MAKE IT IMPOSSIBLE TO MISS
        // NOTE: Do not embed URLs inside the formatted string because percent-encoded sequences
        // (e.g. %3A) can be misinterpreted by DevTools formatting and appear mangled.
        console.log(
            `%c🌐🌐🌐 NETWORK REQUEST 🌐🌐🌐\n` +
            `%c${method}\n` +
            `%cTime: ${timestamp}\n` +
            `%cCache: ${options.cache || 'default'}`,
            'background: #2196F3; color: white; font-size: 16px; font-weight: bold; padding: 10px;',
            'background: #4CAF50; color: white; font-size: 14px; padding: 5px;',
            'color: #666; font-size: 12px;',
            'color: #666; font-size: 12px;'
        );
        console.log('URL:', url);
        console.log('Full request details:', {
            url: url,
            method: method,
            headers: options.headers,
            body: options.body,
            cache: options.cache
        });

        // Also log to window for debugging
        if (!window.networkRequests) window.networkRequests = [];
        window.networkRequests.push({
            timestamp: timestamp,
            method: method,
            url: url,
            status: 'pending'
        });
    }

    // Add auth headers for API calls (except login)
    if (url.startsWith('/api/') && !url.includes('/auth/login')) {
        const authHeaders = getAuthHeaders();
        options.headers = { ...authHeaders, ...(options.headers || {}) };

        // Debug: Log if token is missing
        if (!authToken && url.startsWith('/api/')) {
            console.warn('⚠️ WARNING: Making API request without auth token:', url);
        }
    }

    // Make the request and log response
    const fetchPromise = originalFetch(url, options);

    if (url.startsWith('/api/')) {
        fetchPromise.then(response => {
            const responseTimestamp = new Date().toISOString();

            // Update network requests log
            if (window.networkRequests) {
                const req = window.networkRequests.find(r => r.url === url && r.status === 'pending');
                if (req) {
                    req.status = response.status;
                    req.statusText = response.statusText;
                    req.completedAt = responseTimestamp;
                }
            }

            // Big, visible console log for response
            const statusColor = response.ok ? '#4CAF50' : '#f44336';
            console.log(
                `%c✅✅✅ NETWORK RESPONSE ✅✅✅\n` +
                `%c${method}\n` +
                `%cStatus: ${response.status} ${response.statusText}\n` +
                `%cTime: ${responseTimestamp}`,
                'background: ' + statusColor + '; color: white; font-size: 16px; font-weight: bold; padding: 10px;',
                'background: #2196F3; color: white; font-size: 14px; padding: 5px;',
                'color: ' + statusColor + '; font-size: 14px; font-weight: bold;',
                'color: #666; font-size: 12px;'
            );
            console.log('URL:', url);
            console.log('Full response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            // Clone response to read body without consuming it.
            // Safari can throw "Body is disturbed or locked" if clone() is called multiple times.
            const clonedResponse = response.clone();
            const contentType = (clonedResponse.headers.get('content-type') || '').toLowerCase();
            const logPrefixStyle = 'background: #FF9800; color: white; padding: 5px;';
            if (contentType.includes('application/json')) {
                clonedResponse.json().then(data => {
                    console.log(`%c📦 Response data:`, logPrefixStyle, data);
                }).catch(() => {
                    // JSON parse failed; fallback to text
                    try {
                        const fallbackClone = response.clone();
                        fallbackClone.text().then(text => {
                            console.log(`%c📦 Response text:`, logPrefixStyle, (text || '').substring(0, 200));
                        }).catch(() => {});
                    } catch (_) {}
                });
            } else {
                clonedResponse.text().then(text => {
                    console.log(`%c📦 Response text:`, logPrefixStyle, (text || '').substring(0, 200));
                }).catch(() => {
                    // Ignore non-text bodies (e.g., PDF)
                });
            }

            return response;
        }).catch(error => {
            const errorTimestamp = new Date().toISOString();
            console.error(
                `%c❌❌❌ NETWORK ERROR ❌❌❌\n` +
                `%c${method} ${url}\n` +
                `%cError: ${error.message}\n` +
                `%cTime: ${errorTimestamp}`,
                'background: #f44336; color: white; font-size: 16px; font-weight: bold; padding: 10px;',
                'background: #2196F3; color: white; font-size: 14px; padding: 5px;',
                'color: #f44336; font-size: 14px; font-weight: bold;',
                'color: #666; font-size: 12px;'
            );
            console.error('Full error:', error);
        });
    }

    return fetchPromise;
};

// Check authentication on page load
function checkAuth() {
    if (!authToken || !currentStaff) {
        showLoginModal();
        // Hide search and quick actions when not logged in
        const searchContainer = document.getElementById('searchContainer');
        const quickActions = document.querySelector('.quick-actions-nav');
        if (searchContainer) searchContainer.style.display = 'none';
        if (quickActions) quickActions.style.display = 'none';
    } else {
        hideLoginModal();
        const trainingNavLink = document.getElementById('trainingNavLink');
        if (trainingNavLink) {
            trainingNavLink.style.display = 'block';
        }
        const documentsNavLink = document.getElementById('documentsNavLink');
        if (documentsNavLink) {
            if (currentStaff.role === 'admin') {
                documentsNavLink.style.display = 'block';
            } else {
                documentsNavLink.style.display = 'none';
            }
        }
        const archivedResidentsNavLink = document.getElementById('archivedResidentsNavLink');
        if (archivedResidentsNavLink) {
            if (currentStaff.role === 'admin') {
                archivedResidentsNavLink.style.display = 'block';
            } else {
                archivedResidentsNavLink.style.display = 'none';
            }
        }
        // Show Staff nav link if user is admin
        const staffNavLink = document.getElementById('staffNavLink');
        if (staffNavLink && currentStaff.role === 'admin') {
            staffNavLink.style.display = 'block';
        } else if (staffNavLink) {
            staffNavLink.style.display = 'none';
        }

        // Show Financial Management nav link if user is admin
        const financialNavLink = document.getElementById('financialNavLink');
        if (financialNavLink) {
            if (currentStaff.role === 'admin') {
                financialNavLink.style.display = 'block';
                console.log('✅ Financial Management link shown for admin user (checkAuth)');
            } else {
                financialNavLink.style.display = 'none';
                console.log('❌ Financial Management link hidden - user is not admin. Role:', currentStaff.role);
            }
        } else {
            console.error('❌ Financial Management nav link element not found!');
        }

        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        const hasShownPickerThisSession = safeStorageGet('residentPickerShownThisSession') === '1';

        // On mobile, always force the resident picker ONCE per session so staff can choose/change resident.
        // This prevents auto-jumping to dashboard due to a stale saved currentResidentId.
        if (isMobile && !hasShownPickerThisSession) {
            safeStorageSet('residentPickerShownThisSession', '1');
            showResidentSelector();
            return;
        }

        if (!currentResidentId) {
            showResidentSelector();
        } else {
            hideResidentSelector();
            initApp();
        }
    }
}

function forceResidentPicker() {
    // Allow the user to re-pick a resident at any time (mobile-friendly).
    currentResidentId = null;
    localStorage.removeItem('currentResidentId');
    showResidentSelector();
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('residentSelector').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';

    // Default to staff clock-in flow
    if (typeof showLoginTab === 'function') {
        showLoginTab('staff');
    }
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

async function validateAuthOnLoad() {
    if (!authToken) return;

    try {
        const response = await fetch('/api/auth/me', { headers: getAuthHeaders(), cache: 'no-store' });
        if (response.ok) {
            const me = await response.json().catch(() => null);
            if (me) {
                currentStaff = me;
                currentUser = me;
                safeStorageSet('currentStaff', JSON.stringify(currentStaff));
            }
            return;
        }

        // Any non-OK response means we cannot trust the local session.
        // This avoids skipping the login UI when the token is expired, invalid, or the server rejects it.
        safeStorageRemove('authToken');
        safeStorageRemove('currentStaff');
        safeStorageRemove('currentResidentId');
        authToken = null;
        currentStaff = null;
        currentUser = null;
    } catch (error) {
        console.error('Auth validation error:', error);
        // If validation cannot be completed (network/server error), do NOT auto-enter the app.
        safeStorageRemove('authToken');
        safeStorageRemove('currentStaff');
        safeStorageRemove('currentResidentId');
        authToken = null;
        currentStaff = null;
        currentUser = null;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate inputs
    if (!username || !password) {
        showMessage('Please enter both username and password / Por favor ingrese usuario y contraseña', 'error');
        return;
    }

    console.log('🔐 Attempting login for username:', username);

    try {
        console.log('🔐 Sending login request...');
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            cache: 'no-store'
        });

        console.log('📡 Login response status:', response.status, response.statusText);
        console.log('📡 Login response headers:', [...response.headers.entries()]);

        // Get response text first to see what we're dealing with
        const responseText = await response.text();
        console.log('📡 Login response text:', responseText);

        // Try to parse response
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('✅ Parsed login response:', data);
        } catch (parseError) {
            console.error('❌ Failed to parse login response as JSON:', parseError);
            console.error('Response text was:', responseText);
            showMessage('Server error. Please try again / Error del servidor. Por favor intente de nuevo', 'error');
            return;
        }

        if (response.ok) {
            if (!data.token || !data.staff) {
                console.error('❌ Login response missing token or staff data:', data);
                showMessage('Invalid server response / Respuesta del servidor inválida', 'error');
                return;
            }

            console.log('✅ Login successful!', data);
            authToken = data.token;
            currentStaff = data.staff;
            currentUser = data.staff; // Set for language system
            safeStorageSet('authToken', authToken);
            safeStorageSet('currentStaff', JSON.stringify(currentStaff));

            // Load user's preferred language
            const userLanguage = currentStaff.preferred_language || safeStorageGet('preferredLanguage') || 'en';
            setLanguage(userLanguage);

            document.getElementById('userName').textContent = currentStaff.full_name;
            const userRoleEl = document.getElementById('userRole');
            if (userRoleEl) {
                userRoleEl.textContent = currentStaff.role === 'admin' ? 'Administrator' : 'Caregiver';
                userRoleEl.style.display = 'inline-block';
            }
            document.getElementById('userInfo').style.display = 'flex';

            // Show Staff nav link if user is admin
            const staffNavLink = document.getElementById('staffNavLink');
            if (staffNavLink && currentStaff.role === 'admin') {
                staffNavLink.style.display = 'block';
            } else if (staffNavLink) {
                staffNavLink.style.display = 'none';
            }

            // Show Financial Management nav link if user is admin
            const financialNavLink = document.getElementById('financialNavLink');
            if (financialNavLink) {
                if (currentStaff.role === 'admin') {
                    financialNavLink.style.display = 'block';
                    console.log('✅ Financial Management link shown for admin user');
                } else {
                    financialNavLink.style.display = 'none';
                    console.log('❌ Financial Management link hidden - user is not admin. Role:', currentStaff.role);
                }
            } else {
                console.error('❌ Financial Management nav link element not found!');
            }

            hideLoginModal();
            // Let checkAuth decide whether to show resident selector or initialize the app
            // (prevents a "blank" screen when currentResidentId already exists)
            checkAuth();
            showMessage('Login successful! / ¡Inicio de sesión exitoso!', 'success');
        } else {
            // Login failed - show error message
            const errorMsg = data.error || data.message || 'Login failed / Error de inicio de sesión';
            console.error('❌ Login failed:', response.status, errorMsg);
            showMessage(errorMsg, 'error');

            // Clear password field on error
            document.getElementById('loginPassword').value = '';
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage(`Error connecting to server: ${error.message} / Error al conectar con el servidor: ${error.message}`, 'error');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
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
        const response = await fetch('/api/residents?active_only=true&include_training=true', {
            headers: getAuthHeaders(),
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error('Residents selector API error:', response.status);
            if (response.status === 401) {
                safeStorageRemove('authToken');
                safeStorageRemove('currentStaff');
                safeStorageRemove('currentResidentId');
                authToken = null;
                currentStaff = null;
                currentResidentId = null;
                checkAuth();
            }
            return;
        }

        const residents = await response.json();

        const select = document.getElementById('residentSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select a resident --</option>';

        if (!Array.isArray(residents) || residents.length === 0) {
            showMessage('No residents found. Add a resident or create Training Demo Data. / No se encontraron residentes. Agregue un residente o cree datos de entrenamiento.', 'error');
            return;
        }

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
    // If user is not authenticated, force login instead of initializing the app.
    if (!authToken || !currentStaff) {
        console.warn('selectResident called while unauthenticated; redirecting to login');
        localStorage.removeItem('currentResidentId');
        currentResidentId = null;
        showLoginModal();
        showMessage('Please log in to continue / Por favor inicie sesión para continuar', 'error');
        return;
    }

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
        const response = await fetch(`/api/residents/${residentId}`, { headers: getAuthHeaders(), cache: 'no-store' });
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error(`Failed to load resident info (${response.status})`);
        }
        const resident = await response.json();

        currentResidentIsTraining = !!(resident && (resident.is_training === 1 || resident.is_training === true || resident.is_training === '1'));
        const activePageId = document.querySelector('.page.active')?.id || '';
        setTrainingModeIndicator(activePageId === 'training' || currentResidentIsTraining);

        document.getElementById('currentResidentName').textContent =
            `${resident.first_name} ${resident.last_name}${resident.room_number ? ' - Room ' + resident.room_number : ''}`;
        document.getElementById('currentResidentInfo').style.display = 'block';

        // Add photo to current resident info if available
        const currentResidentInfo = document.getElementById('currentResidentInfo');
        let photoElement = document.getElementById('currentResidentPhoto');
        if (resident.photo_path) {
            if (!photoElement) {
                photoElement = document.createElement('img');
                photoElement.id = 'currentResidentPhoto';
                photoElement.className = 'current-resident-photo';
                photoElement.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 0.5rem;';
                const nameElement = document.getElementById('currentResidentName');
                nameElement.parentNode.insertBefore(photoElement, nameElement);
            }
            photoElement.src = resident.photo_path;
            photoElement.style.display = 'block';
        } else if (photoElement) {
            photoElement.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading resident info:', error);
    }
}

function showAddResidentForm(isNewResident = false) {
    console.log('%c📝 showAddResidentForm() CALLED!', 'background: #ff00ff; color: #fff; font-size: 16px; padding: 5px;');
    console.log('isNewResident parameter:', isNewResident);

    // If explicitly adding a new resident, always clear editing state
    if (isNewResident) {
        console.log('🆕 Adding NEW resident - clearing all editing state');
        editingResidentId = null;

        // Clear form data attributes
        const residentFormPage = document.getElementById('addResidentFormPage');
        const residentFormModal = document.getElementById('addResidentForm');
        if (residentFormPage) delete residentFormPage.dataset.editingId;
        if (residentFormModal) delete residentFormModal.dataset.editingId;

        // Reset form titles
        const formTitleModal = document.querySelector('#addResidentForm h3');
        if (formTitleModal) {
            formTitleModal.textContent = t('resident.add');
        }

        const formTitlePage = document.querySelector('#addResidentFormPage h3');
        if (formTitlePage) {
            formTitlePage.textContent = t('resident.add');
        }

        // Reset forms
        resetResidentForm();
    } else {
        // Store the current editingResidentId to prevent it from being lost (when editing)
        const wasEditing = editingResidentId !== null && editingResidentId !== undefined;
        const savedEditingId = editingResidentId;

        console.log('showAddResidentForm called. editingResidentId:', editingResidentId, 'wasEditing:', wasEditing);

        // Only reset editingResidentId if it's not already set (i.e., when adding new, not editing)
        if (!wasEditing) {
            editingResidentId = null;

            // Reset form titles only when adding new
            const formTitleModal = document.querySelector('#addResidentForm h3');
            if (formTitleModal) {
                formTitleModal.textContent = t('resident.add');
            }

            const formTitlePage = document.querySelector('#addResidentFormPage h3');
            if (formTitlePage) {
                formTitlePage.textContent = t('resident.add');
            }

            // Reset forms only when adding new
            resetResidentForm();
        } else {
            // Restore editingResidentId if it was set (defensive programming)
            editingResidentId = savedEditingId;
            console.log('Preserving editingResidentId:', editingResidentId);
        }
    }

    // Show form in modal (if in resident selector)
    const formModal = document.getElementById('addResidentForm');
    console.log('Form modal element:', formModal);
    if (formModal) {
        formModal.style.display = 'block';
        console.log('✅ Modal form displayed');
    } else {
        console.warn('⚠️ Modal form element not found!');
    }

    // Show form on page (if on residents page)
    const formPage = document.getElementById('addResidentFormPage');
    console.log('Form page element:', formPage);
    if (formPage) {
        formPage.style.display = 'block';
        console.log('✅ Page form displayed');
    } else {
        console.warn('⚠️ Page form element not found!');
    }

    // Final safeguard - restore editingResidentId if it was lost (only if not adding new)
    if (!isNewResident) {
        const wasEditing = editingResidentId !== null && editingResidentId !== undefined;
        const savedEditingId = editingResidentId;
        if (wasEditing && editingResidentId !== savedEditingId) {
            console.warn('⚠️ Restoring lost editingResidentId:', savedEditingId);
            editingResidentId = savedEditingId;
        }
    }
}

let residentPhotoData = null; // Store base64 photo data (modal form)
let residentPhotoDataPage = null; // Store base64 photo data (page form)

function handleResidentPhotoUpload(event) {
    handlePhotoUpload(event, 'newPhotoPreview', 'newPhotoPreviewImg', 'newPhotoUploadPlaceholder', 'newPhotoInput', 'residentPhotoData');
}

function handleResidentPhotoUploadPage(event) {
    handlePhotoUpload(event, 'newPhotoPreviewPage', 'newPhotoPreviewImgPage', 'newPhotoUploadPlaceholderPage', 'newPhotoInputPage', 'residentPhotoDataPage');
}

function handlePhotoUpload(event, previewId, previewImgId, placeholderId, inputId, dataVar) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file / Por favor seleccione un archivo de imagen', 'error');
        return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image too large. Max 5MB / Imagen muy grande. Máximo 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result; // Base64 data URL

        // Store in appropriate variable
        if (dataVar === 'residentPhotoData') {
            residentPhotoData = photoData;
        } else {
            residentPhotoDataPage = photoData;
        }

        const preview = document.getElementById(previewId);
        const previewImg = document.getElementById(previewImgId);
        const placeholder = document.getElementById(placeholderId);

        if (preview && previewImg && placeholder) {
            previewImg.src = photoData;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

function removeResidentPhoto() {
    residentPhotoData = null;
    const preview = document.getElementById('newPhotoPreview');
    const placeholder = document.getElementById('newPhotoUploadPlaceholder');
    const photoInput = document.getElementById('newPhotoInput');

    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (photoInput) photoInput.value = '';
}

function removeResidentPhotoPage() {
    residentPhotoDataPage = null;
    const preview = document.getElementById('newPhotoPreviewPage');
    const placeholder = document.getElementById('newPhotoUploadPlaceholderPage');
    const photoInput = document.getElementById('newPhotoInputPage');

    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    if (photoInput) photoInput.value = '';
}

function resetResidentForm() {
    // Reset modal form
    const formModal = document.getElementById('newResidentForm');
    if (formModal) formModal.reset();

    // Reset page form
    const formPage = document.getElementById('newResidentFormPage');
    if (formPage) formPage.reset();

    // Reset date dropdowns
    ['newBirthYear', 'newBirthMonth', 'newBirthDay', 'newBirthYearPage', 'newBirthMonthPage', 'newBirthDayPage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // Reset carrier fields
    ['newEmergencyCarrier', 'newEmergencyCarrierPage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    removeResidentPhoto();
    removeResidentPhotoPage();
}

function hideAddResidentForm() {
    const formModal = document.getElementById('addResidentForm');
    if (formModal) {
        formModal.style.display = 'none';
        delete formModal.dataset.editingId; // Clear backup
    }

    const formPage = document.getElementById('addResidentFormPage');
    if (formPage) {
        formPage.style.display = 'none';
        delete formPage.dataset.editingId; // Clear backup
    }

    // Only reset editingResidentId if we're not in the middle of saving
    // (It will be reset after successful save)
    if (editingResidentId !== null && editingResidentId !== undefined) {
        // Don't reset if we're editing - let save function handle it
        console.log('Keeping editingResidentId during form hide:', editingResidentId);
    } else {
        resetResidentForm();
        editingResidentId = null;
    }
}

async function saveNewResident(event) {
    console.log('🔄 saveNewResident called!', event);
    event.preventDefault();
    console.log('✅ Event prevented, starting save process...');

    // Determine which form was submitted
    const submittedForm = event.target;
    const isPageForm = submittedForm.id === 'newResidentFormPage';
    console.log('📝 Form submitted:', isPageForm ? 'PAGE FORM' : 'MODAL FORM', 'Form ID:', submittedForm.id);

    // CRITICAL: Check if we're editing by looking at form title
    const formTitlePage = document.querySelector('#addResidentFormPage h3');
    const formTitleModal = document.querySelector('#addResidentForm h3');
    const isEditMode = (formTitlePage && formTitlePage.textContent.includes('Edit')) ||
                       (formTitleModal && formTitleModal.textContent.includes('Edit'));

    // If form says "Edit" but editingResidentId is null, try to recover it from form data attribute
    if (isEditMode && (!editingResidentId || editingResidentId === null || editingResidentId === undefined)) {
        console.error('⚠️ CRITICAL: Form is in edit mode but editingResidentId is missing! Trying to recover...');
        const residentFormPageEl = document.getElementById('addResidentFormPage');
        const residentFormModalEl = document.getElementById('addResidentForm');
        const backupId = residentFormPageEl?.dataset.editingId || residentFormModalEl?.dataset.editingId;
        if (backupId) {
            editingResidentId = parseInt(backupId);
            console.log('✅ Recovered editingResidentId from form:', editingResidentId);
        } else {
            console.error('❌ Cannot recover editingResidentId!');
            showMessage('Error: Cannot determine which resident to update. Please try again. / Error: No se puede determinar qué residente actualizar. Por favor intente de nuevo.', 'error');
            return;
        }
    }

    console.log('=== SAVING RESIDENT ===');
    console.log('Form edit mode detected:', isEditMode);
    console.log('editingResidentId:', editingResidentId, typeof editingResidentId);

    // Use the form that was actually submitted (from event.target)
    const usePageForm = isPageForm;

    console.log('🔍 Using form:', usePageForm ? 'PAGE FORM' : 'MODAL FORM');

    // Get values from the form that was submitted
    const firstNameModal = document.getElementById('newFirstName');
    const firstNamePage = document.getElementById('newFirstNamePage');
    const firstNameEl = usePageForm ? firstNamePage : firstNameModal;

    console.log('🔍 FORM ELEMENT CHECK:');
    console.log('  Modal firstName element:', firstNameModal, 'Value:', firstNameModal?.value);
    console.log('  Page firstName element:', firstNamePage, 'Value:', firstNamePage?.value);
    console.log('  Using form:', usePageForm ? 'PAGE' : 'MODAL');
    console.log('  Selected firstName element:', firstNameEl, 'Value:', firstNameEl?.value);

    const lastNameModal = document.getElementById('newLastName');
    const lastNamePage = document.getElementById('newLastNamePage');
    const lastNameEl = usePageForm ? lastNamePage : lastNameModal;

    console.log('  Modal lastName element:', lastNameModal, 'Value:', lastNameModal?.value);
    console.log('  Page lastName element:', lastNamePage, 'Value:', lastNamePage?.value);
    console.log('  Selected lastName element:', lastNameEl, 'Value:', lastNameEl?.value);
    // Get other fields from the form that was submitted
    const genderEl = usePageForm ? document.getElementById('newGenderPage') : document.getElementById('newGender');
    const roomEl = usePageForm ? document.getElementById('newRoomNumberPage') : document.getElementById('newRoomNumber');
    const bedEl = usePageForm ? document.getElementById('newBedNumberPage') : document.getElementById('newBedNumber');
    const emergencyEl = usePageForm ? document.getElementById('newEmergencyContactPage') : document.getElementById('newEmergencyContact');
    const phoneEl = usePageForm ? document.getElementById('newEmergencyPhonePage') : document.getElementById('newEmergencyPhone');

    // Get carrier element - try multiple methods to find it
    let carrierEl = null;
    const primaryId = usePageForm ? 'newEmergencyCarrierPage' : 'newEmergencyCarrier';
    const fallbackId = usePageForm ? 'newEmergencyCarrier' : 'newEmergencyCarrierPage';

    // Try getElementById first
    carrierEl = document.getElementById(primaryId);

    // Fallback 1: Try the other form's ID
    if (!carrierEl) {
        carrierEl = document.getElementById(fallbackId);
        if (carrierEl) {
            console.warn('⚠️ Carrier element found using fallback ID:', fallbackId);
        }
    }

    // Fallback 2: Try querySelector with both IDs
    if (!carrierEl) {
        carrierEl = document.querySelector(`#${primaryId}`);
        if (carrierEl) {
            console.warn('⚠️ Carrier element found using querySelector:', primaryId);
        }
    }

    // Fallback 3: Try querySelector with fallback ID
    if (!carrierEl) {
        carrierEl = document.querySelector(`#${fallbackId}`);
        if (carrierEl) {
            console.warn('⚠️ Carrier element found using querySelector fallback:', fallbackId);
        }
    }

    // Fallback 4: Try querySelector with just the select element and check if it's the right one
    if (!carrierEl) {
        const allSelects = document.querySelectorAll('select[id*="EmergencyCarrier"]');
        console.log('🔍 Found select elements with "EmergencyCarrier" in ID:', allSelects.length);
        if (allSelects.length > 0) {
            carrierEl = allSelects[0]; // Use the first one found
            console.warn('⚠️ Carrier element found using querySelector pattern:', carrierEl.id);
        }
    }

    // Final check - if still not found, log detailed error
    if (!carrierEl) {
        console.error('❌ CRITICAL: Carrier element NOT FOUND using any method!');
        console.error('   Primary ID searched:', primaryId);
        console.error('   Fallback ID searched:', fallbackId);
        console.error('   All selects in document:', document.querySelectorAll('select').length);
        console.error('   All elements with "Carrier" in ID:', Array.from(document.querySelectorAll('[id*="Carrier"]')).map(el => el.id));
    }

    const relationEl = usePageForm ? document.getElementById('newEmergencyRelationPage') : document.getElementById('newEmergencyRelation');
    const emailEl = usePageForm ? document.getElementById('newEmergencyEmailPage') : document.getElementById('newEmergencyEmail');
    const conditionsEl = usePageForm ? document.getElementById('newMedicalConditionsPage') : document.getElementById('newMedicalConditions');
    const allergiesEl = usePageForm ? document.getElementById('newAllergiesPage') : document.getElementById('newAllergies');
    const dietaryEl = usePageForm ? document.getElementById('newDietaryRestrictionsPage') : document.getElementById('newDietaryRestrictions');

    // Get date from the form that was submitted
    let dateOfBirth = null;
    if (usePageForm) {
        const yearPage = document.getElementById('newBirthYearPage');
        const monthPage = document.getElementById('newBirthMonthPage');
        const dayPage = document.getElementById('newBirthDayPage');
        if (yearPage && monthPage && dayPage) {
            dateOfBirth = getDateFromDropdowns('newBirthYearPage', 'newBirthMonthPage', 'newBirthDayPage');
        }
    } else {
        const yearModal = document.getElementById('newBirthYear');
        const monthModal = document.getElementById('newBirthMonth');
        const dayModal = document.getElementById('newBirthDay');
        if (yearModal && monthModal && dayModal) {
            dateOfBirth = getDateFromDropdowns('newBirthYear', 'newBirthMonth', 'newBirthDay');
        }
    }

    // Get photo from the form that was submitted
    const photoData = usePageForm ? residentPhotoDataPage : residentPhotoData;

    // Validate required fields
    console.log('🔍 Validating fields...');
    console.log('First name element:', firstNameEl, 'Value:', firstNameEl?.value, 'Trimmed:', firstNameEl?.value?.trim());
    console.log('Last name element:', lastNameEl, 'Value:', lastNameEl?.value, 'Trimmed:', lastNameEl?.value?.trim());

    // Log form visibility for debugging
    const modalForm = document.getElementById('addResidentForm');
    const pageForm = document.getElementById('addResidentFormPage');
    console.log('Modal form display:', modalForm?.style.display, 'Visible:', modalForm?.offsetParent !== null);
    console.log('Page form display:', pageForm?.style.display, 'Visible:', pageForm?.offsetParent !== null);

    if (!firstNameEl) {
        console.error('❌ First name element NOT FOUND! Neither modal nor page element exists!');
        showMessage('First Name field not found. Please refresh the page. / Campo de nombre no encontrado. Por favor recargue la página.', 'error');
        return;
    }

    if (!firstNameEl.value || !firstNameEl.value.trim()) {
        console.error('❌ First name is missing or empty!');
        console.error('   Element:', firstNameEl);
        console.error('   Raw value:', firstNameEl.value);
        console.error('   Trimmed value:', firstNameEl.value?.trim());
        console.error('   Value length:', firstNameEl.value?.length);
        showMessage('First Name is required / El nombre es requerido', 'error');
        return;
    }

    if (!lastNameEl || !lastNameEl.value.trim()) {
        console.error('❌ Last name is missing!');
        showMessage('Last Name is required / El apellido es requerido', 'error');
        return;
    }

    console.log('✅ Validation passed!');

    // Get insurance fields if they exist (these fields may not exist in the form)
    const insuranceProviderEl = usePageForm ? document.getElementById('newInsuranceProviderPage') : document.getElementById('newInsuranceProvider');
    const insuranceNumberEl = usePageForm ? document.getElementById('newInsuranceNumberPage') : document.getElementById('newInsuranceNumber');
    const notesEl = usePageForm ? document.getElementById('newNotesPage') : document.getElementById('newNotes');

    // Get carrier value and log it for debugging (carrierEl already declared above at line 1551)
    // IMPORTANT: Get the raw value first, then normalize
    let carrierValue = null;

    // SIMPLE LOGGING - will show even with cached code
    console.log('🔍 SIMPLE CARRIER CHECK - carrierEl exists?', !!carrierEl);
    if (carrierEl) {
        console.log('🔍 SIMPLE CARRIER CHECK - element.value:', carrierEl.value);
        console.log('🔍 SIMPLE CARRIER CHECK - element.id:', carrierEl.id);
        carrierValue = carrierEl.value; // Get raw value (could be empty string)
        // Normalize: empty string becomes null, but preserve actual values like 'claro'
        if (carrierValue === '') {
            carrierValue = null;
        }
        console.log('🔍 SIMPLE CARRIER CHECK - final carrierValue:', carrierValue);
    } else {
        console.error('❌ SIMPLE CARRIER CHECK - carrierEl is NULL! Element not found!');
    }

    // VERY VISIBLE LOGGING - CARRIER FIELD
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚨🚨🚨 CARRIER FIELD DEBUGGING 🚨🚨🚨');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 usePageForm:', usePageForm);
    console.log('🔍 Carrier element ID searched:', usePageForm ? 'newEmergencyCarrierPage' : 'newEmergencyCarrier');
    console.log('🔍 Carrier element found:', carrierEl ? 'YES ✅' : 'NO ❌ - ELEMENT NOT FOUND!');
    if (carrierEl) {
        console.log('🔍 Raw carrier element value:', JSON.stringify(carrierEl.value));
        console.log('🔍 Carrier element selectedIndex:', carrierEl.selectedIndex);
        console.log('🔍 Carrier element selected option text:', carrierEl.options[carrierEl.selectedIndex]?.text);
        console.log('🔍 Carrier element options:', Array.from(carrierEl.options).map(opt => ({value: opt.value, text: opt.text})));
    }
    console.log('🔍 FINAL CARRIER VALUE TO SAVE:', JSON.stringify(carrierValue));
    console.log('═══════════════════════════════════════════════════════');

    // FINAL CHECK: Re-read carrier value directly from element right before creating object
    let finalCarrierValue = carrierValue;
    if (carrierEl) {
        const currentValue = carrierEl.value;
        console.log('🔍 FINAL CHECK - Re-reading carrier from element:', currentValue);
        console.log('🔍 FINAL CHECK - Element selectedIndex:', carrierEl.selectedIndex);
        console.log('🔍 FINAL CHECK - Selected option:', carrierEl.options[carrierEl.selectedIndex]?.text || 'None');
        if (currentValue !== carrierValue) {
            console.warn('⚠️ Carrier value changed! Was:', carrierValue, 'Now:', currentValue);
            finalCarrierValue = currentValue === '' ? null : currentValue;
        } else {
            finalCarrierValue = carrierValue;
        }
    } else {
        console.error('❌ FINAL CHECK - carrierEl is NULL, cannot re-read value!');
    }

    const resident = {
        first_name: firstNameEl.value.trim(),
        last_name: lastNameEl.value.trim(),
        date_of_birth: dateOfBirth || null,
        gender: genderEl ? genderEl.value : '',
        room_number: roomEl ? roomEl.value : '',
        bed_number: bedEl ? bedEl.value : '',
        emergency_contact_name: emergencyEl ? emergencyEl.value : '',
        emergency_contact_phone: phoneEl ? phoneEl.value : '',
        // CRITICAL: Use finalCarrierValue (re-read right before creating object)
        emergency_contact_carrier: finalCarrierValue !== undefined ? finalCarrierValue : null,
        emergency_contact_relation: relationEl ? relationEl.value : '',
        emergency_contact_email: emailEl ? emailEl.value : '',
        insurance_provider: insuranceProviderEl ? insuranceProviderEl.value : null,
        insurance_number: insuranceNumberEl ? insuranceNumberEl.value : null,
        medical_conditions: conditionsEl ? conditionsEl.value : '',
        allergies: allergiesEl ? allergiesEl.value : '',
        dietary_restrictions: dietaryEl ? dietaryEl.value : '',
        notes: notesEl ? notesEl.value : null,
        photo_path: photoData || null
    };

    console.log('📦 Resident data to save:', resident);
    console.log('📦 Carrier in resident object:', resident.emergency_contact_carrier);
    console.log('📦 Full resident JSON:', JSON.stringify(resident, null, 2));
    console.log('🔍 FINAL CHECK - emergency_contact_carrier in resident object:', resident.emergency_contact_carrier);
    console.log('Date of birth:', dateOfBirth);

    try {
        // Block save if not authenticated (prevents confusing 401 loops)
        if (!authToken || !currentStaff) {
            showMessage('Authentication required. Please log in again / Autenticación requerida. Por favor inicie sesión nuevamente', 'error');
            checkAuth();
            return;
        }

        // Store editingResidentId in a local variable to prevent it from being lost
        const currentEditingId = editingResidentId;
        const isEditing = currentEditingId && currentEditingId !== null && currentEditingId !== undefined && currentEditingId !== 0;

        console.log('=== SAVING RESIDENT ===');
        console.log('editingResidentId (global):', editingResidentId, typeof editingResidentId);
        console.log('currentEditingId (local):', currentEditingId, typeof currentEditingId);
        console.log('isEditing:', isEditing);
        console.log('Resident data being sent:', resident);

        let response;
        if (isEditing) {
            // Update existing resident
            console.log('🔄 UPDATING resident with ID:', currentEditingId);
            console.log('═══════════════════════════════════════════════════════');
            console.log('🚨🚨🚨 CARRIER IN REQUEST 🚨🚨🚨');
            console.log('📤 emergency_contact_carrier:', JSON.stringify(resident.emergency_contact_carrier));
            console.log('📤 emergency_contact_carrier type:', typeof resident.emergency_contact_carrier);
            console.log('📤 FULL JSON BEING SENT:');
            console.log(JSON.stringify(resident, null, 2));
            console.log('═══════════════════════════════════════════════════════');

            // CRITICAL DEBUG: Check carrier element one more time RIGHT BEFORE sending
            const lastChanceCarrierEl = document.getElementById('newEmergencyCarrierPage') || document.getElementById('newEmergencyCarrier');
            if (lastChanceCarrierEl) {
                const lastChanceValue = lastChanceCarrierEl.value;
                console.log('🚨🚨🚨 LAST CHANCE CHECK BEFORE SEND 🚨🚨🚨');
                console.log('📱 Carrier element found:', lastChanceCarrierEl.id);
                console.log('📱 Carrier element value:', lastChanceValue);
                console.log('📱 Current resident.emergency_contact_carrier:', resident.emergency_contact_carrier);
                if (lastChanceValue && lastChanceValue !== resident.emergency_contact_carrier) {
                    console.warn('⚠️⚠️⚠️ CARRIER VALUE MISMATCH! Updating resident object!');
                    resident.emergency_contact_carrier = lastChanceValue === '' ? null : lastChanceValue;
                    console.log('📱 Updated resident.emergency_contact_carrier to:', resident.emergency_contact_carrier);
                }
            } else {
                console.error('❌❌❌ LAST CHANCE: Carrier element NOT FOUND!');
            }

            response = await fetch(`/api/residents/${currentEditingId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(resident)
            });

            console.log('Update response status:', response.status);
            console.log('Update response headers:', response.headers);
        } else {
            // Create new resident
            console.log('➕ CREATING new resident');
            console.log('POST URL:', '/api/residents');
            console.log('Headers:', getAuthHeaders());
            console.log('Resident data:', resident);

            try {
                response = await fetch('/api/residents', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(resident)
                });

                console.log('✅ Create response received! Status:', response.status, response.statusText);
            } catch (fetchError) {
                console.error('❌ Fetch error:', fetchError);
                showMessage(`Network error: ${fetchError.message}. Is the server running? / Error de red: ${fetchError.message}. ¿Está corriendo el servidor?`, 'error');
                return;
            }
        }

        if (response.ok) {
            const result = await response.json().catch(() => ({}));
            console.log('✅ Save successful! Response:', result);
            console.log('Was editing:', isEditing, 'ID:', currentEditingId);
            showMessage(isEditing
                ? 'Resident updated successfully! / ¡Residente actualizado exitosamente!'
                : 'Resident added successfully! / ¡Residente agregado exitosamente!', 'success');

            // Clear editing state AFTER successful save
            editingResidentId = null;
            hideAddResidentForm();

            loadResidentsForSelector();
            if (document.getElementById('residents').classList.contains('active')) {
                loadResidents();
            }
        } else {
            // Handle auth errors consistently across the app
            if (response.status === 401) {
                console.error('Authentication failed - token expired or invalid');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                authToken = null;
                currentStaff = null;
                checkAuth();
                return;
            }

            // Read error response once
            let errorMsg = '';
            try {
                const errorText = await response.text();
                console.error('❌ Server error response:', response.status, response.statusText);
                console.error('Error response text:', errorText);

                // Try to parse as JSON
                try {
                    const errorData = JSON.parse(errorText);
                    errorMsg = errorData.error || errorData.message || errorText;
                } catch {
                    errorMsg = errorText || (isEditing ? 'Error updating resident / Error al actualizar residente' : 'Error adding resident / Error al agregar residente');
                }
            } catch (parseError) {
                console.error('Error reading error response:', parseError);
                errorMsg = isEditing ? 'Error updating resident / Error al actualizar residente' : 'Error adding resident / Error al agregar residente';
            }
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error saving resident:', error);
        showMessage(`Error saving resident: ${error.message} / Error al guardar residente: ${error.message}`, 'error');
    }
}

function initApp() {
    // Always re-show the app shell after login. Login flow hides #mainApp.
    const mainAppEl = document.getElementById('mainApp');
    if (mainAppEl) mainAppEl.style.display = 'block';

    // Navbar is position:fixed; if we calculated --sticky-offset while #mainApp was hidden,
    // it may be 0 and pages will render under the header (especially on mobile).
    // Recalculate after showing the app shell.
    try {
        if (typeof window.updateStickyHeaderOffset === 'function') {
            window.updateStickyHeaderOffset();
            requestAnimationFrame(() => window.updateStickyHeaderOffset());
            setTimeout(() => window.updateStickyHeaderOffset(), 150);
        }
    } catch (e) {
        // ignore
    }

    // If already initialized, avoid re-registering handlers/intervals.
    if (appInitialized) {
        // Ensure the user sees an active page instead of a blank container
        try {
            const activePage = document.querySelector('.page.active');
            if (!activePage) {
                showPage('dashboard');
            }
        } catch (e) {
            // ignore
        }
        return;
    }

    installLanguageObserver();
    appInitialized = true;

    console.log('🚀 Initializing app...');

    // Test server connection
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            console.log('✅ Server health check:', data);
        })
        .catch(error => {
            console.error('❌ Server health check failed:', error);
            showMessage('Warning: Cannot connect to server / Advertencia: No se puede conectar al servidor', 'error');
        });

    // #mainApp already set above; keep it visible
    if (typeof window.updateStickyHeaderOffset === 'function') {
        window.requestAnimationFrame(() => window.updateStickyHeaderOffset());
    }
    initNavigation();
    applyModuleSettings();
    loadDashboard();
    updateClock();
    setInterval(updateClock, 1000);
    initializeCalendarControls();
    initQuickWins();

    console.log('✅ App initialized');

    // Add resize handler to fix dashboard grid layout
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const activePage = document.querySelector('.page.active');
            if (!activePage) return;

            const statsGrid = activePage.querySelector('.stats-grid');
            if (!statsGrid) return;

            const width = window.innerWidth;
            if (width >= 1025) {
                statsGrid.style.setProperty('grid-template-columns', 'repeat(3, 1fr)', 'important');
            } else if (width >= 769) {
                statsGrid.style.setProperty('grid-template-columns', 'repeat(2, 1fr)', 'important');
            } else if (width >= 481) {
                statsGrid.style.setProperty('grid-template-columns', 'repeat(2, 1fr)', 'important');
            } else {
                statsGrid.style.setProperty('grid-template-columns', '1fr', 'important');
            }
            statsGrid.style.setProperty('display', 'grid', 'important');
        }, 250);
    });
}

// Quick Wins Features
function initQuickWins() {
    // Show search and quick actions when logged in
    const searchContainer = document.getElementById('searchContainer');
    const quickActions = document.querySelector('.quick-actions-nav');
    if (searchContainer) searchContainer.style.display = 'flex';
    if (quickActions) quickActions.style.display = 'flex';

    // Initialize dark mode from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }

    // Setup search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleGlobalSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }

    // Setup keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Search Functionality
let searchResults = [];
let searchTimeout = null;

async function handleGlobalSearch(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('clearSearchBtn');

    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }

    if (query.length < 2) {
        hideSearchResults();
        return;
    }

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

async function performSearch(query) {
    try {
        searchResults = [];
        const lowerQuery = query.toLowerCase();

        // Search residents
        try {
            const residentsRes = await fetch('/api/residents', { headers: getAuthHeaders() });
            if (residentsRes.ok) {
                const residents = await residentsRes.json();
                residents.forEach(r => {
                    const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
                    if (name.includes(lowerQuery) || (r.room_number && r.room_number.toLowerCase().includes(lowerQuery))) {
                        searchResults.push({
                            type: 'resident',
                            id: r.id,
                            title: `${r.first_name} ${r.last_name}`,
                            details: `Room: ${r.room_number || 'N/A'} | DOB: ${r.date_of_birth || 'N/A'}`,
                            action: () => {
                                localStorage.setItem('currentResidentId', r.id);
                                loadCurrentResidentInfo(r.id);
                                showPage('residents');
                                clearSearch();
                            }
                        });
                    }
                });
            }
        } catch (e) { console.error('Error searching residents:', e); }

        // Search medications
        if (currentResidentId) {
            try {
                const medsRes = await fetch(`/api/medications?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
                if (medsRes.ok) {
                    const medications = await medsRes.json();
                    medications.forEach(m => {
                        if (m.name.toLowerCase().includes(lowerQuery) || (m.dosage && m.dosage.toLowerCase().includes(lowerQuery))) {
                            searchResults.push({
                                type: 'medication',
                                id: m.id,
                                title: m.name,
                                details: `Dosage: ${m.dosage} | Frequency: ${m.frequency}`,
                                action: () => {
                                    showPage('medications');
                                    clearSearch();
                                }
                            });
                        }
                    });
                }
            } catch (e) { console.error('Error searching medications:', e); }
        }

        // Search appointments
        if (currentResidentId) {
            try {
                const appsRes = await fetch(`/api/appointments?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
                if (appsRes.ok) {
                    const appointments = await appsRes.json();
                    appointments.forEach(a => {
                        const title = (a.title || '').toLowerCase();
                        const notes = (a.notes || '').toLowerCase();
                        if (title.includes(lowerQuery) || notes.includes(lowerQuery)) {
                            searchResults.push({
                                type: 'appointment',
                                id: a.id,
                                title: a.title || 'Appointment',
                                details: `Date: ${a.appointment_date || 'N/A'} | Time: ${a.appointment_time || 'N/A'}`,
                                action: () => {
                                    showPage('appointments');
                                    clearSearch();
                                }
                            });
                        }
                    });
                }
            } catch (e) { console.error('Error searching appointments:', e); }
        }

        displaySearchResults();
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;

    // Remove existing results
    const existing = document.getElementById('searchResults');
    if (existing) existing.remove();

    if (searchResults.length === 0) {
        return;
    }

    // Create results container
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'searchResults';
    resultsDiv.className = 'search-results';

    searchResults.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <div class="search-result-type">${result.type.toUpperCase()}</div>
            <div class="search-result-title">${result.title}</div>
            <div class="search-result-details">${result.details}</div>
        `;
        item.addEventListener('click', result.action);
        resultsDiv.appendChild(item);
    });

    // Insert after search container
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(resultsDiv);
    }
}

function hideSearchResults() {
    const results = document.getElementById('searchResults');
    if (results) results.remove();
}

function clearSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.value = '';
        searchInput.blur();
    }
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    hideSearchResults();
    searchResults = [];
}

// Dark Mode
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeIcon(isDark);
}

function updateDarkModeIcon(isDark) {
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        toggle.textContent = isDark ? '☀️' : '🌙';
        toggle.title = isDark ? 'Light Mode / Modo Claro' : 'Dark Mode / Modo Oscuro';
    }
}

// Print Functionality
function printCurrentPage() {
    window.print();
}

// Export to PDF
function exportToPDF(title, content) {
    if (typeof window.jspdf === 'undefined') {
        showMessage('PDF library not loaded. Please refresh the page. / Biblioteca PDF no cargada. Por favor recargue la página.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Add content (simple text for now)
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 14, 30);

    // Save
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    showMessage('PDF exported successfully / PDF exportado exitosamente', 'success');
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(event) {
    // Don't trigger if typing in input/textarea
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        if (event.key === '/' && event.target.id !== 'globalSearch') {
            event.preventDefault();
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) searchInput.focus();
        }
        return;
    }

    // Focus search with /
    if (event.key === '/') {
        event.preventDefault();
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) searchInput.focus();
    }

    // Close modals with Esc
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display !== 'none' && modal.id !== 'loginModal') {
                modal.style.display = 'none';
            }
        });
        clearSearch();
    }

    // Print with Ctrl/Cmd + P
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        printCurrentPage();
    }

    // Toggle dark mode with Ctrl/Cmd + D
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        toggleDarkMode();
    }

    // Number shortcuts for navigation
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const shortcuts = {
            '1': 'dashboard',
            '2': 'residents',
            '3': 'medications',
            '4': 'appointments',
            '5': 'vitalsigns',
            '6': 'calendar',
            '7': 'billing'
        };

        if (shortcuts[event.key]) {
            event.preventDefault();
            showPage(shortcuts[event.key]);
            // Update active nav link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === shortcuts[event.key]) {
                    link.classList.add('active');
                }
            });
            if (typeof window.updateStickyHeaderOffset === 'function') {
                window.requestAnimationFrame(() => window.updateStickyHeaderOffset());
            }
        }
    }

    // Show shortcuts help with ?
    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        showKeyboardShortcuts();
    }
}

function showKeyboardShortcuts() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.style.display = 'flex';
}

function hideKeyboardShortcuts() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.style.display = 'none';
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    const clockEl = document.getElementById('liveClock');
    if (clockEl) clockEl.textContent = timeString;
}

// Mobile menu toggle function (global for onclick handler)
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
        console.log('🍔 Mobile menu toggled, active:', navMenu.classList.contains('active'));

        // Navbar height can change when menu expands; keep the content offset in sync.
        try {
            if (typeof window.updateStickyHeaderOffset === 'function') {
                window.updateStickyHeaderOffset();
                requestAnimationFrame(() => window.updateStickyHeaderOffset());
            }
        } catch (e) {
            // ignore
        }
    } else {
        console.error('❌ navMenu element not found!');
    }
}

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Logout link has no data-page and uses onclick handler; don't route it through showPage
            if (link.classList.contains('logout-link')) {
                return;
            }
            const page = link.dataset.page;
            if (!page) {
                console.warn('Nav link clicked without data-page; skipping showPage', link);
                return;
            }

            if (!isPageEnabled(page)) {
                showMessage('This area is disabled in Settings / Esta área está deshabilitada en Configuración', 'error');
                return;
            }
            showPage(page);

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Close mobile menu when a link is clicked
            if (navMenu) navMenu.classList.remove('active');
        });
    });

    // Add event listener to menu toggle button (backup to onclick)
    if (menuToggle && navMenu) {
        // Avoid double-toggling when the button already has an inline onclick handler.
        // On mobile, both handlers firing would toggle twice and appear to do nothing.
        const hasInlineOnClick = !!menuToggle.getAttribute('onclick');
        if (!hasInlineOnClick) {
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMobileMenu();
            });
        }
    }
}

// Make showPage globally accessible - CRITICAL FUNCTION
function showPage(pageName) {
	// Guard against re-entrancy / rapid repeated calls (Safari can trigger duplicate events)
	const now = Date.now();
	const activePageEl = document.querySelector('.page.active');
	const fromPageName = activePageEl ? activePageEl.id : null;
	if (activePageEl && activePageEl.id === pageName) {
		return;
	}
	if (showPageInProgress) {
		return;
	}
	if (lastShowPageName === pageName && (now - lastShowPageAt) < 600) {
		return;
	}
	showPageInProgress = true;
	lastShowPageName = pageName;
	lastShowPageAt = now;
	setTrainingModeIndicator(pageName === 'training' || currentResidentIsTraining);

	try {
		if (!isPageEnabled(pageName)) {
			showMessage('This area is disabled in Settings / Esta área está deshabilitada en Configuración', 'error');
			return;
		}
		if (pageName === 'history') {
			console.log('🧵 showPage(history) call stack:');
			try {
				console.trace('showPage(history)');
			} catch (e) {
				// ignore
			}
		}
        console.log('%c📄📄📄 showPage() CALLED with: ' + pageName + ' 📄📄📄', 'background: #FF6B6B; color: white; font-size: 18px; font-weight: bold; padding: 10px;');
        console.log('📄 Current URL:', window.location.href);
        console.log('📄 Timestamp:', new Date().toISOString());

        const scrollYBefore = window.scrollY;

    const debugLayout = (label, el) => {
        try {
            if (!el) {
                console.log(`🧭 LayoutDebug ${label}: <null>`);
                return;
            }
            const cs = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            console.log(`🧭 LayoutDebug ${label}:`, {
                tag: el.tagName,
                id: el.id || null,
                className: el.className || null,
                display: cs.display,
                visibility: cs.visibility,
                opacity: cs.opacity,
                position: cs.position,
                overflow: cs.overflow,
                overflowX: cs.overflowX,
                overflowY: cs.overflowY,
                height: cs.height,
                width: cs.width,
                minHeight: cs.minHeight,
                minWidth: cs.minWidth,
                maxHeight: cs.maxHeight,
                maxWidth: cs.maxWidth,
                transform: cs.transform,
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            });
        } catch (e) {
            console.error(`🧭 LayoutDebug ${label} error:`, e);
        }
    };

    const resetLayoutStyles = (el) => {
        if (!el) return;
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
        el.style.removeProperty('position');
        el.style.removeProperty('left');
        el.style.removeProperty('right');
        el.style.removeProperty('top');
        el.style.removeProperty('bottom');
        el.style.removeProperty('transform');
        el.style.removeProperty('height');
        el.style.removeProperty('max-height');
        el.style.removeProperty('min-height');
        el.style.removeProperty('width');
        el.style.removeProperty('max-width');
        el.style.removeProperty('overflow');
        el.style.removeProperty('z-index');
    };

        if (!pageName) {
            console.error('❌ showPage called with no pageName!');
            return;
        }

    const pages = document.querySelectorAll('.page');
    console.log('📄 Found', pages.length, 'pages in DOM');

    // CRITICAL: Hide ALL pages first. Avoid offscreen absolute positioning; Safari can keep 0x0 layouts.
    pages.forEach(page => {
        if (page.id !== pageName) {
            // SPECIAL: Don't hide financial page if we're showing it
            if (page.id === 'financial' && pageName === 'financial') {
                return;
            }
            page.classList.remove('active');
            // Hide only via display/visibility; clear any positional hacks.
            page.style.setProperty('display', 'none', 'important');
            page.style.setProperty('visibility', 'hidden', 'important');
            page.style.setProperty('opacity', '0', 'important');
            page.style.removeProperty('position');
            page.style.removeProperty('left');
            page.style.removeProperty('top');
            page.style.removeProperty('right');
            page.style.removeProperty('bottom');
            page.style.removeProperty('transform');
            page.style.removeProperty('z-index');
        }
    });

    // CRITICAL: Ensure mainApp is visible first
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        const mainAppDisplay = window.getComputedStyle(mainApp).display;
        if (mainAppDisplay === 'none') {
            console.log('⚠️ mainApp is hidden - forcing visibility');
            mainApp.style.setProperty('display', 'block', 'important');
            mainApp.style.setProperty('visibility', 'visible', 'important');
            mainApp.style.setProperty('opacity', '1', 'important');
        }
    }

    // Navbar is position: fixed; ensure the content offset is correct after making #mainApp visible.
    // This prevents the header from overlapping the first card on mobile when the offset was computed
    // while the app shell was hidden (display:none).
    try {
        if (typeof window.updateStickyHeaderOffset === 'function') {
            window.updateStickyHeaderOffset();
            requestAnimationFrame(() => window.updateStickyHeaderOffset());
            setTimeout(() => {
                try {
                    window.updateStickyHeaderOffset();
                } catch (e) {
                    // ignore
                }
            }, 150);
        }
    } catch (e) {
        // ignore
    }

        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            // CRITICAL: If any page is accidentally nested inside another `.page`, it will inherit
            // display:none when showPage hides non-active pages, resulting in 0x0 layouts.
            // Move the page back under main.container (same approach as the reports page fix).
            try {
                const mainContainerForPages = document.querySelector('#mainApp > main.container') || document.querySelector('main.container');
                if (mainContainerForPages && targetPage.parentElement && targetPage.parentElement.classList && targetPage.parentElement.classList.contains('page')) {
                    const ancestorChain = [];
                    let p = targetPage.parentElement;
                    let guard = 0;
                    while (p && guard < 12) {
                        ancestorChain.push({
                            tag: p.tagName,
                            id: p.id || null,
                            className: p.className || null
                        });
                        if (p.id === 'mainApp') break;
                        p = p.parentElement;
                        guard++;
                    }

                    console.warn('⚠️⚠️⚠️ CRITICAL: Page is nested inside another .page. Moving it out...', {
                        pageName,
                        currentParentId: targetPage.parentElement.id || null,
                        currentParentClass: targetPage.parentElement.className || null,
                        ancestorChain
                    });
                    mainContainerForPages.appendChild(targetPage);
                    console.log('✅ Page moved to main.container. New parent:', targetPage.parentElement?.tagName, targetPage.parentElement?.className);
                }
            } catch (e) {
                console.error('Error while ensuring page is not nested:', e);
            }

            targetPage.classList.add('active');

            resetLayoutStyles(targetPage);

            if (pageName === 'financial') {
                targetPage.style.setProperty('margin-top', '0', 'important');
                targetPage.style.setProperty('padding-top', '2rem', 'important');
            }

            // CRITICAL: Force ALL parent elements visible (same as incidents page fix)
            let currentElement = targetPage;
            let level = 0;
            while (currentElement && level < 10) {
                const computedStyle = window.getComputedStyle(currentElement);
                const display = computedStyle.display;
                const visibility = computedStyle.visibility;
                const opacity = computedStyle.opacity;

                // Skip billing page if this page is inside it (shouldn't happen, but just in case)
                if (currentElement.id === 'billing' && pageName !== 'billing') {
                    currentElement = currentElement.parentElement;
                    level++;
                    continue;
                }

                // Fix any parent with display:none (except intentionally hidden elements)
                if (display === 'none' && currentElement.id !== 'loginModal' && currentElement.id !== 'residentSelector' && currentElement.id !== 'incidentForm' && currentElement.id !== 'billForm' && currentElement.id !== 'paymentForm') {
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                }

                // Also fix if visibility is hidden or opacity is 0
                if ((visibility === 'hidden' || opacity === '0') && currentElement.id !== 'loginModal' && currentElement.id !== 'residentSelector' && currentElement.id !== 'incidentForm' && currentElement.id !== 'billForm' && currentElement.id !== 'paymentForm') {
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('display', 'block', 'important');
                }

                // Stop at mainApp
                if (currentElement.id === 'mainApp') {
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                    break;
                }

                currentElement = currentElement.parentElement;
                level++;
            }

            // Also ensure main.container is visible
            const mainContainer = targetPage.closest('main.container');
            if (mainContainer) {
                resetLayoutStyles(mainContainer);
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('opacity', '1', 'important');
                mainContainer.style.setProperty('position', 'relative', 'important');
                mainContainer.style.setProperty('width', '100%', 'important');
                mainContainer.style.setProperty('min-height', '1px', 'important');
            }

            // Only show the target page with !important
            targetPage.style.setProperty('display', 'block', 'important');
            targetPage.style.setProperty('visibility', 'visible', 'important');
            targetPage.style.setProperty('opacity', '1', 'important');

            // For financial page, ensure it stays visible
            if (pageName === 'financial') {
                targetPage.style.setProperty('position', 'relative', 'important');
                targetPage.style.setProperty('z-index', '10', 'important');
            }

            // SPECIAL HANDLING FOR REPORTS PAGE - reset any leftover offscreen/absolute styles
            if (pageName === 'reports') {
                // If reports is nested under a page that can be hidden (e.g., billing/financial), move it out.
                const reportsPage = document.getElementById('reports');
                const billingPage = document.getElementById('billing');
                const mainContainerForPages = document.querySelector('#mainApp > main.container') || document.querySelector('main.container');

                // Force reports to be a direct child of main.container.
                // If it isn't, it can end up far below due to intervening layout/containers.
                try {
                    if (mainContainerForPages && reportsPage && reportsPage.parentElement !== mainContainerForPages) {
                        mainContainerForPages.appendChild(reportsPage);
                    }
                } catch (e) {
                    // ignore
                }
                if (reportsPage && billingPage && reportsPage.parentElement && reportsPage.parentElement.id === 'billing') {
                    console.log('⚠️⚠️⚠️ CRITICAL: Reports page is INSIDE billing page! Moving it out...');
                    const mainContainer = billingPage.parentElement; // Should be main.container
                    if (mainContainer) {
                        mainContainer.insertBefore(reportsPage, billingPage.nextSibling);
                        console.log('✅ Reports page moved out of billing page');
                        console.log('✅ New parent:', reportsPage.parentElement?.tagName, reportsPage.parentElement?.id);
                    }
                }

                // Ensure reports is at the top of the page stack inside main.container.
                // This prevents any preceding sibling from creating a large layout offset above reports.
                try {
                    if (mainContainerForPages && reportsPage && mainContainerForPages.contains(reportsPage)) {
                        mainContainerForPages.insertBefore(reportsPage, mainContainerForPages.firstChild);
                    }
                } catch (e) {
                    // ignore
                }

                // Force reports page visible using cssText for maximum control (Safari can keep it at 0x0 otherwise)
                targetPage.classList.add('active');
                targetPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; background: var(--light-gray) !important; overflow: visible !important;';

                // Ensure the Reports title exists and is visible
                try {
                    let titleEl = reportsPage ? reportsPage.querySelector('h2') : null;
                    if (!titleEl && reportsPage) {
                        titleEl = document.createElement('h2');
                        titleEl.setAttribute('data-translate', 'nav.reports');
                        titleEl.textContent = 'Reports';
                        reportsPage.insertBefore(titleEl, reportsPage.firstChild);
                    }
                    if (titleEl && (!titleEl.textContent || !titleEl.textContent.trim())) {
                        titleEl.textContent = 'Reports';
                    }
                    if (titleEl) {
                        titleEl.style.setProperty('display', 'block', 'important');
                        titleEl.style.setProperty('visibility', 'visible', 'important');
                        titleEl.style.setProperty('opacity', '1', 'important');
                        titleEl.style.setProperty('position', 'relative', 'important');
                        titleEl.style.setProperty('z-index', '11', 'important');
                    }
                } catch (e) {
                    // ignore
                }

                // Force a reflow so Safari recalculates dimensions
                void targetPage.offsetHeight;
            }
       }

        targetPage.style.setProperty('visibility', 'visible', 'important');
        targetPage.style.setProperty('display', 'block', 'important');
        targetPage.style.setProperty('opacity', '1', 'important');
        if (pageName !== 'history' && pageName !== 'reports') {
            targetPage.style.removeProperty('left'); // Remove left: -9999px if it was set
            targetPage.style.removeProperty('right'); // Remove any right positioning
        }
        if (pageName !== 'financial' && pageName !== 'carenotes') {
            targetPage.style.setProperty('z-index', '1', 'important');
        }

        // SPECIAL HANDLING FOR FINANCIAL PAGE - Force dimensions immediately
        if (pageName === 'financial') {
            targetPage.style.setProperty('min-height', '500px', 'important');
            targetPage.style.setProperty('width', '100%', 'important');
            targetPage.style.setProperty('padding', '2rem', 'important');
            // Force all children visible immediately
            Array.from(targetPage.children).forEach((child) => {
                if (child.tagName === 'SCRIPT') return;
                const display = child.classList.contains('button-group') ? 'flex' :
                              child.tagName === 'BUTTON' ? 'inline-block' : 'block';
                child.style.setProperty('display', display, 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('opacity', '1', 'important');
                if (child.tagName === 'H2') {
                    child.style.setProperty('min-height', '30px', 'important');
                } else if (child.tagName === 'P') {
                    child.style.setProperty('min-height', '20px', 'important');
                } else if (child.classList.contains('button-group')) {
                    child.style.setProperty('min-height', '50px', 'important');
                } else if (child.classList.contains('financial-tab')) {
                    child.style.setProperty('min-height', '300px', 'important');
                }
            });
        }


        // Force show ALL direct children
        Array.from(targetPage.children).forEach((child, index) => {
            // Skip forms that should be hidden initially
            if ((child.id === 'incidentForm' || child.id === 'billForm' || child.id === 'paymentForm' || child.id === 'careNoteForm') && child.style.display === 'none') {
                return;
            }
            // Skip script tags
            if (child.tagName === 'SCRIPT') {
                return;
            }
            // Determine correct display value
            let displayValue = 'block';
            if (child.tagName === 'BUTTON') {
                displayValue = 'inline-block';
            } else if (child.classList.contains('button-group')) {
                displayValue = 'flex';
            }
            child.style.setProperty('display', displayValue, 'important');
            child.style.setProperty('visibility', 'visible', 'important');
            child.style.setProperty('opacity', '1', 'important');
            child.style.setProperty('position', 'relative', 'important');
            child.style.setProperty('z-index', '1', 'important');
        });

        // Explicitly show all child elements of the target page
        const targetContainers = targetPage.querySelectorAll('h2, h3, button, [id$="List"], [class*="container"], [class*="form-card"], [class*="item-list"]');
        targetContainers.forEach(container => {
            // Check if it's a form that should be hidden initially
            if (container.id === 'incidentForm' && container.style.display === 'none') {
                // Keep it hidden if it's the form and it's supposed to be hidden
                return;
            }
            // Show everything else
            container.style.setProperty('display', container.tagName === 'H2' || container.tagName === 'H3' ? 'block' :
                                       container.tagName === 'BUTTON' ? 'inline-block' :
                                       container.classList.contains('item-list') ? 'block' : 'block', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            container.style.setProperty('opacity', '1', 'important');
        });
        console.log('✅ Page activated:', pageName);
        console.log('✅ Target page children count:', targetPage.children.length);
        console.log('✅ Target page offsetHeight:', targetPage.offsetHeight);
        console.log('✅ Target page offsetWidth:', targetPage.offsetWidth);

        // CRITICAL: If page has 0 height/width, force it visible (can happen with carenotes/reports)
        if (targetPage.offsetHeight === 0 || targetPage.offsetWidth === 0) {
            console.log('⚠️ Page has 0 dimensions, forcing visibility with !important');

            // Debug: identify which ancestor is collapsing layout.
            debugLayout('targetPage(before-fix)', targetPage);
            debugLayout('mainContainer(before-fix)', mainContainer);
            debugLayout('#mainApp(before-fix)', document.getElementById('mainApp'));
            debugLayout('body(before-fix)', document.body);
            debugLayout('html(before-fix)', document.documentElement);

            targetPage.style.setProperty('display', 'block', 'important');
            targetPage.style.setProperty('visibility', 'visible', 'important');
            targetPage.style.setProperty('opacity', '1', 'important');
            targetPage.style.setProperty('position', 'relative', 'important');
            targetPage.style.setProperty('min-height', '400px', 'important');
            targetPage.style.setProperty('width', '100%', 'important');
            targetPage.style.removeProperty('left');
            targetPage.style.removeProperty('right');

            // Ensure the containing layout can actually expand.
            if (mainContainer) {
                mainContainer.style.setProperty('min-height', '400px', 'important');
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('opacity', '1', 'important');
            }

            const mainAppEl = document.getElementById('mainApp');
            if (mainAppEl) {
                mainAppEl.style.setProperty('display', 'block', 'important');
                mainAppEl.style.setProperty('visibility', 'visible', 'important');
                mainAppEl.style.setProperty('opacity', '1', 'important');
                mainAppEl.style.setProperty('width', '100%', 'important');
                mainAppEl.style.setProperty('min-height', '100vh', 'important');
            }
            if (document.documentElement) {
                document.documentElement.style.setProperty('min-height', '100vh', 'important');
            }
            if (document.body) {
                document.body.style.setProperty('min-height', '100vh', 'important');
            }

            // Safari can report 0x0 until the next frame even when styles are correct.
            // Do a next-frame retry with a stronger cssText reset.
            window.requestAnimationFrame(() => {
                try {
                    const rect = targetPage.getBoundingClientRect();
                    if (rect.height === 0 || rect.width === 0) {
                        targetPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; overflow: visible !important;';
                        // Force reflow
                        void targetPage.offsetHeight;
                        const rectAfter = targetPage.getBoundingClientRect();
                        console.log('🔁 Page retry dimensions:', rectAfter.height, 'x', rectAfter.width);

                        // Debug again after retry
                        debugLayout('targetPage(after-retry)', targetPage);
                        debugLayout('mainContainer(after-retry)', mainContainer);
                        debugLayout('#mainApp(after-retry)', document.getElementById('mainApp'));
                        debugLayout('body(after-retry)', document.body);
                        debugLayout('html(after-retry)', document.documentElement);
                    }
                } catch (e) {
                    console.error('Error in page retry visibility fix:', e);
                }
            });

            // Reports sometimes needs an extra tick to get non-zero layout in Safari.
            if (pageName === 'reports') {
                setTimeout(() => {
                    try {
                        targetPage.style.setProperty('display', 'block', 'important');
                        targetPage.style.setProperty('visibility', 'visible', 'important');
                        targetPage.style.setProperty('opacity', '1', 'important');
                        targetPage.style.setProperty('position', 'relative', 'important');
                        targetPage.style.setProperty('min-height', '400px', 'important');
                        targetPage.style.setProperty('width', '100%', 'important');
                        targetPage.style.setProperty('z-index', '10', 'important');
                        targetPage.style.removeProperty('left');
                        targetPage.style.removeProperty('right');
                        // Force reflow again
                        void targetPage.offsetHeight;
                        console.log('🔁 Reports retry dimensions:', targetPage.offsetHeight, 'x', targetPage.offsetWidth);
                    } catch (e) {
                        console.error('Error in reports retry visibility fix:', e);
                    }
                }, 150);
            }

            try {
                if (window.__pageScrollResetRafId) {
                    cancelAnimationFrame(window.__pageScrollResetRafId);
                }
            } catch (e) {}

            try {
                if (window.__pageScrollResetTimeoutId) {
                    clearTimeout(window.__pageScrollResetTimeoutId);
                }
            } catch (e) {}

            try {
                if (window.__pageScrollResetTimeoutId2) {
                    clearTimeout(window.__pageScrollResetTimeoutId2);
                }
            } catch (e) {}

            try {
                if (window.__pageScrollResetIntervalId) {
                    clearInterval(window.__pageScrollResetIntervalId);
                }
            } catch (e) {}

            // Safari can auto-scroll to the last focused input/select on a page (especially forms).
            // Blur any active element before performing our scroll reset.
            try {
                const ae = document.activeElement;
                if (ae && typeof ae.blur === 'function') {
                    ae.blur();
                }
            } catch (e) {}

            const intendedPageName = pageName;
            const scrollResetNonce = (window.__pageScrollResetNonce = (window.__pageScrollResetNonce || 0) + 1);

            const doScrollTop = () => {
                if (window.__pageScrollResetNonce !== scrollResetNonce) return;
                const active = document.querySelector('.page.active');
                if (!active || active.id !== intendedPageName) return;

                try {
                    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                } catch (e) {
                    try {
                        window.scrollTo(0, 0);
                    } catch (e2) {
                        // ignore
                    }
                }

                // Ensure scrollTop is reset even if window.scrollTo is ignored.
                try {
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                    if (document.body) document.body.scrollTop = 0;
                } catch (e) {}
                try {
                    const main = document.querySelector('#mainApp > main.container') || document.querySelector('main.container');
                    if (main) main.scrollTop = 0;
                } catch (e) {}
                try {
                    const pageEl = document.getElementById(intendedPageName);
                    if (pageEl) pageEl.scrollTop = 0;
                } catch (e) {}
            };

            window.__pageScrollResetRafId = window.requestAnimationFrame(() => {
                doScrollTop();
            });

            // Second pass: Safari may scroll again after layout/focus restoration.
            window.__pageScrollResetTimeoutId = setTimeout(() => {
                doScrollTop();
            }, 120);

            // Third pass (Reports only): Safari sometimes restores scroll later on form-heavy pages.
            if (pageName === 'reports') {
                window.__pageScrollResetTimeoutId2 = setTimeout(() => {
                    doScrollTop();
                }, 380);

                // Final backstop (Reports only): keep forcing scrollTop to 0 for a short window.
                // Some Safari builds restore scroll multiple times over ~1s.
                const startedAt = Date.now();
                window.__pageScrollResetIntervalId = setInterval(() => {
                    if (window.__pageScrollResetNonce !== scrollResetNonce) {
                        try { clearInterval(window.__pageScrollResetIntervalId); } catch (e) {}
                        return;
                    }
                    const active = document.querySelector('.page.active');
                    if (!active || active.id !== intendedPageName) {
                        try { clearInterval(window.__pageScrollResetIntervalId); } catch (e) {}
                        return;
                    }
                    doScrollTop();
                    if (Date.now() - startedAt > 1100) {
                        try { clearInterval(window.__pageScrollResetIntervalId); } catch (e) {}
                    }
                }, 60);
            }
        }

        if (pageName === 'financial') {
            window.requestAnimationFrame(() => {
                try {
                    targetPage.scrollIntoView({ behavior: 'instant', block: 'start' });
                } catch (e) {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                }
            });
        }

        // Load page-specific data
        if (pageName === 'dashboard') {
            loadDashboard();
        }
        else if (pageName === 'residents') loadResidents();
        else if (pageName === 'archivedResidents') loadArchivedResidents();
        else if (pageName === 'documents') loadDocumentsPage();
        else if (pageName === 'training') loadTrainingPage();
        else if (pageName === 'medications') loadMedications();
        else if (pageName === 'appointments') loadAppointments();
        else if (pageName === 'history') {
            loadJournalPage();
        }
        else if (pageName === 'vitalsigns') {
            clearVitalSignsForm();
            loadVitalSigns();
        }
        else if (pageName === 'calendar') {
            loadCalendar();
        }
        else if (pageName === 'billing') {
            console.log('💰 Showing billing page');

            // CRITICAL: Aggressively hide incidents page when showing billing
            const incidentsPage = document.getElementById('incidents');
            if (incidentsPage) {
                incidentsPage.classList.remove('active');
                incidentsPage.style.setProperty('display', 'none', 'important');
                incidentsPage.style.setProperty('visibility', 'hidden', 'important');
                incidentsPage.style.setProperty('opacity', '0', 'important');
                incidentsPage.style.setProperty('position', 'absolute', 'important');
                incidentsPage.style.setProperty('left', '-9999px', 'important');
                incidentsPage.style.setProperty('z-index', '-1', 'important');
                console.log('✅ Incidents page forcefully hidden');
            }

            // CRITICAL: Show billing page and restore its children
            const billingPage = document.getElementById('billing');
            if (billingPage) {
                billingPage.classList.add('active');
                billingPage.style.setProperty('display', 'block', 'important');
                billingPage.style.setProperty('visibility', 'visible', 'important');
                billingPage.style.setProperty('opacity', '1', 'important');
                billingPage.style.setProperty('position', 'relative', 'important');
                billingPage.style.setProperty('z-index', '1', 'important');
                billingPage.style.removeProperty('left'); // Remove left: -9999px if it was set
                billingPage.style.removeProperty('right'); // Remove any right positioning

                // Force show all direct children of billing page
                Array.from(billingPage.children).forEach((child, index) => {
                    // Only restore if it's not a form that should be hidden
                    if (child.id === 'billForm' || child.id === 'paymentForm') {
                        // Keep forms hidden if they should be hidden
                        if (child.style.display === 'none') {
                            return;
                        }
                    }
                    // Force show everything else
                    child.style.setProperty('display', 'block', 'important');
                    child.style.setProperty('visibility', 'visible', 'important');
                    child.style.setProperty('opacity', '1', 'important');
                });

                // Also force show key billing containers
                const billingList = document.getElementById('billsList');
                const paymentsList = document.getElementById('paymentsList');
                if (billingList) {
                    billingList.style.setProperty('display', 'block', 'important');
                    billingList.style.setProperty('visibility', 'visible', 'important');
                }
                if (paymentsList) {
                    paymentsList.style.setProperty('display', 'block', 'important');
                    paymentsList.style.setProperty('visibility', 'visible', 'important');
                }

                console.log('✅ Billing page restored and shown');
            }

            loadBilling();
            loadPayments();
            loadAccountBalance();
        }
        else if (pageName === 'staff') {
            loadStaff();
        }
        else if (pageName === 'incidents') {
            console.log('%c🚨🚨🚨 SHOWING INCIDENTS PAGE 🚨🚨🚨', 'background: #4ECDC4; color: white; font-size: 20px; font-weight: bold; padding: 15px;');
            console.log('🚨 Running from: ' + window.location.hostname);

            // CRITICAL: Get incidents page element FIRST
            const incidentsPageElement = document.getElementById('incidents');
            if (!incidentsPageElement) {
                console.error('%c❌❌❌ INCIDENTS PAGE ELEMENT NOT FOUND IN DOM! ❌❌❌', 'background: red; color: white; font-size: 20px; padding: 15px;');
                alert('ERROR: Incidents page element (#incidents) not found in DOM!');
                return;
            }
            console.log('✅ Incidents page element found in DOM');
            console.log('✅ Element ID:', incidentsPageElement.id);
            console.log('✅ Element classes:', incidentsPageElement.className);
            console.log('✅ Element parent:', incidentsPageElement.parentElement?.tagName, incidentsPageElement.parentElement?.id);

            // CRITICAL: Aggressively hide billing page when showing incidents
            const billingPage = document.getElementById('billing');
            if (billingPage) {
                billingPage.classList.remove('active');
                billingPage.style.setProperty('display', 'none', 'important');
                billingPage.style.setProperty('visibility', 'hidden', 'important');
                billingPage.style.setProperty('opacity', '0', 'important');
                billingPage.style.setProperty('position', 'absolute', 'important');
                billingPage.style.setProperty('left', '-9999px', 'important');
                billingPage.style.setProperty('z-index', '-1', 'important');
                // DON'T hide children with !important - just hide the container
                // This allows billing to be restored when shown again
                console.log('✅ Billing page forcefully hidden');

                // CRITICAL: If incidents is inside billing, move it out!
                if (incidentsPageElement.parentElement && incidentsPageElement.parentElement.id === 'billing') {
                    console.log('⚠️⚠️⚠️ CRITICAL: Incidents page is INSIDE billing page! Moving it out...');
                    const mainContainer = billingPage.parentElement; // Should be main.container
                    if (mainContainer) {
                        // Move incidents page to be a sibling of billing, not a child
                        mainContainer.insertBefore(incidentsPageElement, billingPage.nextSibling);
                        console.log('✅ Incidents page moved out of billing page');
                        console.log('✅ New parent:', incidentsPageElement.parentElement?.tagName, incidentsPageElement.parentElement?.id);
                    }
                }
            } else {
                console.log('⚠️ Billing page element not found (this is OK if it doesn\'t exist)');
            }

            // CRITICAL: Explicitly show incidents page content IMMEDIATELY
            const incidentsPage = document.getElementById('incidents');
            if (!incidentsPage) {
                console.error('❌❌❌ INCIDENTS PAGE ELEMENT NOT FOUND IN DOM! ❌❌❌');
                alert('ERROR: Incidents page element not found! Check console.');
                return;
            }

            console.log('✅ Incidents page element found');
            console.log('✅ Incidents page ID:', incidentsPage.id);
            console.log('✅ Incidents page classes:', incidentsPage.className);
            console.log('✅ Incidents page children count:', incidentsPage.children.length);
            console.log('✅ Incidents page parent:', incidentsPage.parentElement?.tagName, incidentsPage.parentElement?.id);
            console.log('✅ Incidents page parent display:', window.getComputedStyle(incidentsPage.parentElement).display);
            console.log('✅ Incidents page innerHTML length:', incidentsPage.innerHTML.length);

            // CRITICAL: Ensure ALL parents are visible, starting from incidentsPage up to mainApp
            // BUT: Skip the billing page if incidents is inside it (we'll move incidents out first)
            let currentElement = incidentsPage;
            let level = 0;
            while (currentElement && level < 10) {
                const computedStyle = window.getComputedStyle(currentElement);
                const display = computedStyle.display;
                const visibility = computedStyle.visibility;
                const opacity = computedStyle.opacity;

                console.log(`🔍 Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}): display=${display}, visibility=${visibility}, opacity=${opacity}`);

                // CRITICAL: If this is the billing page, DON'T make it visible - incidents should not be inside it!
                if (currentElement.id === 'billing') {
                    console.log(`⚠️⚠️⚠️ SKIPPING billing page - incidents should NOT be inside billing!`);
                    console.log(`⚠️ This means incidents page is incorrectly nested. It should be a sibling, not a child.`);
                    // Don't fix billing - instead, we should have moved incidents out already
                    currentElement = currentElement.parentElement;
                    level++;
                    continue;
                }

                // Fix any parent with display:none (except intentionally hidden elements)
                if (display === 'none' && currentElement.id !== 'loginModal' && currentElement.id !== 'residentSelector' && currentElement.id !== 'incidentForm') {
                    console.log(`⚠️ Fixing Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}) - setting display to block with !important`);
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                    console.log(`✅ Fixed Parent ${level} - new display:`, window.getComputedStyle(currentElement).display);
                }

                // Also fix if visibility is hidden or opacity is 0
                if ((visibility === 'hidden' || opacity === '0') && currentElement.id !== 'loginModal' && currentElement.id !== 'residentSelector' && currentElement.id !== 'incidentForm') {
                    console.log(`⚠️ Fixing Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}) - visibility/opacity issue`);
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('display', 'block', 'important');
                }

                // Stop at mainApp
                if (currentElement.id === 'mainApp') {
                    console.log(`🔧 CRITICAL: Found mainApp container - forcing visibility`);
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                    break;
                }

                currentElement = currentElement.parentElement;
                level++;
            }

            // Also ensure main.container is visible
            const mainContainer = incidentsPage.closest('main.container');
            if (mainContainer) {
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('opacity', '1', 'important');
                console.log('✅ main.container forced visible');
            }

            // Force incidents page to be visible using cssText for maximum control
            incidentsPage.classList.add('active');
            incidentsPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; background: var(--light-gray) !important; overflow: visible !important;';
            console.log('✅ Incidents page forced visible with cssText');

            // Verify it worked
            const computedStyle = window.getComputedStyle(incidentsPage);
            console.log('✅ After forcing - display:', computedStyle.display);
            console.log('✅ After forcing - visibility:', computedStyle.visibility);
            console.log('✅ After forcing - opacity:', computedStyle.opacity);
            console.log('✅ After forcing - offsetHeight:', incidentsPage.offsetHeight);
            console.log('✅ After forcing - offsetWidth:', incidentsPage.offsetWidth);

            // Show ALL direct children of incidents page - USE CSS TEXT FOR MAXIMUM CONTROL
            Array.from(incidentsPage.children).forEach((child, index) => {
                console.log(`✅ Child ${index}:`, child.tagName, child.id || child.className, 'textContent:', child.textContent?.substring(0, 50));
                const beforeDisplay = window.getComputedStyle(child).display;
                const beforeVisibility = window.getComputedStyle(child).visibility;
                const beforeOpacity = window.getComputedStyle(child).opacity;
                const beforeHeight = child.offsetHeight;
                const beforeWidth = child.offsetWidth;
                console.log(`    Before: display=${beforeDisplay}, visibility=${beforeVisibility}, opacity=${beforeOpacity}, height=${beforeHeight}, width=${beforeWidth}`);

                // Don't hide the form if it's supposed to be hidden
                if (child.id === 'incidentForm' && child.style.display === 'none') {
                    console.log('⚠️ Skipping incidentForm (should be hidden)');
                    return;
                }

                // Use cssText to completely replace styles for maximum control
                const displayValue = child.tagName === 'BUTTON' ? 'inline-block' : 'block';
                child.style.cssText = `display: ${displayValue} !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 1 !important; width: auto !important; height: auto !important;`;

                const afterDisplay = window.getComputedStyle(child).display;
                const afterVisibility = window.getComputedStyle(child).visibility;
                const afterOpacity = window.getComputedStyle(child).opacity;
                const afterHeight = child.offsetHeight;
                const afterWidth = child.offsetWidth;
                console.log(`    After: display=${afterDisplay}, visibility=${afterVisibility}, opacity=${afterOpacity}, height=${afterHeight}, width=${afterWidth}`);

                if (afterHeight === 0 && afterWidth === 0) {
                    console.error(`    ❌❌❌ CHILD ${index} HAS ZERO DIMENSIONS! ❌❌❌`);
                }
            });

            // Removed debug test element checking code

            const incidentsH2 = incidentsPage.querySelector('h2');
            const incidentsButton = incidentsPage.querySelector('button[onclick="showIncidentForm()"]');
            const incidentsList = document.getElementById('incidentsList');

            if (incidentsH2) {
                incidentsH2.style.setProperty('display', 'block', 'important');
                incidentsH2.style.setProperty('visibility', 'visible', 'important');
                incidentsH2.style.setProperty('opacity', '1', 'important');
                incidentsH2.style.setProperty('color', 'var(--text-color)', 'important');
                incidentsH2.style.setProperty('margin-bottom', '1.5rem', 'important');
                console.log('✅ Incidents H2 shown:', incidentsH2.textContent);
            } else {
                console.error('❌ Incidents H2 NOT FOUND!');
            }

            if (incidentsButton) {
                incidentsButton.style.setProperty('display', 'inline-block', 'important');
                incidentsButton.style.setProperty('visibility', 'visible', 'important');
                incidentsButton.style.setProperty('opacity', '1', 'important');
                incidentsButton.style.setProperty('margin-bottom', '1.5rem', 'important');
                incidentsButton.style.setProperty('cursor', 'pointer', 'important');
                console.log('✅ Incidents button shown:', incidentsButton.textContent);
            } else {
                console.error('❌ Incidents button NOT FOUND!');
            }

            if (incidentsList) {
                incidentsList.style.setProperty('display', 'block', 'important');
                incidentsList.style.setProperty('visibility', 'visible', 'important');
                incidentsList.style.setProperty('opacity', '1', 'important');
                incidentsList.style.setProperty('min-height', '200px', 'important');
                incidentsList.style.setProperty('width', '100%', 'important');
                console.log('✅ Incidents list container shown');
            } else {
                console.error('❌ Incidents list container NOT FOUND!');
            }

            // Verify visibility with computed styles
            setTimeout(() => {
                const computedDisplay = window.getComputedStyle(incidentsPage).display;
                const computedVisibility = window.getComputedStyle(incidentsPage).visibility;
                const computedOpacity = window.getComputedStyle(incidentsPage).opacity;
                console.log('🔍 Computed styles for incidents page:');
                console.log('  - display:', computedDisplay);
                console.log('  - visibility:', computedVisibility);
                console.log('  - opacity:', computedOpacity);
                if (computedDisplay === 'none' || computedVisibility === 'hidden' || computedOpacity === '0') {
                    console.error('❌❌❌ PAGE IS STILL HIDDEN DESPITE ALL EFFORTS! ❌❌❌');
                }
            }, 100);

            console.log('🔄 Loading incidents page data...');
            loadIncidents();
        }
        else if (pageName === 'carenotes') {
            console.log('%c📝📝📝 SHOWING CARE NOTES PAGE 📝📝📝', 'background: #4ECDC4; color: white; font-size: 20px; font-weight: bold; padding: 15px;');

            const careNotesPage = document.getElementById('carenotes');
            if (!careNotesPage) {
                console.error('❌❌❌ CARE NOTES PAGE ELEMENT NOT FOUND IN DOM! ❌❌❌');
                alert('ERROR: Care notes page element (#carenotes) not found in DOM!');
                return;
            }

            // CRITICAL: If care notes is inside billing (which is often display:none), move it out
            const billingPage = document.getElementById('billing');
            if (billingPage) {
                if (careNotesPage.parentElement && careNotesPage.parentElement.id === 'billing') {
                    console.log('⚠️⚠️⚠️ CRITICAL: Care Notes page is INSIDE billing page! Moving it out...');
                    const mainContainer = billingPage.parentElement; // Should be main.container
                    if (mainContainer) {
                        mainContainer.insertBefore(careNotesPage, billingPage.nextSibling);
                        console.log('✅ Care Notes page moved out of billing page');
                        console.log('✅ New parent:', careNotesPage.parentElement?.tagName, careNotesPage.parentElement?.id);
                    }
                }
            }

            console.log('✅ Care notes page element found in DOM');
            console.log('✅ Element ID:', careNotesPage.id);
            console.log('✅ Element classes:', careNotesPage.className);
            console.log('✅ Element parent:', careNotesPage.parentElement?.tagName, careNotesPage.parentElement?.id);
            console.log('✅ Element children count:', careNotesPage.children.length);
            console.log('✅ Element innerHTML length:', careNotesPage.innerHTML.length);

            // CRITICAL: Ensure ALL parents are visible, starting from careNotesPage up to mainApp
            let currentElement = careNotesPage;
            let level = 0;
            while (currentElement && level < 10) {
                const computedStyle = window.getComputedStyle(currentElement);
                const display = computedStyle.display;
                const visibility = computedStyle.visibility;
                const opacity = computedStyle.opacity;

                console.log(`🔍 Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}): display=${display}, visibility=${visibility}, opacity=${opacity}, offsetHeight=${currentElement.offsetHeight}, offsetWidth=${currentElement.offsetWidth}`);

                // Fix any parent with display:none (except intentionally hidden elements)
                if (display === 'none' && currentElement.id !== 'loginModal' && currentElement.id !== 'residentSelector') {
                    console.log(`⚠️ Fixing Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}) - setting display to block with !important`);
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                    console.log(`✅ Fixed Parent ${level} - new display:`, window.getComputedStyle(currentElement).display);
                }

                // Also fix if visibility is hidden or opacity is 0
                if ((visibility === 'hidden' || opacity === '0') && currentElement.id !== 'loginModal' && currentElement.id !== 'residentSelector') {
                    console.log(`⚠️ Fixing Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}) - visibility/opacity issue`);
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('display', 'block', 'important');
                }

                // Stop at mainApp
                if (currentElement.id === 'mainApp') {
                    console.log(`🔧 CRITICAL: Found mainApp container - forcing visibility`);
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                    break;
                }

                currentElement = currentElement.parentElement;
                level++;
            }

            // Also ensure main.container is visible
            const mainContainer = careNotesPage.closest('main.container');
            if (mainContainer) {
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('opacity', '1', 'important');
                console.log('✅ main.container forced visible');
            }

            // Force care notes page to be visible using cssText for maximum control
            careNotesPage.classList.add('active');
            careNotesPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; background: var(--light-gray) !important; overflow: visible !important;';
            console.log('✅ Care notes page forced visible with cssText');

            // Verify it worked
            const computedStyle = window.getComputedStyle(careNotesPage);
            console.log('✅ After forcing - display:', computedStyle.display);
            console.log('✅ After forcing - visibility:', computedStyle.visibility);
            console.log('✅ After forcing - opacity:', computedStyle.opacity);
            console.log('✅ After forcing - offsetHeight:', careNotesPage.offsetHeight);
            console.log('✅ After forcing - offsetWidth:', careNotesPage.offsetWidth);

            // Show ALL direct children of care notes page - USE CSS TEXT FOR MAXIMUM CONTROL
            Array.from(careNotesPage.children).forEach((child, index) => {
                console.log(`✅ Child ${index}:`, child.tagName, child.id || child.className, 'textContent:', child.textContent?.substring(0, 50));
                const beforeDisplay = window.getComputedStyle(child).display;
                const beforeVisibility = window.getComputedStyle(child).visibility;
                const beforeOpacity = window.getComputedStyle(child).opacity;
                const beforeHeight = child.offsetHeight;
                const beforeWidth = child.offsetWidth;
                console.log(`    Before: display=${beforeDisplay}, visibility=${beforeVisibility}, opacity=${beforeOpacity}, height=${beforeHeight}, width=${beforeWidth}`);

                // Don't hide forms if they're supposed to be hidden
                if ((child.id === 'careNoteForm' || child.id === 'careNoteEditForm') && child.style.display === 'none') {
                    console.log(`⚠️ Skipping ${child.id} (should be hidden)`);
                    return;
                }

                // Use cssText to completely replace styles for maximum control
                const displayValue = child.tagName === 'BUTTON' ? 'inline-block' : 'block';
                child.style.cssText = `display: ${displayValue} !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 1 !important; width: auto !important; height: auto !important;`;

                const afterDisplay = window.getComputedStyle(child).display;
                const afterVisibility = window.getComputedStyle(child).visibility;
                const afterOpacity = window.getComputedStyle(child).opacity;
                const afterHeight = child.offsetHeight;
                const afterWidth = child.offsetWidth;
                console.log(`    After: display=${afterDisplay}, visibility=${afterVisibility}, opacity=${afterOpacity}, height=${afterHeight}, width=${afterWidth}`);

                if (afterHeight === 0 && afterWidth === 0) {
                    console.error(`    ❌❌❌ CHILD ${index} HAS ZERO DIMENSIONS! ❌❌❌`);
                }
            });

            // Force specific elements to be visible
            const careNotesH2 = careNotesPage.querySelector('h2');
            const careNotesButton = careNotesPage.querySelector('button[onclick="showCareNoteForm()"]');
            const careNotesList = document.getElementById('careNotesList');

            if (careNotesH2) {
                careNotesH2.style.setProperty('display', 'block', 'important');
                careNotesH2.style.setProperty('visibility', 'visible', 'important');
                careNotesH2.style.setProperty('opacity', '1', 'important');
                careNotesH2.style.setProperty('color', 'var(--text-color)', 'important');
                careNotesH2.style.setProperty('margin-bottom', '1.5rem', 'important');
                console.log('✅ Care notes H2 shown:', careNotesH2.textContent);
            } else {
                console.error('❌ Care notes H2 NOT FOUND!');
            }

            if (careNotesButton) {
                careNotesButton.style.setProperty('display', 'inline-block', 'important');
                careNotesButton.style.setProperty('visibility', 'visible', 'important');
                careNotesButton.style.setProperty('opacity', '1', 'important');
                careNotesButton.style.setProperty('margin-bottom', '1.5rem', 'important');
                careNotesButton.style.setProperty('cursor', 'pointer', 'important');
                console.log('✅ Care notes button shown:', careNotesButton.textContent);
            } else {
                console.error('❌ Care notes button NOT FOUND!');
            }

            if (careNotesList) {
                careNotesList.style.setProperty('display', 'block', 'important');
                careNotesList.style.setProperty('visibility', 'visible', 'important');
                careNotesList.style.setProperty('opacity', '1', 'important');
                careNotesList.style.setProperty('min-height', '200px', 'important');
                careNotesList.style.setProperty('width', '100%', 'important');
                console.log('✅ Care notes list container shown');
            } else {
                console.error('❌ Care notes list container NOT FOUND!');
            }

            // Verify visibility with computed styles
            setTimeout(() => {
                const computedDisplay = window.getComputedStyle(careNotesPage).display;
                const computedVisibility = window.getComputedStyle(careNotesPage).visibility;
                const computedOpacity = window.getComputedStyle(careNotesPage).opacity;
                console.log('🔍 Computed styles for care notes page:');
                console.log('  - display:', computedDisplay);
                console.log('  - visibility:', computedVisibility);
                console.log('  - opacity:', computedOpacity);
                console.log('  - offsetHeight:', careNotesPage.offsetHeight);
                console.log('  - offsetWidth:', careNotesPage.offsetWidth);
                if (computedDisplay === 'none' || computedVisibility === 'hidden' || computedOpacity === '0' || careNotesPage.offsetHeight === 0) {
                    console.error('❌❌❌ PAGE IS STILL HIDDEN DESPITE ALL EFFORTS! ❌❌❌');
                }
            }, 100);

            console.log('🔄 Loading care notes page data...');
            loadCareNotes();
        }
        else if (pageName === 'notifications') {
            loadNotificationsPage();
        }
        else if (pageName === 'reports') {
            loadReportsAnalytics();
        }
        else if (pageName === 'timeclock') {
            // Data loading handled by page-specific loaders below
        }
        else if (pageName === 'payroll') {
            // Data loading handled by page-specific loaders below
        }
        else if (pageName === 'settings') {
            loadModuleSettingsIntoForm();
        }
        else if (pageName === 'financial') {
            // Financial page should behave like any other page. The layout issues were caused by
            // nested pages / forced CSS overrides. Keep initialization focused on data + tab state.
            initFinancialPage();
        }
        else {
            console.error('❌ Page not found:', pageName);
        }

        // Replace dual-language text with single language after page is shown
        replaceDualLanguageText();

        // Update all translatable elements (data-translate attributes)
        updateTranslations();

        // Page-specific loaders
        if (pageName === 'timeclock') {
            loadMyHoursSummary();
        }
        if (pageName === 'payroll') {
            loadPayrollStaffOptions();
        }

        // Final backstop: ensure Reports title exists and is visible (some DOM/translation flows can remove/blank it)
        if (pageName === 'reports') {
            try {
                const reportsPage = document.getElementById('reports');
                if (reportsPage) {
                    let titleEl = reportsPage.querySelector('h2');
                    if (!titleEl) {
                        titleEl = document.createElement('h2');
                        titleEl.setAttribute('data-translate', 'nav.reports');
                        reportsPage.insertBefore(titleEl, reportsPage.firstChild);
                    }
                    const desired = (typeof t === 'function') ? t('nav.reports') : 'Reports';
                    if (!titleEl.textContent || !titleEl.textContent.trim() || titleEl.textContent.trim() === 'nav.reports') {
                        titleEl.textContent = desired;
                    }
                    titleEl.style.setProperty('display', 'block', 'important');
                    titleEl.style.setProperty('visibility', 'visible', 'important');
                    titleEl.style.setProperty('opacity', '1', 'important');
                    titleEl.style.setProperty('position', 'relative', 'important');
                    titleEl.style.setProperty('z-index', '11', 'important');
                }
            } catch (e) {
                // ignore
            }
        }
    } catch (error) {
        console.error('Error showing page:', error);
    } finally {
        // Always release guard, even on early returns/errors
        showPageInProgress = false;
    }

}

function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = normalizeBilingualString(message);
    messageBox.className = `message-box ${type} show`;

    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// Dashboard
async function loadDashboard() {
    try {
        // Dashboard layout is handled by CSS (kpi-grid + widgets)

        // Set dashboard date - only in selected language
        const dateEl = document.getElementById('dashboardDate');
        if (dateEl) {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const locale = currentLanguage === 'es' ? 'es-PR' : 'en-US';
            dateEl.textContent = today.toLocaleDateString(locale, options);
        }

        // Check if user is authenticated
        if (!authToken) {
            console.error('No auth token available, redirecting to login');
            checkAuth();
            return;
        }

        const url = currentResidentId
            ? `${API_URL}/dashboard?resident_id=${currentResidentId}`
            : `${API_URL}/dashboard`;
        const response = await fetch(url, { headers: getAuthHeaders() });

        // Handle authentication errors
        if (response.status === 401) {
            console.error('Authentication failed - token expired or invalid');
            showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentStaff');
            authToken = null;
            currentStaff = null;
            checkAuth();
            return;
        }

        if (!response.ok) {
            console.error('Dashboard API error:', response.status, response.statusText);
            throw new Error(`Dashboard API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Dashboard data:', data);

        // Get values with defaults
        const medsTaken = data.medications_taken_today ?? data.meds_taken_today ?? 0;
        const totalMeds = data.total_medications ?? data.total_meds ?? 0;
        const apptsToday = data.appointments_today ?? data.appts_today ?? 0;

        // Update UI elements safely
        const medsStatEl = document.getElementById('medsTakenStat');
        if (medsStatEl) {
            medsStatEl.textContent = `${medsTaken}/${totalMeds}`;

            const adherenceChip = document.getElementById('medsAdherenceChip');
            if (adherenceChip) {
                const pct = totalMeds > 0 ? Math.round((medsTaken / totalMeds) * 100) : 0;
                adherenceChip.textContent = `${pct}%`;
            }

            // Show progress bar if there are medications
            const progressEl = document.getElementById('medsProgress');
            const progressBarEl = document.getElementById('medsProgressBar');
            if (totalMeds > 0 && progressEl && progressBarEl) {
                const percentage = (medsTaken / totalMeds) * 100;
                progressBarEl.style.width = `${percentage}%`;
                progressEl.style.display = 'block';
            } else if (progressEl) {
                progressEl.style.display = 'none';
            }
        }

        const apptsEl = document.getElementById('apptsToday');
        if (apptsEl) {
            apptsEl.textContent = apptsToday;
        }

        // Derived medication metrics (due today / due next hour)
        await loadMedicationKpis();

        // Derived vital sign metrics (today)
        await loadVitalKpis();

        // Staff & operations metrics
        await loadStaffOpsKpis();

        // Needs attention panel
        renderDashboardAttention();

        // Load total residents
        try {
            const residentsResponse = await fetch('/api/residents?active_only=true', { headers: getAuthHeaders() });
            if (residentsResponse.ok) {
                const residents = await residentsResponse.json();
                const residentsEl = document.getElementById('totalResidents');
                if (residentsEl) {
                    residentsEl.textContent = residents.length || 0;
                }
            }
        } catch (err) {
            console.error('Error loading residents count:', err);
        }

        // Show billing summary if available
        if (data.billing_summary) {
            const billingCard = document.getElementById('billingCard');
            if (billingCard) {
                const balance = data.billing_summary.balance ?? 0;
                billingCard.style.display = 'flex';
                const balanceEl = document.getElementById('accountBalance');
                if (balanceEl) {
                    balanceEl.textContent = `$${balance.toFixed(2)}`;
                    balanceEl.style.color = balance >= 0 ? 'var(--success-green)' : 'var(--error-red)';
                }
                const labelEl = document.getElementById('balanceLabel');
                if (labelEl) {
                    labelEl.textContent = balance >= 0 ? 'Balance / Saldo' : 'Overdue / Vencido';
                }
            }
        } else {
            const billingCard = document.getElementById('billingCard');
            if (billingCard) {
                billingCard.style.display = 'none';
            }
        }

        // Load widgets
        await loadUpcomingAppointments();
        await loadMedicationReminders();
        await loadRecentActivity();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Set default values on error
        const medsStatEl = document.getElementById('medsTakenStat');
        if (medsStatEl) medsStatEl.textContent = '0/0';
        const adherenceChip = document.getElementById('medsAdherenceChip');
        if (adherenceChip) adherenceChip.textContent = '0%';
        const medsDueNowEl = document.getElementById('medsDueNow');
        if (medsDueNowEl) medsDueNowEl.textContent = '0';
        const medsDueTodayEl = document.getElementById('medsDueToday');
        if (medsDueTodayEl) medsDueTodayEl.textContent = '0';
        const apptsEl = document.getElementById('apptsToday');
        if (apptsEl) apptsEl.textContent = '0';
        const residentsEl = document.getElementById('totalResidents');
        if (residentsEl) residentsEl.textContent = '0';
        const staffEl = document.getElementById('activeStaffCount');
        if (staffEl) staffEl.textContent = '0';
        const incidentsEl = document.getElementById('incidents7d');
        if (incidentsEl) incidentsEl.textContent = '0';
        const notesEl = document.getElementById('notes24h');
        if (notesEl) notesEl.textContent = '0';
    }
}

async function loadMedicationKpis() {
    try {
        const url = currentResidentId
            ? `${API_URL}/medications?resident_id=${currentResidentId}`
            : `${API_URL}/medications`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        if (!response.ok) return;

        const medications = await response.json();
        const activeMeds = medications.filter(m => m.active);
        const medsDueTodayEl = document.getElementById('medsDueToday');
        if (medsDueTodayEl) medsDueTodayEl.textContent = String(activeMeds.length);

        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const toMinutes = (t) => {
            if (!t || typeof t !== 'string') return null;
            const [h, m] = t.split(':').map(Number);
            if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
            return (h * 60) + m;
        };
        const nowMin = (now.getHours() * 60) + now.getMinutes();
        const nextMin = (nextHour.getHours() * 60) + nextHour.getMinutes();

        let dueNextHour = 0;
        activeMeds.forEach(med => {
            let times = [];
            try {
                times = JSON.parse(med.time_slots || '[]');
            } catch (_) {
                times = [];
            }
            times.forEach(t => {
                const mins = toMinutes(t);
                if (mins === null) return;
                if (nextHour.toDateString() !== now.toDateString()) {
                    // If crossing midnight, count times >= now OR <= next
                    if (mins >= nowMin || mins <= nextMin) dueNextHour += 1;
                } else if (mins >= nowMin && mins <= nextMin) {
                    dueNextHour += 1;
                }
            });
        });

        const medsDueNowEl = document.getElementById('medsDueNow');
        if (medsDueNowEl) medsDueNowEl.textContent = String(dueNextHour);
    } catch (error) {
        console.error('Error loading medication KPIs:', error);
    }
}

async function loadVitalKpis() {
    try {
        const vitalsCard = document.getElementById('vitalsCard');
        if (!vitalsCard) return;

        const url = currentResidentId
            ? `${API_URL}/vital-signs?resident_id=${currentResidentId}`
            : `${API_URL}/vital-signs`;
        const response = await fetch(url, { headers: getAuthHeaders() });
        if (!response.ok) {
            vitalsCard.style.display = 'none';
            return;
        }

        const vitalSigns = await response.json();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const todayCount = vitalSigns.filter(vs => {
            const t = new Date(vs.recorded_at);
            return t >= startOfDay && t < endOfDay;
        }).length;

        vitalsCard.style.display = 'flex';
        const vitalsTodayEl = document.getElementById('vitalsToday');
        if (vitalsTodayEl) vitalsTodayEl.textContent = String(todayCount);

        // We don't currently have an expected schedule for vitals; show 0 missing.
        const missingEl = document.getElementById('vitalsMissingToday');
        if (missingEl) missingEl.textContent = '0 missing';
    } catch (error) {
        console.error('Error loading vital KPIs:', error);
    }
}

async function loadStaffOpsKpis() {
    try {
        // Active staff
        const staffRes = await fetch('/api/staff', { headers: getAuthHeaders() });
        if (staffRes.ok) {
            const staffList = await staffRes.json();
            const active = staffList.filter(s => s.active === 1 || s.active === true).length;
            const staffEl = document.getElementById('activeStaffCount');
            if (staffEl) staffEl.textContent = String(active);
        }

        // Incidents last 7 days
        const incUrl = currentResidentId
            ? `${API_URL}/incidents?resident_id=${currentResidentId}`
            : `${API_URL}/incidents`;
        const incRes = await fetch(incUrl, { headers: getAuthHeaders() });
        if (incRes.ok) {
            const incidents = await incRes.json();
            const since = new Date();
            since.setDate(since.getDate() - 7);
            const count = incidents.filter(i => {
                const t = new Date(i.incident_date);
                return Number.isFinite(t.getTime()) && t >= since;
            }).length;
            const el = document.getElementById('incidents7d');
            if (el) el.textContent = String(count);
        }

        // Notes last 24 hours
        const notesUrl = currentResidentId
            ? `${API_URL}/care-notes?resident_id=${currentResidentId}`
            : `${API_URL}/care-notes`;
        const notesRes = await fetch(notesUrl, { headers: getAuthHeaders() });
        if (notesRes.ok) {
            const notes = await notesRes.json();
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const count = notes.filter(n => {
                const t = new Date(n.created_at);
                return Number.isFinite(t.getTime()) && t >= since;
            }).length;
            const el = document.getElementById('notes24h');
            if (el) el.textContent = String(count);
        }
    } catch (error) {
        console.error('Error loading staff/ops KPIs:', error);
    }
}

function renderDashboardAttention() {
    const listEl = document.getElementById('dashboardAttentionList');
    if (!listEl) return;

    const medsDueNow = Number(document.getElementById('medsDueNow')?.textContent || 0);
    const incidents7d = Number(document.getElementById('incidents7d')?.textContent || 0);

    const items = [];
    if (medsDueNow > 0) {
        items.push({
            level: 'warning',
            title: `${medsDueNow} ${t('dashboard.attention.medsDueSoon')}`,
            detail: t('dashboard.attention.nextHourWindow'),
            action: "showPage('medications');"
        });
    }
    if (incidents7d > 0) {
        items.push({
            level: 'danger',
            title: `${incidents7d} ${t('dashboard.attention.incidentsIn7d')}`,
            detail: t('dashboard.attention.reviewFollowups'),
            action: "showPage('incidents');"
        });
    }
    if (items.length === 0) {
        listEl.innerHTML = `<div class="empty-state">${t('dashboard.empty.allCaughtUp')}</div>`;
        return;
    }

    listEl.innerHTML = items.map(i => {
        const badge = i.level === 'danger' ? 'attention-badge attention-badge-danger' : 'attention-badge attention-badge-warning';
        return `
            <button class="attention-item" onclick="${i.action}">
                <span class="${badge}"></span>
                <span class="attention-text">
                    <span class="attention-title">${i.title}</span>
                    <span class="attention-sub">${i.detail}</span>
                </span>
                <span class="attention-chevron"><i class="fas fa-chevron-right"></i></span>
            </button>
        `;
    }).join('');
}

async function loadUpcomingAppointments() {
    try {
        const url = currentResidentId
            ? `${API_URL}/appointments?resident_id=${currentResidentId}`
            : `${API_URL}/appointments`;
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) return;

        const appointments = await response.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter upcoming appointments (today and future)
        const upcoming = appointments
            .filter(apt => {
                const aptDate = new Date(apt.date);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate >= today && !apt.completed;
            })
            .sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateA - dateB;
            })
            .slice(0, 5); // Show only next 5

        const listEl = document.getElementById('upcomingAppointmentsList');
        if (!listEl) return;

        if (upcoming.length === 0) {
            listEl.innerHTML = `<p class="empty-state">${t('dashboard.empty.noUpcomingAppointments')}</p>`;
            return;
        }

        listEl.innerHTML = upcoming.map(apt => {
            const aptDate = new Date(apt.date);
            const isToday = aptDate.toDateString() === today.toDateString();
            return `
                <div class="upcoming-item">
                    <div class="upcoming-item-icon">📅</div>
                    <div class="upcoming-item-content">
                        <div class="upcoming-item-title">${apt.doctor_name || 'Appointment'}</div>
                        <div class="upcoming-item-time">
                            ${isToday ? t('common.today') : aptDate.toLocaleDateString()} ${apt.time ? `at ${apt.time}` : ''}
                            ${apt.facility ? ' - ' + apt.facility : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading upcoming appointments:', error);
    }
}

async function loadMedicationReminders() {
    try {
        const url = currentResidentId
            ? `${API_URL}/medications?resident_id=${currentResidentId}`
            : `${API_URL}/medications`;
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) return;

        const medications = await response.json();
        const activeMeds = medications.filter(m => m.active);

        const listEl = document.getElementById('medicationRemindersList');
        if (!listEl) return;

        if (activeMeds.length === 0) {
            listEl.innerHTML = `<p class="empty-state">${t('dashboard.empty.noMedicationsScheduled')}</p>`;
            return;
        }

        // Show next 5 medications
        const nextMeds = activeMeds.slice(0, 5);

        listEl.innerHTML = nextMeds.map(med => {
            const times = JSON.parse(med.time_slots || '[]');
            const nextTime = times.length > 0 ? times[0] : 'N/A';
            return `
                <div class="reminder-item">
                    <div class="reminder-item-icon">💊</div>
                    <div class="reminder-item-content">
                        <div class="reminder-item-title">${med.name}</div>
                        <div class="reminder-item-time">${med.dosage || ''} - Next: ${nextTime}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading medication reminders:', error);
    }
}

async function loadRecentActivity() {
    try {
        // Load recent items from various sources
        const activities = [];

        // Get recent vital signs
        try {
            const vsUrl = currentResidentId
                ? `${API_URL}/vital-signs?resident_id=${currentResidentId}`
                : `${API_URL}/vital-signs`;
            const vsResponse = await fetch(vsUrl, { headers: getAuthHeaders() });
            if (vsResponse.ok) {
                const vitalSigns = await vsResponse.json();
                vitalSigns.slice(0, 3).forEach(vs => {
                    activities.push({
                        type: 'vital',
                        icon: '❤️',
                        title: t('activity.vitalRecorded'),
                        time: new Date(vs.recorded_at),
                        id: vs.id
                    });
                });
            }
        } catch (err) {
            console.error('Error loading vital signs for activity:', err);
        }

        // Get recent care notes
        try {
            const notesUrl = currentResidentId
                ? `${API_URL}/care-notes?resident_id=${currentResidentId}`
                : `${API_URL}/care-notes`;
            const notesResponse = await fetch(notesUrl, { headers: getAuthHeaders() });
            if (notesResponse.ok) {
                const notes = await notesResponse.json();
                notes.slice(0, 2).forEach(note => {
                    activities.push({
                        type: 'note',
                        icon: '📝',
                        title: t('activity.careNoteAdded'),
                        time: new Date(note.created_at),
                        id: note.id
                    });
                });
            }
        } catch (err) {
            console.error('Error loading care notes for activity:', err);
        }

        // Sort by time (most recent first) and take top 5
        activities.sort((a, b) => b.time - a.time);
        const recent = activities.slice(0, 5);

        const listEl = document.getElementById('recentActivityList');
        if (!listEl) return;

        if (recent.length === 0) {
            listEl.innerHTML = `<p class="empty-state">${t('dashboard.empty.noRecentActivity')}</p>`;
            return;
        }

        listEl.innerHTML = recent.map(activity => {
            const timeAgo = getTimeAgo(activity.time);
            return `
                <div class="activity-item">
                    <div class="activity-item-icon">${activity.icon}</div>
                    <div class="activity-item-content">
                        <div class="activity-item-title">${activity.title}</div>
                        <div class="activity-item-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return currentLanguage === 'es' ? `hace ${minutes}${t('common.minutesAgo')}` : `${minutes}${t('common.minutesAgo')}`;
    if (hours < 24) return currentLanguage === 'es' ? `hace ${hours}${t('common.hoursAgo')}` : `${hours}${t('common.hoursAgo')}`;
    if (days < 7) return currentLanguage === 'es' ? `hace ${days}${t('common.daysAgo')}` : `${days}${t('common.daysAgo')}`;
    return date.toLocaleDateString();
}

// Residents Management
async function loadResidents() {
    try {
        // Check if we have auth token
        if (!authToken) {
            console.error('No auth token found');
            showMessage('Please log in again / Por favor inicie sesión nuevamente', 'error');
            checkAuth();
            return;
        }

        const response = await fetch('/api/residents?active_only=true', { headers: getAuthHeaders() });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            console.error('Residents API error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Residents API returned ${response.status}: ${errorText}`);
        }

        const residents = await response.json();
        console.log('Loaded residents:', residents);

        const listContainer = document.getElementById('residentsList');
        if (!listContainer) {
            console.error('residentsList element not found');
            return;
        }

        // Mobile/responsive safety: ensure the list container cannot be collapsed/hidden by layout rules.
        // Some mobile browsers (especially Safari) can end up with 0-height grids when parent containers
        // get style overrides during page routing.
        listContainer.style.setProperty('display', 'grid', 'important');
        listContainer.style.setProperty('visibility', 'visible', 'important');
        listContainer.style.setProperty('opacity', '1', 'important');
        listContainer.style.setProperty('min-height', '120px', 'important');
        listContainer.style.setProperty('width', '100%', 'important');

        listContainer.innerHTML = '';

        if (!residents || residents.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No residents added yet. / No hay residentes agregados aún.</p>';
            return;
        }

        residents.forEach(resident => {
            const card = document.createElement('div');
            card.className = 'item-card';

            const photoHTML = resident.photo_path
                ? `<div class="resident-photo-thumb"><img src="${resident.photo_path}" alt="${resident.first_name} ${resident.last_name}"></div>`
                : '';

            const residentName = `${resident.first_name || ''}\u00A0${resident.last_name || ''}`.trim() || 'Unnamed Resident / Residente Sin Nombre';

            console.log('Creating resident card for:', residentName, 'ID:', resident.id);

            // Create header structure
            const header = document.createElement('div');
            header.className = 'item-header';

            const flexContainer = document.createElement('div');
            flexContainer.style.cssText = 'display: flex; gap: 1rem; align-items: flex-start;';

            if (photoHTML) {
                const photoDiv = document.createElement('div');
                photoDiv.innerHTML = photoHTML;
                flexContainer.appendChild(photoDiv.firstElementChild);
            }

            const detailsContainer = document.createElement('div');
            detailsContainer.style.flex = '1';

            const title = document.createElement('div');
            title.className = 'item-title';
            title.style.cssText = 'font-size: 1.3rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--text-color);';
            title.textContent = residentName;
            detailsContainer.appendChild(title);

            const details = document.createElement('div');
            details.className = 'item-details';
            if (resident.room_number) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Room / Habitación:</strong>&nbsp;${resident.room_number}`;
                details.appendChild(p);
            }
            if (resident.bed_number) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Bed / Cama:</strong>&nbsp;${resident.bed_number}`;
                details.appendChild(p);
            }
            if (resident.date_of_birth) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Date of Birth / Fecha de Nacimiento:</strong>&nbsp;${new Date(resident.date_of_birth).toLocaleDateString()}`;
                details.appendChild(p);
            }
            if (resident.gender) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Gender / Género:</strong>&nbsp;${resident.gender}`;
                details.appendChild(p);
            }
            if (resident.emergency_contact_name) {
                const p = document.createElement('p');
                const formattedPhone = resident.emergency_contact_phone_formatted || formatPhoneNumber(resident.emergency_contact_phone) || '';
                p.innerHTML = `<strong>Emergency Contact / Contacto de Emergencia:</strong>&nbsp;${resident.emergency_contact_name}${formattedPhone ? ` (${formattedPhone})` : ''}`;
                details.appendChild(p);
            }
            if (resident.medical_conditions) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Medical Conditions / Condiciones Médicas:</strong>&nbsp;${resident.medical_conditions}`;
                details.appendChild(p);
            }
            if (resident.allergies) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Allergies / Alergias:</strong>&nbsp;${resident.allergies}`;
                details.appendChild(p);
            }
            detailsContainer.appendChild(details);
            flexContainer.appendChild(detailsContainer);
            header.appendChild(flexContainer);

            // Create action buttons using DOM methods
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'item-actions';

            // Select button
            const selectBtn = document.createElement('button');
            selectBtn.className = 'btn btn-primary btn-sm';
            selectBtn.textContent = t('common.select');
            selectBtn.onclick = () => selectResidentById(resident.id);
            actionsDiv.appendChild(selectBtn);

            // Edit button - CREATE IT EXPLICITLY
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-success btn-sm';
            editBtn.textContent = t('common.edit');
            editBtn.setAttribute('type', 'button');
            editBtn.setAttribute('data-resident-id', resident.id);
            editBtn.style.cssText = 'background-color: #28a745 !important; color: white !important; border: 2px solid #28a745 !important; padding: 0.5rem 1rem !important; cursor: pointer !important; display: inline-block !important; visibility: visible !important; opacity: 1 !important; width: auto !important; height: auto !important; min-width: 100px !important; margin: 0 !important;';
            editBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit button clicked for resident:', resident.id);
                editResident(resident.id);
            };
            actionsDiv.appendChild(editBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.textContent = t('common.delete');
            deleteBtn.onclick = () => deleteResident(resident.id);
            actionsDiv.appendChild(deleteBtn);

            header.appendChild(actionsDiv);
            console.log('✅ Actions div appended to header. Actions div children:', actionsDiv.children.length);
            card.appendChild(header);
            console.log('✅ Card complete for resident:', resident.id, '. Checking for Edit button in DOM...');

            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading residents:', error);
        showMessage('Error loading residents / Error al cargar residentes', 'error');
    }
}

function selectResidentById(residentId) {
    // If user is not authenticated, force login instead of navigating into the app.
    if (!authToken || !currentStaff) {
        console.warn('selectResidentById called while unauthenticated; redirecting to login');
        localStorage.removeItem('currentResidentId');
        currentResidentId = null;
        showLoginModal();
        showMessage('Please log in to continue / Por favor inicie sesión para continuar', 'error');
        return;
    }

    currentResidentId = residentId;
    localStorage.setItem('currentResidentId', residentId);
    loadCurrentResidentInfo(residentId);
    showPage('dashboard');
    showMessage('Resident selected / Residente seleccionado', 'success');
}

let editingResidentId = null;

async function editResident(id) {
    try {
        const residentId = parseInt(id);
        console.log('=== EDITING RESIDENT ===');
        console.log('Resident ID:', residentId, typeof residentId);

        // Set editing ID FIRST, before any other operations
        editingResidentId = residentId;
        console.log('Set editingResidentId to:', editingResidentId, typeof editingResidentId);

        // Store ID on form elements as backup
        const residentFormPage = document.getElementById('addResidentFormPage');
        const residentFormModal = document.getElementById('addResidentForm');
        if (residentFormPage) residentFormPage.dataset.editingId = residentId;
        if (residentFormModal) residentFormModal.dataset.editingId = residentId;

        // Show form BEFORE loading data to prevent any resets
        showAddResidentForm();

        console.log('After showAddResidentForm, editingResidentId is:', editingResidentId, typeof editingResidentId);

        // Verify it's still set, restore from form if needed
        if (editingResidentId !== residentId) {
            console.error('⚠️ WARNING: editingResidentId was reset! Restoring from form...');
            const backupId = residentFormPage?.dataset.editingId || residentFormModal?.dataset.editingId;
            if (backupId) {
                editingResidentId = parseInt(backupId);
                console.log('Restored editingResidentId from form:', editingResidentId);
            } else {
                editingResidentId = residentId;
            }
        }

        const response = await fetch(`/api/residents/${id}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to load resident: ${response.status}`);
        }

        const resident = await response.json();
        console.log('Loaded resident data:', resident);

        // Populate form fields (try page form first, then modal form)
        const setValue = (pageId, modalId, value) => {
            const pageEl = document.getElementById(pageId);
            const modalEl = document.getElementById(modalId);
            if (pageEl) pageEl.value = value || '';
            if (modalEl) modalEl.value = value || '';
        };

        setValue('newFirstNamePage', 'newFirstName', resident.first_name);
        setValue('newLastNamePage', 'newLastName', resident.last_name);
        setValue('newGenderPage', 'newGender', resident.gender);
        setValue('newRoomNumberPage', 'newRoomNumber', resident.room_number);
        setValue('newBedNumberPage', 'newBedNumber', resident.bed_number);
        setValue('newEmergencyContactPage', 'newEmergencyContact', resident.emergency_contact_name);
        setValue('newEmergencyPhonePage', 'newEmergencyPhone', resident.emergency_contact_phone);

        // Log carrier value before setting
        console.log('🔍🔍🔍 LOADING CARRIER VALUE 🔍🔍🔍');
        console.log('🔍 Resident carrier value from API:', resident.emergency_contact_carrier);
        console.log('🔍 Carrier value type:', typeof resident.emergency_contact_carrier);

        // Set carrier value with additional logging
        const carrierPageEl = document.getElementById('newEmergencyCarrierPage');
        const carrierModalEl = document.getElementById('newEmergencyCarrier');
        if (carrierPageEl) {
            console.log('🔍 Setting page carrier dropdown to:', resident.emergency_contact_carrier || '');
            carrierPageEl.value = resident.emergency_contact_carrier || '';
            console.log('🔍 Page carrier dropdown value after setting:', carrierPageEl.value);
            console.log('🔍 Page carrier dropdown options:', Array.from(carrierPageEl.options).map(opt => opt.value));
        }
        if (carrierModalEl) {
            console.log('🔍 Setting modal carrier dropdown to:', resident.emergency_contact_carrier || '');
            carrierModalEl.value = resident.emergency_contact_carrier || '';
            console.log('🔍 Modal carrier dropdown value after setting:', carrierModalEl.value);
        }
        console.log('🔍🔍🔍 END LOADING CARRIER VALUE 🔍🔍🔍');

        setValue('newEmergencyRelationPage', 'newEmergencyRelation', resident.emergency_contact_relation);
        setValue('newEmergencyEmailPage', 'newEmergencyEmail', resident.emergency_contact_email);
        setValue('newMedicalConditionsPage', 'newMedicalConditions', resident.medical_conditions);
        setValue('newAllergiesPage', 'newAllergies', resident.allergies);
        setValue('newDietaryRestrictionsPage', 'newDietaryRestrictions', resident.dietary_restrictions);

        // Set date of birth
        if (resident.date_of_birth) {
            setDateToDropdowns(resident.date_of_birth, 'newBirthYearPage', 'newBirthMonthPage', 'newBirthDayPage');
            setDateToDropdowns(resident.date_of_birth, 'newBirthYear', 'newBirthMonth', 'newBirthDay');
        }

        // Handle photo
        if (resident.photo_path) {
            residentPhotoData = resident.photo_path;
            residentPhotoDataPage = resident.photo_path;

            // Update page form preview
            const previewPage = document.getElementById('newPhotoPreviewPage');
            const previewImgPage = document.getElementById('newPhotoPreviewImgPage');
            const placeholderPage = document.getElementById('newPhotoUploadPlaceholderPage');
            if (previewPage && previewImgPage && placeholderPage) {
                previewImgPage.src = resident.photo_path;
                previewPage.style.display = 'block';
                placeholderPage.style.display = 'none';
            }

            // Update modal form preview
            const preview = document.getElementById('newPhotoPreview');
            const previewImg = document.getElementById('newPhotoPreviewImg');
            const placeholder = document.getElementById('newPhotoUploadPlaceholder');
            if (preview && previewImg && placeholder) {
                previewImg.src = resident.photo_path;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            }
        } else {
            removeResidentPhoto();
            removeResidentPhotoPage();
        }

        // Update form titles
        const formTitlePage = document.querySelector('#addResidentFormPage h3');
        if (formTitlePage) {
            formTitlePage.textContent = t('resident.edit');
        }

        const formTitleModal = document.querySelector('#addResidentForm h3');
        if (formTitleModal) {
            formTitleModal.textContent = t('resident.edit');
        }

        // Final verification that editingResidentId is still set
        console.log('Final check - editingResidentId:', editingResidentId, typeof editingResidentId);
        if (editingResidentId !== residentId) {
            console.error('⚠️ CRITICAL: editingResidentId was lost! Restoring...');
            editingResidentId = residentId;
        }

        // Scroll to form
        const scrollToForm = document.getElementById('addResidentFormPage');
        if (scrollToForm) {
            scrollToForm.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading resident:', error);
        showMessage('Error loading resident / Error al cargar residente', 'error');
        editingResidentId = null; // Reset on error
    }
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

// Staff Management
let editingStaffId = null;

function showAddStaffForm() {
    editingStaffId = null;
    document.getElementById('addStaffForm').style.display = 'block';
    document.getElementById('staffFormTitle').textContent = t('staff.add');
    document.getElementById('staffPassword').required = true;
    document.getElementById('staffPasswordHint').textContent = t('staff.passwordHint.new');
    document.getElementById('staffActiveGroup').style.display = 'none';
    document.getElementById('newStaffForm').reset();
    const staffPayRateEl = document.getElementById('staffPayRate');
    if (staffPayRateEl) staffPayRateEl.value = '';
    const generatedPinEl = document.getElementById('generatedStaffPin');
    if (generatedPinEl) generatedPinEl.value = '';
    // Process dual-language text for form header
    replaceDualLanguageText();
    // Scroll to form
    document.getElementById('addStaffForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAddStaffForm() {
    editingStaffId = null;
    document.getElementById('addStaffForm').style.display = 'none';
    document.getElementById('newStaffForm').reset();
}

async function loadStaff() {
    try {
        const response = await fetch('/api/staff', {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to load staff: ${response.status}`);
        }

        const staffList = await response.json();
        const container = document.getElementById('staffList');

        if (staffList.length === 0) {
            container.innerHTML = '<div class="empty-state">No staff members found. / No se encontró personal.</div>';
            return;
        }

        container.innerHTML = staffList.map(staff => {
            const createdDate = staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A';
            const roleLabels = {
                'admin': 'Administrator / Administrador',
                'caregiver': 'Caregiver / Cuidador',
                'nurse': 'Nurse / Enfermero(a)',
                'doctor': 'Doctor / Médico',
                'therapist': 'Therapist / Terapeuta'
            };
            const roleLabel = roleLabels[staff.role] || staff.role;
            const activeBadge = staff.active ?
                '<span class="badge badge-success">Active / Activo</span>' :
                '<span class="badge badge-danger">Inactive / Inactivo</span>';

            return `
                <div class="item-card">
                    <div class="item-header">
                        <h3>${staff.full_name || 'N/A'}</h3>
                        ${activeBadge}
                    </div>
                    <div class="item-details">
                        <p><strong>Username / Usuario:</strong> ${staff.username || 'N/A'}</p>
                        <p><strong>Role / Rol:</strong> ${roleLabel}</p>
                        <p><strong>Email:</strong> ${staff.email || 'N/A'}</p>
                        <p><strong>Phone / Teléfono:</strong> ${staff.phone_formatted || formatPhoneNumber(staff.phone) || 'N/A'}</p>
                        <p><strong>Created / Creado:</strong> ${createdDate}</p>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="editStaff(${staff.id})">Edit / Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStaff(${staff.id})">Deactivate / Desactivar</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading staff:', error);
        showMessage('Error loading staff / Error al cargar personal', 'error');
    }
}

async function editStaff(id) {
    try {
        editingStaffId = id;
        const response = await fetch(`/api/staff/${id}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load staff: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const staff = await response.json();

        // Check if form elements exist before trying to populate them
        const requiredElements = {
            'staffFullName': document.getElementById('staffFullName'),
            'staffUsername': document.getElementById('staffUsername'),
            'staffEmail': document.getElementById('staffEmail'),
            'staffPhone': document.getElementById('staffPhone'),
            'staffRole': document.getElementById('staffRole'),
            'staffActive': document.getElementById('staffActive'),
            'staffPassword': document.getElementById('staffPassword'),
            'staffActiveGroup': document.getElementById('staffActiveGroup'),
            'staffFormTitle': document.getElementById('staffFormTitle'),
            'addStaffForm': document.getElementById('addStaffForm')
        };

        // Optional elements (won't cause error if missing)
        const optionalElements = {
            'staffPasswordHint': document.getElementById('staffPasswordHint')
        };

        // Combine all elements
        const elements = { ...requiredElements, ...optionalElements };

        // Check for missing required elements only
        const missingElements = Object.entries(requiredElements).filter(([name, el]) => !el).map(([name]) => name);
        if (missingElements.length > 0) {
            console.error('Missing required form elements:', missingElements);
            throw new Error(`Missing required form elements: ${missingElements.join(', ')}`);
        }

        // Populate form fields
        elements.staffFullName.value = staff.full_name || '';
        elements.staffUsername.value = staff.username || '';
        elements.staffEmail.value = staff.email || '';
        elements.staffPhone.value = staff.phone || '';
        const staffPhoneCarrierEl = document.getElementById('staffPhoneCarrier');
        if (staffPhoneCarrierEl) staffPhoneCarrierEl.value = staff.phone_carrier || '';
        const staffPayRateEl = document.getElementById('staffPayRate');
        if (staffPayRateEl) staffPayRateEl.value = (staff.pay_rate === null || staff.pay_rate === undefined) ? '' : staff.pay_rate;
        const generatedPinEl = document.getElementById('generatedStaffPin');
        if (generatedPinEl) generatedPinEl.value = '';
        elements.staffRole.value = staff.role || 'caregiver';
        elements.staffActive.checked = staff.active !== 0;
        elements.staffPassword.value = '';
        elements.staffPassword.required = false;
        if (elements.staffPasswordHint) {
            elements.staffPasswordHint.textContent = t('staff.passwordHint.edit');
        }
        elements.staffActiveGroup.style.display = 'block';

        elements.staffFormTitle.textContent = t('staff.edit');
        replaceDualLanguageText();
        elements.addStaffForm.style.display = 'block';
        elements.addStaffForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error loading staff for edit:', error);
        showMessage('Error loading staff member / Error al cargar miembro del personal', 'error');
    }
}

async function saveStaff(event) {
    event.preventDefault();

    const staffData = {
        full_name: document.getElementById('staffFullName').value,
        username: document.getElementById('staffUsername').value,
        email: document.getElementById('staffEmail').value,
        phone: document.getElementById('staffPhone').value,
        phone_carrier: document.getElementById('staffPhoneCarrier')?.value || '',
        role: document.getElementById('staffRole').value,
        active: document.getElementById('staffActive').checked ? 1 : 0,
        pay_rate: document.getElementById('staffPayRate')?.value || ''
    };

    const password = document.getElementById('staffPassword').value;
    if (password) {
        staffData.password = password;
    }

    try {
        let response;
        if (editingStaffId) {
            // Update existing staff
            response = await fetch(`/api/staff/${editingStaffId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(staffData)
            });
        } else {
            // Create new staff
            if (!password) {
                showMessage('Password is required for new staff / La contraseña es requerida para nuevo personal', 'error');
                return;
            }
            response = await fetch('/api/staff', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(staffData)
            });
        }

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (response.status === 403) {
            showMessage('Access denied. Admin role required. / Acceso denegado. Se requiere rol de administrador.', 'error');
            return;
        }

        if (response.ok) {
            showMessage(
                editingStaffId ?
                    'Staff member updated successfully / Personal actualizado exitosamente' :
                    'Staff member added successfully / Personal agregado exitosamente',
                'success'
            );
            hideAddStaffForm();
            loadStaff();
        } else {
            const errorData = await response.json();
            showMessage(errorData.error || 'Error saving staff / Error al guardar personal', 'error');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        showMessage('Error saving staff / Error al guardar personal', 'error');
    }
}

async function generateStaffPin() {
    if (!editingStaffId) {
        showMessage('Save staff first, then generate PIN / Guarde el personal primero, luego genere el PIN', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/staff/${editingStaffId}/pin`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({})
        });

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (response.status === 403) {
            showMessage('Access denied. Admin role required. / Acceso denegado. Se requiere rol de administrador.', 'error');
            return;
        }

        const data = await response.json().catch(() => null);
        if (!response.ok) {
            showMessage((data && (data.error || data.message)) || 'Failed to generate PIN / Error al generar PIN', 'error');
            return;
        }

        const pinEl = document.getElementById('generatedStaffPin');
        if (pinEl) pinEl.value = (data && data.pin) ? data.pin : '';
        showMessage('PIN generated (shown once) / PIN generado (se muestra una vez)', 'success');
    } catch (error) {
        console.error('Error generating staff PIN:', error);
        showMessage('Failed to generate PIN / Error al generar PIN', 'error');
    }
}

async function deleteStaff(id) {
    if (!confirm('Are you sure you want to deactivate this staff member? / ¿Está seguro de que desea desactivar este miembro del personal?')) return;

    try {
        const response = await fetch(`/api/staff/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (response.status === 403) {
            showMessage('Access denied. Admin role required. / Acceso denegado. Se requiere rol de administrador.', 'error');
            return;
        }

        if (response.ok) {
            showMessage('Staff member deactivated successfully / Personal desactivado exitosamente', 'success');
            loadStaff();
        } else {
            showMessage('Error deactivating staff / Error al desactivar personal', 'error');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        showMessage('Error deactivating staff / Error al desactivar personal', 'error');
    }
}

// Incident Reports Management
let editingIncidentId = null;
let incidentPhotos = []; // Store base64 encoded photos

async function showIncidentForm() {
    console.log('🔄 showIncidentForm() called');
    try {
        editingIncidentId = null;
        incidentPhotos = [];

        // Show the form IMMEDIATELY - don't wait for anything
        const formElement = document.getElementById('incidentForm');
        if (!formElement) {
            console.error('❌ incidentForm element not found!');
            showMessage('Error: Incident form not found. Please refresh the page. / Error: Formulario de incidente no encontrado. Por favor actualice la página.', 'error');
            return;
        }

        console.log('✅ Incident form element found, showing it...');
        // Force form to be visible with !important overrides
        formElement.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; margin-top: 2rem !important;';
        console.log('✅ Form display forced with cssText');
        console.log('✅ Form computed display:', window.getComputedStyle(formElement).display);
        console.log('✅ Form computed visibility:', window.getComputedStyle(formElement).visibility);
        console.log('✅ Form offsetHeight:', formElement.offsetHeight);
        console.log('✅ Form offsetWidth:', formElement.offsetWidth);

        // Reset form
        const formTitle = document.getElementById('incidentFormTitle');
        if (formTitle) {
            formTitle.textContent = t('incident.add');
            replaceDualLanguageText();
        }

        const newForm = document.getElementById('newIncidentForm');
        if (newForm) newForm.reset();

        // Clear photo preview
        const photoPreview = document.getElementById('incidentPhotoPreview');
        if (photoPreview) photoPreview.innerHTML = '';

        // Set default date to now
        const dateInput = document.getElementById('incidentDate');
        if (dateInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            dateInput.value = now.toISOString().slice(0, 16);
        }

        const familyNotificationDateGroup = document.getElementById('familyNotificationDateGroup');
        if (familyNotificationDateGroup) familyNotificationDateGroup.style.display = 'none';

        const followUpNotesGroup = document.getElementById('followUpNotesGroup');
        if (followUpNotesGroup) followUpNotesGroup.style.display = 'none';

        // Setup checkbox handlers
        const familyNotified = document.getElementById('incidentFamilyNotified');
        const followUp = document.getElementById('incidentFollowUp');
        if (familyNotified) {
            familyNotified.onchange = function() {
                const group = document.getElementById('familyNotificationDateGroup');
                if (group) group.style.display = this.checked ? 'block' : 'none';
            };
        }
        if (followUp) {
            followUp.onchange = function() {
                const group = document.getElementById('followUpNotesGroup');
                if (group) group.style.display = this.checked ? 'block' : 'none';
            };
        }

        // Load dropdowns (but don't block form display if they fail)
        try {
            await loadStaffForIncident();
        } catch (error) {
            console.error('Error loading staff:', error);
            showMessage('Warning: Could not load staff list. / Advertencia: No se pudo cargar la lista de personal.', 'warning');
        }

        try {
            await loadResidentsForIncident();
        } catch (error) {
            console.error('Error loading residents:', error);
            showMessage('Warning: Could not load residents list. / Advertencia: No se pudo cargar la lista de residentes.', 'warning');
        }

        // Scroll to form
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log('✅ Incident form is now visible');
    } catch (error) {
        console.error('❌ Error in showIncidentForm:', error);
        showMessage('Error showing incident form. Please try again. / Error al mostrar el formulario de incidente. Por favor intente nuevamente.', 'error');
    }
}

async function loadStaffForIncident() {
    try {
        console.log('🔄 Loading staff for incident form...');

        // Wait a bit to ensure form is in DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        const select = document.getElementById('incidentStaffId');
        if (!select) {
            console.error('❌ incidentStaffId select not found in DOM');
            console.error('   Trying to find form element...');
            const form = document.getElementById('incidentForm');
            console.error('   Form element exists:', !!form);
            if (form) {
                console.error('   Form display:', window.getComputedStyle(form).display);
                console.error('   Form visibility:', window.getComputedStyle(form).visibility);
            }
            return;
        }

        console.log('✅ Found incidentStaffId select element');

        const response = await fetch('/api/staff', { headers: getAuthHeaders() });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to load staff:', response.status, errorText);
            select.innerHTML = '<option value="">-- Error loading staff --</option>';
            return;
        }

        const staffList = await response.json();
        console.log('✅ Loaded staff (all):', staffList.length);
        console.log('   Staff list:', staffList.map(s => ({ id: s.id, name: s.full_name, active: s.active })));

        // Filter to only active staff
        const activeStaff = staffList.filter(staff => staff.active === 1 || staff.active === true);
        console.log('✅ Active staff:', activeStaff.length);
        console.log('   Active staff list:', activeStaff.map(s => ({ id: s.id, name: s.full_name })));

        select.innerHTML = '<option value="">-- Select Staff / Seleccionar Personal --</option>';

        // Set current user as default
        const currentStaff = JSON.parse(localStorage.getItem('currentStaff') || '{}');
        console.log('   Current staff ID:', currentStaff.id);

        if (activeStaff.length === 0) {
            console.warn('⚠️ No active staff found! Adding placeholder option.');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '-- No active staff available --';
            option.disabled = true;
            select.appendChild(option);
        } else {
            activeStaff.forEach(staff => {
                const option = document.createElement('option');
                option.value = staff.id;
                option.textContent = `${staff.full_name} (${staff.role})`;
                if (staff.id === currentStaff.id) {
                    option.selected = true;
                    console.log('   Selected current staff:', staff.full_name);
                }
                select.appendChild(option);
            });
        }

        console.log('✅ Staff dropdown populated with', activeStaff.length, 'active staff members');
        console.log('   Select element now has', select.options.length, 'options');
    } catch (error) {
        console.error('❌ Error loading staff for incident:', error);
        console.error('   Error stack:', error.stack);
        throw error; // Re-throw so caller knows it failed
    }
}

async function loadResidentsForIncident() {
    try {
        console.log('🔄 Loading residents for incident form...');

        // Wait a bit to ensure form is in DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        const select = document.getElementById('incidentResidents');
        if (!select) {
            console.error('❌ incidentResidents select not found in DOM');
            console.error('   Trying to find form element...');
            const form = document.getElementById('incidentForm');
            console.error('   Form element exists:', !!form);
            if (form) {
                console.error('   Form display:', window.getComputedStyle(form).display);
                console.error('   Form visibility:', window.getComputedStyle(form).visibility);
            }
            return;
        }

        console.log('✅ Found incidentResidents select element');

        const response = await fetch('/api/residents?active_only=true', { headers: getAuthHeaders() });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to load residents:', response.status, errorText);
            select.innerHTML = '<option value="">-- Error loading residents --</option>';
            return;
        }

        const residents = await response.json();
        console.log('✅ Loaded residents (active only):', residents.length);

        // Debug: Log each resident
        residents.forEach(r => {
            console.log(`  - Resident: ${r.first_name} ${r.last_name} (ID: ${r.id}, Active: ${r.active})`);
        });

        // Clear existing options but keep the first placeholder
        select.innerHTML = '';

        if (residents.length === 0) {
            console.warn('⚠️ No active residents found to populate dropdown');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '-- No active residents available --';
            option.disabled = true;
            select.appendChild(option);
        } else {
            // Don't add placeholder for multi-select - users need to see all options
            residents.forEach(resident => {
                const option = document.createElement('option');
                option.value = resident.id;
                option.textContent = `${resident.first_name} ${resident.last_name}${resident.room_number ? ' - Room ' + resident.room_number : ''}`;
                // Pre-select current resident if available
                const currentResId = localStorage.getItem('currentResidentId');
                if (currentResId && resident.id == currentResId) {
                    option.selected = true;
                    console.log('   Pre-selected current resident:', resident.first_name, resident.last_name);
                }
                select.appendChild(option);
            });
        }
        console.log('✅ Residents dropdown populated with', residents.length, 'active resident(s)');
        console.log('   Select element now has', select.options.length, 'options');
    } catch (error) {
        console.error('❌ Error loading residents for incident:', error);
        throw error; // Re-throw so caller knows it failed
    }
}

function handleIncidentPhotos(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    incidentPhotos = [];
    const preview = document.getElementById('incidentPhotoPreview');
    if (!preview) return;

    preview.innerHTML = '';

    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            showMessage('Please select only image files / Por favor seleccione solo archivos de imagen', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            incidentPhotos.push(e.target.result); // Store as base64

            // Create preview
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-preview-item';
            photoDiv.innerHTML = `
                <img src="${e.target.result}" alt="Incident photo ${index + 1}">
                <button type="button" class="photo-remove-btn" onclick="removeIncidentPhoto(${index})" title="Remove / Eliminar">×</button>
            `;
            preview.appendChild(photoDiv);
        };
        reader.readAsDataURL(file);
    });
}

function removeIncidentPhoto(index) {
    incidentPhotos.splice(index, 1);
    // Rebuild preview
    const preview = document.getElementById('incidentPhotoPreview');
    if (!preview) return;

    preview.innerHTML = '';
    incidentPhotos.forEach((photo, idx) => {
        const photoDiv = document.createElement('div');
        photoDiv.className = 'photo-preview-item';
        photoDiv.innerHTML = `
            <img src="${photo}" alt="Incident photo ${idx + 1}">
            <button type="button" class="photo-remove-btn" onclick="removeIncidentPhoto(${idx})" title="Remove / Eliminar">×</button>
        `;
        preview.appendChild(photoDiv);
    });

    // Reset file input
    document.getElementById('incidentPhotos').value = '';
}

function hideIncidentForm() {
    editingIncidentId = null;
    document.getElementById('incidentForm').style.display = 'none';
    const form = document.getElementById('newIncidentForm');
    if (form) form.reset();
}

async function loadIncidents() {
    try {
        console.log('🔄 loadIncidents() called');
        const incidentsPage = document.getElementById('incidents');
        if (!incidentsPage) {
            console.error('❌ Incidents page element not found!');
            showMessage('Error: Incidents page not found / Error: Página de incidentes no encontrada', 'error');
            return;
        }

        const activePageId = document.querySelector('.page.active')?.id;
        if (activePageId !== 'incidents') {
            console.log('ℹ️ loadIncidents() called while not on incidents page; skipping visibility changes. Active page:', activePageId);
            return;
        }

        // ALWAYS ensure the page is visible and active - don't check, just force it
        incidentsPage.classList.add('active');
        incidentsPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; background: var(--light-gray) !important; overflow: visible !important;';
        console.log('✅ Incidents page forced to be visible');
        console.log('✅ Page display:', window.getComputedStyle(incidentsPage).display);
        console.log('✅ Page visibility:', window.getComputedStyle(incidentsPage).visibility);
        console.log('✅ Page opacity:', window.getComputedStyle(incidentsPage).opacity);
        console.log('✅ Page offsetHeight:', incidentsPage.offsetHeight);
        console.log('✅ Page offsetWidth:', incidentsPage.offsetWidth);
        console.log('✅ Page scrollHeight:', incidentsPage.scrollHeight);
        console.log('✅ Page scrollWidth:', incidentsPage.scrollWidth);
        console.log('✅ Page has active class:', incidentsPage.classList.contains('active'));
        console.log('✅ Page innerHTML length:', incidentsPage.innerHTML.length);
        console.log('✅ Page children count:', incidentsPage.children.length);

        console.log('✅ Page computed width:', window.getComputedStyle(incidentsPage).width);

        // CRITICAL: Force show ALL direct children immediately
        const directChildren = Array.from(incidentsPage.children);
        console.log('🔍 Found', directChildren.length, 'direct children of incidents page');
        console.log('🔍 Children list:', directChildren.map(c => `${c.tagName}#${c.id || ''}.${c.className || ''}`).join(', '));

        directChildren.forEach((child, index) => {
            console.log(`  Child ${index}:`, child.tagName, child.id || child.className);
            const beforeDisplay = window.getComputedStyle(child).display;
            const beforeVisibility = window.getComputedStyle(child).visibility;
            const beforeOpacity = window.getComputedStyle(child).opacity;
            console.log(`    Before: display=${beforeDisplay}, visibility=${beforeVisibility}, opacity=${beforeOpacity}`);

            // Skip the form if it's supposed to be hidden
            if (child.id === 'incidentForm' && child.style.display === 'none') {
                console.log(`  ⏭️ Skipping ${child.id} (form should be hidden)`);
                return;
            }
            // Force show everything else
            child.style.setProperty('display', child.tagName === 'BUTTON' ? 'inline-block' : 'block', 'important');
            child.style.setProperty('visibility', 'visible', 'important');
            child.style.setProperty('opacity', '1', 'important');
            child.style.setProperty('position', 'relative', 'important');
            child.style.setProperty('z-index', '1', 'important');

            const afterDisplay = window.getComputedStyle(child).display;
            const afterVisibility = window.getComputedStyle(child).visibility;
            const afterOpacity = window.getComputedStyle(child).opacity;
            console.log(`    After: display=${afterDisplay}, visibility=${afterVisibility}, opacity=${afterOpacity}`);
            console.log(`  ✅ Forced child ${index} to be visible`);

            // Also check if child has any hidden children
            const hiddenChildren = Array.from(child.querySelectorAll('*')).filter(c => {
                const style = window.getComputedStyle(c);
                return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
            });
            if (hiddenChildren.length > 0) {
                console.log(`  ⚠️ Child ${index} has ${hiddenChildren.length} hidden descendants`);
            }
        });

        console.log('🔄 Loading incidents...');

        // Verify key elements exist before loading
        const h2Before = incidentsPage.querySelector('h2');
        const buttonBefore = incidentsPage.querySelector('button[onclick="showIncidentForm()"]');
        console.log('🔍 Before loading incidents:');
        console.log('  H2 exists:', !!h2Before);
        console.log('  Button exists:', !!buttonBefore);

        const container = document.getElementById('incidentsList');
        if (!container) {
            console.error('❌ incidentsList container not found');
            showMessage('Error: Page container not found / Error: Contenedor de página no encontrado', 'error');
            return;
        }

        // Force container to be visible with !important
        container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 999 !important; min-height: 200px !important; width: 100% !important; margin-top: 2rem !important; padding: 1rem !important; background: var(--white) !important; border-radius: 8px !important;';
        console.log('✅ Container forced visible with cssText');
        console.log('✅ Container computed display:', window.getComputedStyle(container).display);
        console.log('✅ Container computed visibility:', window.getComputedStyle(container).visibility);
        console.log('✅ Container computed opacity:', window.getComputedStyle(container).opacity);
        console.log('✅ Container computed height:', window.getComputedStyle(container).height);
        console.log('✅ Container computed width:', window.getComputedStyle(container).width);
        console.log('✅ Container offsetHeight:', container.offsetHeight);
        console.log('✅ Container offsetWidth:', container.offsetWidth);

        // FORCE the header to be visible with cssText
        const header = incidentsPage.querySelector('h2') || incidentsPage.querySelector('#incidentsH2');
        if (header) {
            header.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; color: var(--text-color) !important; margin-bottom: 1.5rem !important; font-size: 1.8rem !important; font-weight: bold !important; position: relative !important; z-index: 1 !important; width: 100% !important; height: auto !important;';
            console.log('✅ Header forced to be visible');
            console.log('✅ Header text:', header.textContent);
            console.log('✅ Header display:', window.getComputedStyle(header).display);
            console.log('✅ Header visibility:', window.getComputedStyle(header).visibility);
            console.log('✅ Header opacity:', window.getComputedStyle(header).opacity);
            console.log('✅ Header offsetHeight:', header.offsetHeight);
            console.log('✅ Header offsetWidth:', header.offsetWidth);
        } else {
            console.error('❌ Header not found!');
            console.error('Available h2 elements:', incidentsPage.querySelectorAll('h2'));
        }

        // FORCE the button to be visible with cssText
        const reportButton = incidentsPage.querySelector('#incidentsButton') || incidentsPage.querySelector('button[onclick="showIncidentForm()"]');
        if (reportButton) {
            reportButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1.5rem !important; padding: 0.75rem 1.5rem !important; font-size: 1rem !important; cursor: pointer !important; position: relative !important; z-index: 1 !important; width: auto !important; height: auto !important; background: var(--primary-color) !important; color: white !important; border: none !important;';
            console.log('✅ Report Incident button forced to be visible');
            console.log('✅ Button text:', reportButton.textContent);
            console.log('✅ Button display:', window.getComputedStyle(reportButton).display);
            console.log('✅ Button visibility:', window.getComputedStyle(reportButton).visibility);
            console.log('✅ Button opacity:', window.getComputedStyle(reportButton).opacity);
            console.log('✅ Button offsetHeight:', reportButton.offsetHeight);
            console.log('✅ Button offsetWidth:', reportButton.offsetWidth);
            if (reportButton.offsetHeight === 0 || reportButton.offsetWidth === 0) {
                console.error('❌❌❌ BUTTON HAS ZERO DIMENSIONS! ❌❌❌');
            }
        } else {
            console.error('❌ Report Incident button not found!');
            console.error('Available buttons:', incidentsPage.querySelectorAll('button'));
        }


        // CRITICAL: Also check and fix the main.container parent
        const mainContainer = incidentsPage.closest('main.container');
        if (mainContainer) {
            console.log('🔍 Found main.container parent');
            const mainDisplay = window.getComputedStyle(mainContainer).display;
            const mainVisibility = window.getComputedStyle(mainContainer).visibility;
            const mainOpacity = window.getComputedStyle(mainContainer).opacity;
            console.log(`  Main container: display=${mainDisplay}, visibility=${mainVisibility}, opacity=${mainOpacity}`);
            if (mainDisplay === 'none' || mainVisibility === 'hidden' || mainOpacity === '0') {
                console.log('⚠️ Fixing main.container visibility');
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('opacity', '1', 'important');
            }
        }

        // Show loading state
        container.innerHTML = '<div class="empty-state">Loading incidents... / Cargando incidentes...</div>';

        const url = currentResidentId ? `/api/incidents?resident_id=${currentResidentId}` : '/api/incidents';
        console.log('📡 Fetching incidents from:', url);

        const response = await fetch(url, { headers: getAuthHeaders() });
        console.log('📥 Response status:', response.status);

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to load incidents:', response.status, errorText);
            container.innerHTML = `<div class="empty-state">Error loading incidents (${response.status}). Please try again. / Error al cargar incidentes (${response.status}). Por favor intente nuevamente.</div>`;
            showMessage(`Error loading incidents / Error al cargar incidentes: ${response.status}`, 'error');
            return;
        }

        const incidents = await response.json();
        console.log('✅ API Response received');
        console.log('✅ Incidents type:', Array.isArray(incidents) ? 'array' : typeof incidents);
        console.log('✅ Incidents length:', Array.isArray(incidents) ? incidents.length : 'N/A (not array)');
        console.log('✅ Incidents data:', incidents);

        // Validate response is an array
        if (!Array.isArray(incidents)) {
            console.error('❌ API did not return an array! Response:', incidents);
            container.innerHTML = `<div class="empty-state" style="display: block !important; visibility: visible !important; opacity: 1 !important; padding: var(--page-padding, 2rem) !important; background: #fee !important; border: 2px solid #f00 !important; border-radius: 8px !important; color: #c00 !important; font-weight: bold !important;">Error: Server returned invalid data format. Please check console. / Error: El servidor devolvió un formato de datos inválido. Por favor revise la consola.</div>`;
            container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 999 !important; min-height: 200px !important; width: 100% !important; margin-top: 2rem !important; padding: 1rem !important; background: var(--white) !important; border-radius: 8px !important;';
            showMessage('Error: Invalid data format from server / Error: Formato de datos inválido del servidor', 'error');
            return;
        }

        if (incidents.length === 0) {
            // Create a highly visible empty state with aggressive inline styles
            const emptyStateDiv = document.createElement('div');
            emptyStateDiv.className = 'empty-state';
            emptyStateDiv.style.cssText = `
                padding: 3rem !important;
                font-size: 1.1rem !important;
                color: #333 !important;
                background: #f5f5f5 !important;
                border: 2px solid #ddd !important;
                border-radius: 8px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 1000 !important;
                margin: 2rem 0 !important;
                text-align: center !important;
                min-height: 200px !important;
                width: 100% !important;
            `;
            emptyStateDiv.innerHTML = `
                <p style="margin-bottom: 1rem; font-size: 1.2rem; font-weight: bold; color: #333 !important;">📋 No incident reports found. / No se encontraron reportes de incidentes.</p>
                <p style="font-size: 0.9rem; color: #666 !important;">Click the "+ Report Incident" button above to create your first incident report. / Haga clic en el botón "+ Reportar Incidente" arriba para crear su primer reporte de incidente.</p>
            `;

            // Clear and append
            container.innerHTML = '';
            container.appendChild(emptyStateDiv);

            // Force container visibility
            container.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 999 !important;
                min-height: 200px !important;
                width: 100% !important;
                margin-top: 2rem !important;
            `;

            console.log('✅ Empty state message displayed');
            console.log('✅ Container innerHTML length:', container.innerHTML.length);
            console.log('✅ Container display:', window.getComputedStyle(container).display);
            console.log('✅ Container visibility:', window.getComputedStyle(container).visibility);
            console.log('✅ Container opacity:', window.getComputedStyle(container).opacity);
            console.log('✅ Container z-index:', window.getComputedStyle(container).zIndex);
            console.log('✅ Empty state div display:', window.getComputedStyle(emptyStateDiv).display);
            console.log('✅ Empty state div visibility:', window.getComputedStyle(emptyStateDiv).visibility);

            // Also check and fix parent elements
            let parent = container.parentElement;
            let level = 0;
            while (parent && level < 5) {
                const computedStyle = window.getComputedStyle(parent);
                const display = computedStyle.display;
                const visibility = computedStyle.visibility;
                const opacity = computedStyle.opacity;

                console.log(`✅ Parent ${level} (${parent.tagName}): display=${display}, visibility=${visibility}, opacity=${opacity}`);

                // Fix any parent with display:none (except if it's intentionally hidden)
                if (display === 'none' && parent.id !== 'loginModal' && parent.id !== 'residentSelector') {
                    console.log(`⚠️ Fixing Parent ${level} (${parent.tagName}) - setting display to block with !important`);
                    parent.style.setProperty('display', 'block', 'important');
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent.style.setProperty('opacity', '1', 'important');
                    parent.style.setProperty('position', 'relative', 'important');
                    parent.style.setProperty('z-index', '1', 'important');
                    console.log(`✅ Fixed Parent ${level} - new display:`, window.getComputedStyle(parent).display);
                }

                // Also fix if visibility is hidden or opacity is 0
                if ((visibility === 'hidden' || opacity === '0') && parent.id !== 'loginModal' && parent.id !== 'residentSelector' && parent.id !== 'incidentForm') {
                    console.log(`⚠️ Fixing Parent ${level} (${parent.tagName}) - visibility/opacity issue`);
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent.style.setProperty('opacity', '1', 'important');
                    parent.style.setProperty('display', 'block', 'important');
                }

                // CRITICAL: If this is the mainApp container, ALWAYS make it visible
                if (parent.id === 'mainApp') {
                    console.log(`🔧 CRITICAL: Found mainApp container - forcing visibility`);
                    parent.style.setProperty('display', 'block', 'important');
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent.style.setProperty('opacity', '1', 'important');
                    parent.style.setProperty('position', 'relative', 'important');
                    parent.style.setProperty('z-index', '1', 'important');
                }

                parent = parent.parentElement;
                level++;
            }

            return;
        }

        // Render incidents
        const incidentsHTML = incidents.map(incident => {
            const date = new Date(incident.incident_date);
            const severityColors = {
                'minor': 'badge-success',
                'moderate': 'badge-warning',
                'major': 'badge-danger',
                'critical': 'badge-danger'
            };
            const severityLabels = {
                'minor': 'Minor / Menor',
                'moderate': 'Moderate / Moderado',
                'major': 'Major / Mayor',
                'critical': 'Critical / Crítico'
            };

            return `
                <div class="item-card" style="display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1rem !important; padding: 1rem !important; background: white !important; border: 1px solid #ddd !important; border-radius: 8px !important;">
                    <div class="item-header">
                        <h3>${incident.incident_type || 'Incident'} - ${incident.resident_name || 'N/A'}</h3>
                        <span class="badge ${severityColors[incident.severity] || 'badge-warning'}">${severityLabels[incident.severity] || incident.severity}</span>
                    </div>
                    <div class="item-details">
                        <p><strong>Date / Fecha:</strong> ${date.toLocaleString()}</p>
                        <p><strong>Location / Ubicación:</strong> ${incident.location || 'N/A'}</p>
                        <p><strong>Description / Descripción:</strong> ${incident.description || 'N/A'}</p>
                        ${incident.witnesses ? `<p><strong>Witnesses / Testigos:</strong> ${incident.witnesses}</p>` : ''}
                        ${incident.actions_taken ? `<p><strong>Actions Taken / Acciones:</strong> ${incident.actions_taken}</p>` : ''}
                        <p><strong>Family Notified / Familia Notificada:</strong> ${incident.family_notified ? 'Yes / Sí' : 'No'}</p>
                        ${incident.follow_up_required ? `<p><strong>Follow-up Required / Seguimiento:</strong> Yes / Sí</p>` : ''}
                        <p><strong>Reported by / Reportado por:</strong> ${incident.staff_name || 'N/A'}</p>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="editIncident(${incident.id})">Edit / Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteIncident(${incident.id})">Delete / Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = incidentsHTML;
        console.log('✅ Rendered', incidents.length, 'incidents into container');
        console.log('✅ Container innerHTML length after render:', container.innerHTML.length);
        console.log('✅ Container has children:', container.children.length);

        // CRITICAL: Force container visible AFTER rendering
        container.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 999 !important; min-height: 200px !important; width: 100% !important; margin-top: 2rem !important; padding: 1rem !important; background: var(--white) !important; border-radius: 8px !important;';

        // Force all incident cards visible
        const incidentCards = container.querySelectorAll('.item-card');
        console.log('✅ Found', incidentCards.length, 'incident cards');
        incidentCards.forEach((card, idx) => {
            card.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1rem !important; padding: 1rem !important; background: white !important; border: 1px solid #ddd !important; border-radius: 8px !important; position: relative !important; z-index: 1 !important; width: 100% !important;';
            console.log(`✅ Forced card ${idx} visible - offsetHeight: ${card.offsetHeight}, offsetWidth: ${card.offsetWidth}`);
        });

        console.log('✅ Container final display:', window.getComputedStyle(container).display);
        console.log('✅ Container final visibility:', window.getComputedStyle(container).visibility);
        console.log('✅ Container final opacity:', window.getComputedStyle(container).opacity);
        console.log('✅ Container final offsetHeight:', container.offsetHeight);
        console.log('✅ Container final offsetWidth:', container.offsetWidth);
    } catch (error) {
        console.error('❌ Error loading incidents:', error);
        const container = document.getElementById('incidentsList');
        if (container) {
            container.innerHTML = `<div class="empty-state">Error loading incidents: ${error.message} / Error al cargar incidentes: ${error.message}</div>`;
        }
        showMessage(`Error loading incidents / Error al cargar incidentes: ${error.message}`, 'error');
    }
}

async function editIncident(id) {
    try {
        editingIncidentId = id;
        const response = await fetch(`/api/incidents/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`Failed to load incident: ${response.status}`);

        const incident = await response.json();

        // Load dropdowns first
        await loadStaffForIncident();
        await loadResidentsForIncident();

        // Format datetime for input
        const incidentDate = new Date(incident.incident_date);
        incidentDate.setMinutes(incidentDate.getMinutes() - incidentDate.getTimezoneOffset());

        document.getElementById('incidentDate').value = incidentDate.toISOString().slice(0, 16);
        document.getElementById('incidentType').value = incident.incident_type || '';
        document.getElementById('incidentLocation').value = incident.location || '';
        document.getElementById('incidentSeverity').value = incident.severity || 'minor';
        document.getElementById('incidentDescription').value = incident.description || '';
        document.getElementById('incidentWitnesses').value = incident.witnesses || '';
        document.getElementById('incidentActions').value = incident.actions_taken || '';
        document.getElementById('incidentFamilyNotified').checked = incident.family_notified === 1;
        document.getElementById('incidentFollowUp').checked = incident.follow_up_required === 1;
        document.getElementById('followUpNotes').value = incident.follow_up_notes || '';

        // Set staff
        if (incident.staff_id) {
            document.getElementById('incidentStaffId').value = incident.staff_id;
        }

        // Set residents (handle multiple)
        const residentsSelect = document.getElementById('incidentResidents');
        if (residentsSelect) {
            // Clear selections
            Array.from(residentsSelect.options).forEach(opt => opt.selected = false);

            // Try to parse residents_involved, fallback to single resident_id
            let residentsToSelect = [incident.resident_id];
            if (incident.residents_involved) {
                try {
                    residentsToSelect = JSON.parse(incident.residents_involved);
                } catch (e) {
                    console.error('Error parsing residents_involved:', e);
                }
            }

            residentsToSelect.forEach(resId => {
                const option = residentsSelect.querySelector(`option[value="${resId}"]`);
                if (option) option.selected = true;
            });
        }

        // Load photos
        incidentPhotos = [];
        const photoPreview = document.getElementById('incidentPhotoPreview');
        if (photoPreview) photoPreview.innerHTML = '';

        if (incident.photos) {
            try {
                const photos = JSON.parse(incident.photos);
                if (Array.isArray(photos) && photos.length > 0) {
                    incidentPhotos = photos;
                    photos.forEach((photo, idx) => {
                        const photoDiv = document.createElement('div');
                        photoDiv.className = 'photo-preview-item';
                        photoDiv.innerHTML = `
                            <img src="${photo}" alt="Incident photo ${idx + 1}">
                            <button type="button" class="photo-remove-btn" onclick="removeIncidentPhoto(${idx})" title="Remove / Eliminar">×</button>
                        `;
                        photoPreview.appendChild(photoDiv);
                    });
                }
            } catch (e) {
                console.error('Error parsing photos:', e);
            }
        }

        if (incident.family_notification_date) {
            const notifDate = new Date(incident.family_notification_date);
            notifDate.setMinutes(notifDate.getMinutes() - notifDate.getTimezoneOffset());
            document.getElementById('familyNotificationDate').value = notifDate.toISOString().slice(0, 16);
        }

        document.getElementById('familyNotificationDateGroup').style.display = incident.family_notified ? 'block' : 'none';
        document.getElementById('followUpNotesGroup').style.display = incident.follow_up_required ? 'block' : 'none';

        document.getElementById('incidentFormTitle').textContent = t('incident.editReport');
        replaceDualLanguageText();
        document.getElementById('incidentForm').style.display = 'block';
        document.getElementById('incidentForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error loading incident:', error);
        showMessage('Error loading incident / Error al cargar incidente', 'error');
    }
}

async function saveIncident(event) {
    if (event) {
        event.preventDefault();
    }
    console.log('💾💾💾 SAVE INCIDENT FUNCTION CALLED 💾💾💾');
    console.log('💾 Event:', event);
    console.log('💾 Saving incident...');

    // Validate required fields
    const incidentDate = document.getElementById('incidentDate').value;
    const incidentType = document.getElementById('incidentType').value;
    const description = document.getElementById('incidentDescription').value;
    const severity = document.getElementById('incidentSeverity').value;
    const staffId = document.getElementById('incidentStaffId').value;
    const residentsSelect = document.getElementById('incidentResidents');
    const selectedResidents = Array.from(residentsSelect.selectedOptions).map(opt => opt.value).filter(v => v);

    if (!incidentDate || !incidentType || !description || !severity || !staffId) {
        showMessage('Please fill in all required fields / Por favor complete todos los campos requeridos', 'error');
        return;
    }

    if (selectedResidents.length === 0) {
        showMessage('Please select at least one resident / Por favor seleccione al menos un residente', 'error');
        return;
    }

    // For now, save with first resident (we'll need to update backend to support multiple residents)
    const primaryResidentId = parseInt(selectedResidents[0]);

    const incidentData = {
        resident_id: primaryResidentId,
        staff_id: parseInt(staffId),
        incident_date: incidentDate,
        incident_type: incidentType,
        location: document.getElementById('incidentLocation').value || '',
        description: description,
        severity: severity,
        witnesses: document.getElementById('incidentWitnesses').value || '',
        actions_taken: document.getElementById('incidentActions').value || '',
        family_notified: document.getElementById('incidentFamilyNotified').checked || false,
        follow_up_required: document.getElementById('incidentFollowUp').checked || false,
        follow_up_notes: document.getElementById('followUpNotes').value || '',
        photos: JSON.stringify(incidentPhotos), // Store photos as JSON array of base64
        residents_involved: JSON.stringify(selectedResidents) // Store all involved residents
    };

    if (incidentData.family_notified) {
        const notifDate = document.getElementById('familyNotificationDate').value;
        if (notifDate) {
            incidentData.family_notification_date = notifDate;
        }
    }

    console.log('📤 Sending incident data:', incidentData);
    console.log('🔍 Severity being sent:', severity, '(should be "major" or "critical" for email)');

    try {
        const url = editingIncidentId ? `/api/incidents/${editingIncidentId}` : '/api/incidents';
        const method = editingIncidentId ? 'PUT' : 'POST';

        console.log(`🌐 ${method} ${url}`);
        console.log(`📤 Request body:`, incidentData);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        let response;
        try {
            response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(incidentData),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error('❌ Request timeout after 30 seconds');
                showMessage('Request timeout. The server may be slow. Please try again. / Tiempo de espera agotado. El servidor puede estar lento. Por favor intente de nuevo.', 'error');
                return;
            }
            throw fetchError; // Re-throw other errors
        }

        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', [...response.headers.entries()]);

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', result);
            let message = editingIncidentId ? 'Incident updated successfully / Incidente actualizado exitosamente' :
                'Incident reported successfully / Incidente reportado exitosamente';
            if (result.email_status) {
                console.log('📧 Email status:', result.email_status);
                message += `\n📧 ${result.email_status}`;
            }
            showMessage(message, result.email_status && result.email_status.includes('sent') ? 'success' : 'info');
            hideIncidentForm();
            loadIncidents();
        } else {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText || `Server error: ${response.status}` };
            }
            showMessage(errorData.error || 'Error saving incident / Error al guardar incidente', 'error');
        }
    } catch (error) {
        console.error('❌ Error saving incident:', error);
        showMessage(`Error saving incident: ${error.message} / Error al guardar incidente: ${error.message}`, 'error');
    }
}

async function deleteIncident(id) {
    if (!confirm('Are you sure you want to delete this incident report? / ¿Está seguro de que desea eliminar este reporte?')) return;

    console.log(`🗑️ Attempting to delete incident ${id}...`);

    try {
        const response = await fetch(`/api/incidents/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log(`📡 Delete response status: ${response.status}`);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Delete successful:', result);
            showMessage('Incident deleted successfully / Incidente eliminado exitosamente', 'success');
            loadIncidents();
        } else {
            // Try to get error message from response
            let errorMessage = 'Error deleting incident / Error al eliminar incidente';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                console.error('❌ Delete failed:', errorData);
            } catch (e) {
                const errorText = await response.text();
                console.error('❌ Delete failed (non-JSON):', errorText);
                errorMessage = errorText || errorMessage;
            }
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting incident:', error);
        showMessage(`Error deleting incident: ${error.message} / Error al eliminar incidente: ${error.message}`, 'error');
    }
}

// Daily Care Notes Management
let editingCareNoteId = null;

function showCareNoteForm() {
    editingCareNoteId = null;
    document.getElementById('careNoteForm').style.display = 'block';
    document.getElementById('careNoteFormTitle').textContent = t('carenote.add');
    replaceDualLanguageText();
    const form = document.getElementById('newCareNoteForm');
    if (form) form.reset();
    // Set default date and time to today/now
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format
    document.getElementById('careNoteDate').value = today;
    const timeField = document.getElementById('careNoteTime');
    if (timeField) timeField.value = timeString;
    document.getElementById('careNoteForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideCareNoteForm() {
    editingCareNoteId = null;
    document.getElementById('careNoteForm').style.display = 'none';
    const form = document.getElementById('newCareNoteForm');
    if (form) form.reset();
}

async function loadCareNotes() {
    console.log('📝📝📝 loadCareNotes() CALLED 📝📝📝');
    const container = document.getElementById('careNotesList');
    if (!container) {
        console.error('❌ careNotesList container not found!');
        showMessage('Error: Care notes container not found / Error: Contenedor de notas no encontrado', 'error');
        return;
    }
    console.log('✅ Container found');

    const activePageId = document.querySelector('.page.active')?.id;
    if (activePageId !== 'carenotes') {
        console.log('ℹ️ loadCareNotes() called while not on carenotes page; skipping visibility changes. Active page:', activePageId);
        return;
    }

    // CRITICAL: Ensure parent page is visible first
    const carenotesPage = document.getElementById('carenotes');
    if (carenotesPage) {
        const pageHeight = carenotesPage.offsetHeight;
        const pageWidth = carenotesPage.offsetWidth;
        console.log('📝 Carenotes page dimensions:', pageHeight, 'x', pageWidth);
        if (pageHeight === 0 || pageWidth === 0) {
            console.log('⚠️ Page has 0 dimensions, forcing visibility with !important');
            carenotesPage.style.setProperty('display', 'block', 'important');
            carenotesPage.style.setProperty('visibility', 'visible', 'important');
            carenotesPage.style.setProperty('opacity', '1', 'important');
            carenotesPage.style.setProperty('position', 'relative', 'important');
            carenotesPage.style.setProperty('min-height', '400px', 'important');
            carenotesPage.style.setProperty('width', '100%', 'important');
            carenotesPage.style.removeProperty('left');
            carenotesPage.style.removeProperty('right');
        }
    }

    // Ensure container is visible with !important
    container.style.setProperty('display', 'block', 'important');
    container.style.setProperty('visibility', 'visible', 'important');
    container.style.setProperty('opacity', '1', 'important');
    container.style.setProperty('min-height', '200px', 'important');
    container.style.setProperty('width', '100%', 'important');
    console.log('✅ Container visibility forced');

    // Show loading state
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">Loading care notes...</div>';

    try {
        if (!authToken) {
            checkAuth();
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #d32f2f;">Please log in</div>';
            return;
        }

        const url = currentResidentId ? `/api/care-notes?resident_id=${currentResidentId}` : '/api/care-notes';
        console.log('📝 Fetching care notes from:', url);
        const response = await fetch(url, {
            headers: getAuthHeaders(),
            cache: 'no-store'
        });

        if (response.status === 401) {
            showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentStaff');
            authToken = null;
            currentStaff = null;
            checkAuth();
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #d32f2f;">Session expired. Please log in.</div>';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to load care notes:', response.status, errorText);
            throw new Error(`Failed to load care notes: ${response.status} - ${errorText}`);
        }

        const notes = await response.json();
        console.log('📝 Received care notes:', notes.length, 'notes');

        if (!notes || notes.length === 0) {
            console.log('📝 No care notes found, showing empty state');
            // Force container visible again before showing empty state
            container.style.setProperty('display', 'block', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('min-height', '200px', 'important');
            container.style.setProperty('width', '100%', 'important');
            container.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: #666; display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 150px !important; width: 100% !important;">
                    <p style="font-size: 1.1em; margin-bottom: 0.5rem; font-weight: 500;">${t('common.noCareNotes')}</p>
                    <p style="margin-top: 1rem; color: #888;">Click the "Add Care Note" button above to create your first care note.</p>
                </div>
            `;
            console.log('✅ Empty state displayed, container innerHTML length:', container.innerHTML.length);
            console.log('✅ Container offsetHeight after empty state:', container.offsetHeight);
            return;
        }

        console.log('📝 Rendering', notes.length, 'care notes');
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.innerHTML = notes.map(note => {
            const date = new Date(note.note_date);
            const timeDisplay = note.note_time ? ` - ${note.note_time}` : '';
            return `
                <div class="item-card">
                    <div class="item-header">
                        <h3>${date.toLocaleDateString()}${timeDisplay} - ${note.resident_name || 'N/A'}</h3>
                        ${note.shift ? `<span class="badge badge-success">${note.shift}</span>` : ''}
                    </div>
                    <div class="item-details">
                        ${note.appetite_rating ? `<p><strong>Appetite / Apetito:</strong> ${note.appetite_rating}</p>` : ''}
                        ${note.fluid_intake ? `<p><strong>Fluid Intake / Ingesta de Líquidos:</strong> ${note.fluid_intake}</p>` : ''}
                        ${note.meal_breakfast ? `<p><strong>Breakfast / Desayuno:</strong> ${note.meal_breakfast}</p>` : ''}
                        ${note.meal_lunch ? `<p><strong>Lunch / Almuerzo:</strong> ${note.meal_lunch}</p>` : ''}
                        ${note.meal_dinner ? `<p><strong>Dinner / Cena:</strong> ${note.meal_dinner}</p>` : ''}
                        ${note.toileting ? `<p><strong>Toileting / Uso de Baño:</strong> ${note.toileting}</p>` : ''}
                        ${note.mobility ? `<p><strong>Mobility / Movilidad:</strong> ${note.mobility}</p>` : ''}
                        ${note.pain_level ? `<p><strong>Pain Level / Nivel de Dolor:</strong> ${note.pain_level}${note.pain_location ? ` - ${note.pain_location}` : ''}</p>` : ''}
                        ${note.skin_condition ? `<p><strong>Skin Condition / Condición de la Piel:</strong> ${note.skin_condition}</p>` : ''}
                        ${note.sleep_hours ? `<p><strong>Sleep / Sueño:</strong> ${note.sleep_hours} hours / horas</p>` : ''}
                        ${note.sleep_quality ? `<p><strong>Sleep Quality / Calidad:</strong> ${note.sleep_quality}</p>` : ''}
                        ${note.mood ? `<p><strong>Mood / Estado de Ánimo:</strong> ${note.mood}</p>` : ''}
                        ${note.activities ? `<p><strong>Activities / Actividades:</strong> ${note.activities}</p>` : ''}
                        ${note.general_notes ? `<p><strong>Notes / Notas:</strong> ${note.general_notes}</p>` : ''}
                        <p><strong>Recorded by / Registrado por:</strong> ${note.staff_name || 'N/A'}</p>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="editCareNote(${note.id})">Edit / Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCareNote(${note.id})">Delete / Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');
        console.log('✅ Care notes rendered successfully');
    } catch (error) {
        console.error('❌ Error loading care notes:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state" style="padding: 2rem; text-align: center; color: #d32f2f;">
                <p>Error loading care notes / Error al cargar notas de cuidado</p>
                <p style="margin-top: 0.5rem; font-size: 0.9em;">${error.message}</p>
            </div>`;
        }
        showMessage('Error loading care notes / Error al cargar notas de cuidado: ' + error.message, 'error');
    }
}

async function editCareNote(id) {
    try {
        editingCareNoteId = id;
        const response = await fetch(`/api/care-notes/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`Failed to load care note: ${response.status}`);

        const note = await response.json();

        document.getElementById('careNoteDate').value = note.note_date || '';
        document.getElementById('careNoteTime').value = note.note_time || '';
        document.getElementById('careNoteShift').value = note.shift || '';
        document.getElementById('appetiteRating').value = note.appetite_rating || '';
        document.getElementById('fluidIntake').value = note.fluid_intake || '';
        document.getElementById('mealBreakfast').value = note.meal_breakfast || '';
        document.getElementById('mealLunch').value = note.meal_lunch || '';
        document.getElementById('mealDinner').value = note.meal_dinner || '';
        document.getElementById('mealSnacks').value = note.meal_snacks || '';
        document.getElementById('bathing').value = note.bathing || '';
        document.getElementById('hygiene').value = note.hygiene || '';
        document.getElementById('toileting').value = note.toileting || '';
        document.getElementById('mobility').value = note.mobility || '';
        document.getElementById('painLevel').value = note.pain_level || '';
        document.getElementById('painLocation').value = note.pain_location || '';
        document.getElementById('skinCondition').value = note.skin_condition || '';
        document.getElementById('sleepHours').value = note.sleep_hours || '';
        document.getElementById('sleepQuality').value = note.sleep_quality || '';
        document.getElementById('mood').value = note.mood || '';
        document.getElementById('behaviorNotes').value = note.behavior_notes || '';
        document.getElementById('activities').value = note.activities || '';
        document.getElementById('generalNotes').value = note.general_notes || '';

        document.getElementById('careNoteFormTitle').textContent = t('carenote.edit');
        replaceDualLanguageText();
        document.getElementById('careNoteForm').style.display = 'block';
        document.getElementById('careNoteForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error loading care note:', error);
        showMessage('Error loading care note / Error al cargar nota de cuidado', 'error');
    }
}

async function saveCareNote(event) {
    event.preventDefault();

    const careNoteData = {
        resident_id: currentResidentId,
        note_date: document.getElementById('careNoteDate').value,
        note_time: document.getElementById('careNoteTime').value || null,
        shift: document.getElementById('careNoteShift').value,
        meal_breakfast: document.getElementById('mealBreakfast').value,
        meal_lunch: document.getElementById('mealLunch').value,
        meal_dinner: document.getElementById('mealDinner').value,
        meal_snacks: document.getElementById('mealSnacks').value,
        appetite_rating: document.getElementById('appetiteRating').value,
        fluid_intake: document.getElementById('fluidIntake').value,
        bathing: document.getElementById('bathing').value,
        hygiene: document.getElementById('hygiene').value,
        toileting: document.getElementById('toileting').value,
        mobility: document.getElementById('mobility').value,
        pain_level: document.getElementById('painLevel').value,
        pain_location: document.getElementById('painLocation').value,
        skin_condition: document.getElementById('skinCondition').value,
        sleep_hours: document.getElementById('sleepHours').value || null,
        sleep_quality: document.getElementById('sleepQuality').value,
        mood: document.getElementById('mood').value,
        behavior_notes: document.getElementById('behaviorNotes').value,
        activities: document.getElementById('activities').value,
        general_notes: document.getElementById('generalNotes').value
    };

    try {
        const url = editingCareNoteId ? `/api/care-notes/${editingCareNoteId}` : '/api/care-notes';
        const method = editingCareNoteId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(careNoteData)
        });

        if (response.ok) {
            showMessage(
                editingCareNoteId ? 'Care note updated successfully / Nota actualizada exitosamente' :
                'Care note created successfully / Nota creada exitosamente',
                'success'
            );
            hideCareNoteForm();
            loadCareNotes();
        } else {
            const errorData = await response.json();
            showMessage(errorData.error || 'Error saving care note / Error al guardar nota', 'error');
        }
    } catch (error) {
        console.error('Error saving care note:', error);
        showMessage('Error saving care note / Error al guardar nota', 'error');
    }
}

async function deleteCareNote(id) {
    if (!confirm('Are you sure you want to delete this care note? / ¿Está seguro de que desea eliminar esta nota?')) return;

    try {
        const response = await fetch(`/api/care-notes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showMessage('Care note deleted successfully / Nota eliminada exitosamente', 'success');
            loadCareNotes();
        } else {
            showMessage('Error deleting care note / Error al eliminar nota', 'error');
        }
    } catch (error) {
        console.error('Error deleting care note:', error);
        showMessage('Error deleting care note / Error al eliminar nota', 'error');
    }
}

// Notifications Management
let notificationsData = [];

async function loadNotifications() {
    try {
        const url = currentResidentId ? `/api/notifications?resident_id=${currentResidentId}&unread_only=true` : '/api/notifications?unread_only=true';
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) return;

        notificationsData = await response.json();
        updateNotificationBadge();
        updateNotificationsDropdown();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = notificationsData.filter(n => !n.read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function updateNotificationsDropdown() {
    const list = document.getElementById('notificationsList');
    if (!list) return;

    if (notificationsData.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding: 1rem; text-align: center; color: var(--dark-gray);">No notifications / Sin notificaciones</div>';
        return;
    }

    list.innerHTML = notificationsData.slice(0, 10).map(notif => {
        const date = new Date(notif.created_at);
        const priorityClass = notif.priority || 'normal';
        return `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}" onclick="handleNotificationClick(${notif.id}, '${notif.action_url || ''}')">
                <div class="notification-title">
                    ${notif.title}
                    <span class="notification-priority ${priorityClass}">${priorityClass}</span>
                </div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${date.toLocaleString()}</div>
            </div>
        `;
    }).join('');
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        if (dropdown.style.display === 'block') {
            loadNotifications();
        }
    }
}

async function handleNotificationClick(id, actionUrl) {
    // Mark as read
    try {
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
    } catch (e) { console.error('Error marking notification read:', e); }

    // Navigate if action URL provided
    if (actionUrl) {
        showPage(actionUrl);
    }

    // Reload notifications
    loadNotifications();
}

async function markAllNotificationsRead() {
    try {
        const url = currentResidentId ? `/api/notifications/read-all` : '/api/notifications/read-all';
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ resident_id: currentResidentId })
        });

        if (response.ok) {
            showMessage('All notifications marked as read / Todas las notificaciones marcadas como leídas', 'success');
            loadNotifications();
            loadNotificationsPage();
        }
    } catch (error) {
        console.error('Error marking notifications read:', error);
    }
}

async function loadNotificationsPage() {
    try {
        const url = currentResidentId ? `/api/notifications?resident_id=${currentResidentId}` : '/api/notifications';
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) throw new Error(`Failed to load notifications: ${response.status}`);

        const notifications = await response.json();
        const container = document.getElementById('notificationsPageList');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = '<div class="empty-state">No notifications found. / No se encontraron notificaciones.</div>';
            return;
        }

        container.innerHTML = notifications.map(notif => {
            const date = new Date(notif.created_at);
            const priorityClass = notif.priority || 'normal';
            return `
                <div class="item-card ${notif.read ? '' : 'unread'}" style="${notif.read ? '' : 'border-left: 4px solid var(--primary-color);'}">
                    <div class="item-header">
                        <h3>${notif.title}</h3>
                        <span class="notification-priority ${priorityClass}">${priorityClass}</span>
                    </div>
                    <div class="item-details">
                        <p>${notif.message}</p>
                        <p><strong>Type / Tipo:</strong> ${notif.notification_type || 'general'}</p>
                        <p><strong>Date / Fecha:</strong> ${date.toLocaleString()}</p>
                        ${notif.read ? '<p><strong>Status / Estado:</strong> Read / Leída</p>' : '<p><strong>Status / Estado:</strong> Unread / No Leída</p>'}
                    </div>
                    <div class="item-actions">
                        ${!notif.read ? `<button class="btn btn-sm btn-primary" onclick="markNotificationRead(${notif.id})">Mark Read / Marcar Leída</button>` : ''}
                        ${notif.action_url ? `<button class="btn btn-sm btn-secondary" onclick="showPage('${notif.action_url}')">View / Ver</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading notifications page:', error);
        showMessage('Error loading notifications / Error al cargar notificaciones', 'error');
    }
}

async function markNotificationRead(id) {
    try {
        const response = await fetch(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            loadNotifications();
            loadNotificationsPage();
        }
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

// History / Journal
function formatJournalType(entryType) {
    if (!entryType) return 'General';
    const t = String(entryType).replace(/_/g, ' ');
    return t.replace(/\b\w/g, c => c.toUpperCase());
}

function formatHistoryDayPill(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = dateObj.toLocaleDateString(undefined, { month: 'short' });
    const year = String(dateObj.getFullYear());
    return `${weekday}, ${day}-${month}-${year}`;
}

function parseJournalDate(value) {
    if (!value) return null;

    // Accept Date objects
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    // Accept numeric timestamps (ms since epoch)
    if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    // Strings: handle SQLite-style timestamps that Safari often fails to parse.
    const raw = String(value).trim();
    if (!raw) return null;

    let normalized = raw;

    // Convert "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(normalized)) {
        normalized = normalized.replace(' ', 'T');
    }

    // If it's ISO without timezone, add Z (treat as UTC)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
        normalized = normalized + 'Z';
    }

    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
}

function getEntryDate(entry) {
    const when = entry.occurred_at || entry.created_at;
    return parseJournalDate(when);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function closeCareNotePreviewModal() {
    const existing = document.getElementById('careNotePreviewModal');
    if (existing) existing.remove();
}

async function openCareNotePreviewModal(noteId) {
    closeCareNotePreviewModal();
    const modal = document.createElement('div');
    modal.id = 'careNotePreviewModal';
    modal.className = 'modal';
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCareNotePreviewModal();
    });

    const card = document.createElement('div');
    card.className = 'login-card';
    card.innerHTML = `
        <div class="form-card" style="max-width: 720px; margin: 0 auto;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap: 0.75rem;">
                <h3 style="margin:0;">Care Note</h3>
                <button type="button" class="btn btn-secondary" id="closeCareNotePreviewBtn">Close</button>
            </div>
            <div id="careNotePreviewBody" style="margin-top: 0.85rem;">
                <div class="empty-state">Loading…</div>
            </div>
        </div>
    `;
    modal.appendChild(card);
    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeCareNotePreviewBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeCareNotePreviewModal);

    const bodyEl = document.getElementById('careNotePreviewBody');
    if (!bodyEl) return;

    try {
        const res = await fetch(`/api/care-notes/${noteId}`, { headers: getAuthHeaders() });
        if (!res.ok) {
            bodyEl.innerHTML = '<div class="empty-state">Unable to load care note.</div>';
            return;
        }
        const note = await res.json();

        const noteDate = note.note_date || '';
        const noteTime = note.note_time || '';
        const when = (noteDate && noteTime) ? `${noteDate} ${noteTime}` : (noteDate || note.created_at || '');
        const shift = (note.shift || '').trim();
        const staff = note.staff_name || '';
        const resident = note.resident_name || '';
        const general = (note.general_notes || '').trim();

        const renderRow = (label, value) => {
            const v = (value === null || value === undefined) ? '' : String(value).trim();
            if (!v) return '';
            return `<div class="history-entry-details"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(v)}</div>`;
        };

        const sections = [];

        const meals = [
            renderRow('Breakfast', note.meal_breakfast),
            renderRow('Lunch', note.meal_lunch),
            renderRow('Dinner', note.meal_dinner),
            renderRow('Snacks', note.meal_snacks),
            renderRow('Appetite', note.appetite_rating),
            renderRow('Fluids', note.fluid_intake)
        ].filter(Boolean).join('');
        if (meals) {
            sections.push(`<div class="form-section"><h4>Meals</h4>${meals}</div>`);
        }

        const care = [
            renderRow('Bathing', note.bathing),
            renderRow('Hygiene', note.hygiene),
            renderRow('Toileting', note.toileting),
            renderRow('Mobility', note.mobility),
            renderRow('Skin', note.skin_condition)
        ].filter(Boolean).join('');
        if (care) {
            sections.push(`<div class="form-section"><h4>Care</h4>${care}</div>`);
        }

        const pain = [
            renderRow('Pain level', note.pain_level),
            renderRow('Pain location', note.pain_location)
        ].filter(Boolean).join('');
        if (pain) {
            sections.push(`<div class="form-section"><h4>Pain</h4>${pain}</div>`);
        }

        const sleep = [
            renderRow('Sleep hours', note.sleep_hours),
            renderRow('Sleep quality', note.sleep_quality)
        ].filter(Boolean).join('');
        if (sleep) {
            sections.push(`<div class="form-section"><h4>Sleep</h4>${sleep}</div>`);
        }

        const mood = [
            renderRow('Mood', note.mood),
            renderRow('Behavior notes', note.behavior_notes),
            renderRow('Activities', note.activities)
        ].filter(Boolean).join('');
        if (mood) {
            sections.push(`<div class="form-section"><h4>Mood & Activities</h4>${mood}</div>`);
        }

        if (general) {
            sections.push(`<div class="form-section"><h4>General Notes</h4><div style="white-space: pre-wrap;">${escapeHtml(general)}</div></div>`);
        }

        const detailsHtml = sections.length
            ? sections.join('')
            : '<div class="empty-state">(No notes)</div>';

        bodyEl.innerHTML = `
            ${resident ? `<div class="history-entry-details"><strong>Resident:</strong> ${escapeHtml(resident)}</div>` : ''}
            ${when ? `<div class="history-entry-details"><strong>Date/Time:</strong> ${escapeHtml(when)}</div>` : ''}
            ${shift ? `<div class="history-entry-details"><strong>Shift:</strong> ${escapeHtml(shift)}</div>` : ''}
            ${staff ? `<div class="history-entry-details"><strong>Staff:</strong> ${escapeHtml(staff)}</div>` : ''}
            <div style="margin-top: 0.75rem;">${detailsHtml}</div>
        `;
    } catch (e) {
        console.error('openCareNotePreviewModal error:', e);
        bodyEl.innerHTML = '<div class="empty-state">Unable to load care note.</div>';
    }
}

function bindHistoryCareNotePreview(container) {
    if (!container) return;
    if (container.dataset.careNotePreviewBound === 'true') return;

    container.addEventListener('click', (e) => {
        const btn = e.target?.closest?.('[data-care-note-id]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const idRaw = btn.getAttribute('data-care-note-id');
        if (!idRaw) return;
        const id = parseInt(idRaw, 10);
        if (!id) return;
        openCareNotePreviewModal(id);
    });

    container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const target = e.target?.closest?.('[data-care-note-id]');
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        const idRaw = target.getAttribute('data-care-note-id');
        if (!idRaw) return;
        const id = parseInt(idRaw, 10);
        if (!id) return;
        openCareNotePreviewModal(id);
    });

    container.dataset.careNotePreviewBound = 'true';
}

async function ensureHistoryResidentOptionsLoaded() {
    const residentSelect = document.getElementById('historyResidentFilter');
    if (!residentSelect) return;
    if (residentSelect.dataset.loaded === 'true') return;

    try {
        const res = await fetch('/api/residents', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const residentsRaw = await res.json();
        const residents = Array.isArray(residentsRaw) ? residentsRaw : [];

        residents.sort((a, b) => {
            const aLast = String(a?.last_name || '').toLowerCase();
            const bLast = String(b?.last_name || '').toLowerCase();
            if (aLast !== bLast) return aLast.localeCompare(bLast);
            const aFirst = String(a?.first_name || '').toLowerCase();
            const bFirst = String(b?.first_name || '').toLowerCase();
            return aFirst.localeCompare(bFirst);
        });

        const options = residents
            .filter(r => r && r.id)
            .map(r => {
                const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || String(r.id);
                const room = (r.room_number || '').trim();
                const label = room ? `${name} (Room ${room})` : name;
                return `<option value="${escapeHtml(r.id)}">${escapeHtml(label)}</option>`;
            })
            .join('');

        residentSelect.innerHTML = '<option value="">Select Resident</option>' + options;
        residentSelect.dataset.loaded = 'true';

        // Default to current resident if available
        if (currentResidentId) {
            residentSelect.value = String(currentResidentId);
        }
    } catch (e) {
        console.error('ensureHistoryResidentOptionsLoaded error:', e);
    }
}

function setupHistoryResidentFilterControls() {
    const allResidentsEl = document.getElementById('historyAllResidents');
    const residentSelect = document.getElementById('historyResidentFilter');
    if (!allResidentsEl || !residentSelect) return;
    if (allResidentsEl.dataset.bound === 'true') return;

    const syncEnabledState = () => {
        const showAll = !!allResidentsEl.checked;
        residentSelect.disabled = showAll;
        if (!showAll) {
            if (!residentSelect.dataset.loaded) {
                ensureHistoryResidentOptionsLoaded();
            }
            if (!residentSelect.value && currentResidentId) {
                residentSelect.value = String(currentResidentId);
            }
        }
    };

    allResidentsEl.addEventListener('change', () => {
        syncEnabledState();
    });

    residentSelect.addEventListener('change', () => {
        const v = (residentSelect.value || '').trim();
        if (v) {
            localStorage.setItem('currentResidentId', v);
            currentResidentId = v;
        }
    });

    allResidentsEl.dataset.bound = 'true';
    syncEnabledState();
}

async function ensureHistoryStaffOptionsLoaded() {
    const staffSelect = document.getElementById('historyStaffFilter');
    if (!staffSelect) return;
    if (staffSelect.dataset.loaded === 'true') return;

    try {
        const res = await fetch('/api/staff', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const staff = await res.json();
        const options = Array.isArray(staff)
            ? staff
                .filter(s => s && (s.active === 1 || s.active === true || s.active === undefined))
                .map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.full_name || s.username || String(s.id))}</option>`)
                .join('')
            : '';
        staffSelect.innerHTML = '<option value="">All Staff</option>' + options;
        staffSelect.dataset.loaded = 'true';
    } catch (e) {
        console.error('ensureHistoryStaffOptionsLoaded error:', e);
    }
}

function setHistoryYesterday() {
    const sinceEl = document.getElementById('historySince');
    const untilEl = document.getElementById('historyUntil');
    if (!sinceEl || !untilEl) return;

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    // datetime-local expects local time without seconds
    const toLocalInput = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    sinceEl.value = toLocalInput(start);
    untilEl.value = toLocalInput(end);
}

async function loadJournalPage() {
    try {
        const container = document.getElementById('journalPageList');
        if (!container) return;

        setupHistoryEnterKeyBehavior();

        setupHistoryResidentFilterControls();
        await ensureHistoryResidentOptionsLoaded();
        await ensureHistoryStaffOptionsLoaded();

        const allResidentsEl = document.getElementById('historyAllResidents');
        const residentEl = document.getElementById('historyResidentFilter');
        const staffEl = document.getElementById('historyStaffFilter');
        const sinceEl = document.getElementById('historySince');
        const untilEl = document.getElementById('historyUntil');

        const showAllResidents = allResidentsEl ? allResidentsEl.checked : false;
        const selectedResidentId = (residentEl?.value || '').trim();
        const staffId = (staffEl?.value || '').trim();
        const since = sinceEl?.value ? new Date(sinceEl.value).toISOString() : '';
        const until = untilEl?.value ? new Date(untilEl.value).toISOString() : '';

        const params = new URLSearchParams();
        params.set('limit', '500');
        if (!showAllResidents) {
            const residentIdToUse = selectedResidentId || (currentResidentId ? String(currentResidentId) : '');
            if (!residentIdToUse) {
                showMessage('Please select a resident / Por favor seleccione un residente', 'error');
                return;
            }
            params.set('resident_id', residentIdToUse);
        }
        if (staffId) params.set('staff_id', staffId);
        if (since) params.set('since', since);
        if (until) params.set('until', until);

        const response = await fetch(`/api/journal?${params.toString()}`, { headers: getAuthHeaders() });

        if (!response.ok) throw new Error(`Failed to load journal: ${response.status}`);

        const entriesRaw = await response.json();
        const entries = Array.isArray(entriesRaw) ? entriesRaw : [];

        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 30);
        cutoff.setHours(0, 0, 0, 0);

        const recentEntries = entries
            .map(e => ({ entry: e, dateObj: getEntryDate(e) }))
            // Keep entries even if date parsing fails (Safari + SQLite timestamps).
            // Only apply the 30-day cutoff when we have a valid date.
            .filter(x => !x.dateObj || x.dateObj >= cutoff)
            .sort((a, b) => {
                // Unknown dates go last.
                if (!a.dateObj && !b.dateObj) return 0;
                if (!a.dateObj) return 1;
                if (!b.dateObj) return -1;
                return b.dateObj - a.dateObj;
            });

        if (recentEntries.length === 0) {
            container.innerHTML = '<div class="empty-state">No history found. / No se encontró historial.</div>';
            return;
        }

        const groups = new Map();
        for (const { entry, dateObj } of recentEntries) {
            const dayKey = dateObj
                ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
                : 'unknown';
            if (!groups.has(dayKey)) groups.set(dayKey, []);
            groups.get(dayKey).push({ entry, dateObj });
        }

        const groupKeys = Array.from(groups.keys()).sort((a, b) => {
            if (a === 'unknown' && b === 'unknown') return 0;
            if (a === 'unknown') return 1;
            if (b === 'unknown') return -1;
            return a < b ? 1 : -1;
        });

        let html = '';
        if (showAllResidents || staffId || since || until) {
            html += '<div class="history-subtitle">Filtered history results:</div>';
        } else {
            html += '<div class="history-subtitle">Dose history for me over the last 30 days:</div>';
        }

        for (const key of groupKeys) {
            const items = groups.get(key) || [];
            const pillDate = items[0]?.dateObj;
            html += `
                <div class="history-day">
                    <div class="history-day-pill">${key === 'unknown' ? 'Unknown date' : escapeHtml(formatHistoryDayPill(pillDate))}</div>
                </div>
            `;

            for (const { entry, dateObj } of items) {
                const timeText = dateObj ? dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
                const staffName = entry.staff_name || 'Unknown';
                const typeLabel = formatJournalType(entry.entry_type);
                const title = entry.title || typeLabel;
                const details = entry.details || '';
                const residentName = entry.resident_name || entry.resident || '';
                const isCareNote = String(entry.entry_type || '') === 'care_note';
                const careNoteId = entry.source_id || entry.sourceId || '';

                html += `
                    <div class="history-entry-card">
                        <div class="history-entry-time">
                            <div>${escapeHtml(timeText)}</div>
                        </div>
                        <div class="history-entry-body">
                            <div class="history-entry-main">
                                <div class="history-entry-title">${escapeHtml(title)}</div>
                                ${(showAllResidents && residentName) ? `<div class="history-entry-details">Resident: ${escapeHtml(residentName)}</div>` : ''}
                                ${details ? `<div class="history-entry-details">${escapeHtml(details)}</div>` : ''}
                            </div>
                            ${isCareNote && careNoteId ? `
                                <div class="history-care-note-thumb" role="button" tabindex="0" data-care-note-id="${escapeHtml(careNoteId)}">
                                    <div class="history-care-note-thumb-title">Care Note</div>
                                    <div class="history-care-note-thumb-body">${escapeHtml(details || 'Tap to view note')}</div>
                                </div>
                            ` : ''}
                            <div class="history-entry-meta">
                                <span class="history-entry-type">${escapeHtml(typeLabel)}</span>
                                <span class="history-entry-performer">Performed by: ${escapeHtml(staffName)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = html;
        bindHistoryCareNotePreview(container);
    } catch (error) {
        console.error('Error loading journal page:', error);
        showMessage('Error loading history / Error al cargar historial', 'error');
    }
}

function setupHistoryEnterKeyBehavior() {
    const historyPage = document.getElementById('history');
    if (!historyPage) return;
    if (historyPage.dataset.enterBound === 'true') return;

    const ids = ['historySince', 'historyUntil', 'historyResidentFilter', 'historyStaffFilter', 'historyEmailTo'];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            e.stopPropagation();

            // On filter fields, Enter should refresh the list.
            // On the email field, do nothing (avoid surprising sends).
            if (id !== 'historyEmailTo') {
                loadJournalPage();
            }
        });
    });

    historyPage.dataset.enterBound = 'true';
}

// Reports & Analytics
async function loadReportsAnalytics() {
    try {
        // Load statistics
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

        // Load incidents this month
        const incidentsRes = await fetch(`/api/incidents?resident_id=${currentResidentId || ''}`, { headers: getAuthHeaders() });
        if (incidentsRes.ok) {
            const incidents = await incidentsRes.json();
            const thisMonth = incidents.filter(i => i.incident_date >= monthStart);
            const totalIncidents = document.getElementById('totalIncidents');
            if (totalIncidents) totalIncidents.textContent = thisMonth.length;
        }

        // Load care notes this month
        const notesRes = await fetch(`/api/care-notes?resident_id=${currentResidentId || ''}`, { headers: getAuthHeaders() });
        if (notesRes.ok) {
            const notes = await notesRes.json();
            const thisMonth = notes.filter(n => n.note_date >= monthStart);
            const totalCareNotes = document.getElementById('totalCareNotes');
            if (totalCareNotes) totalCareNotes.textContent = thisMonth.length;
        }

        // Load medications due today
        if (currentResidentId) {
            const medsRes = await fetch(`/api/medications?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
            if (medsRes.ok) {
                const meds = await medsRes.json();
                const medicationsDue = document.getElementById('medicationsDue');
                if (medicationsDue) medicationsDue.textContent = meds.filter(m => m.active).length;
            }
        }

        // Load appointments this week
        if (currentResidentId) {
            const appsRes = await fetch(`/api/appointments?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
            if (appsRes.ok) {
                const apps = await appsRes.json();
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                const thisWeek = apps.filter(a => {
                    const appDate = new Date(a.date);
                    return appDate >= new Date() && appDate <= weekFromNow;
                });
                const upcomingAppointments = document.getElementById('upcomingAppointments');
                if (upcomingAppointments) upcomingAppointments.textContent = thisWeek.length;
            }
        }
    } catch (error) {
        console.error('Error loading reports analytics:', error);
    }
}

async function generateReport(event) {
    event.preventDefault();

    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;

    if (!reportType) {
        showMessage('Please select a report type / Por favor seleccione un tipo de reporte', 'error');
        return;
    }

    try {
        let data = [];
        let title = '';

        // Collect data based on report type
        switch(reportType) {
            case 'journal':
                {
                    const sinceEl = document.getElementById('journalSince');
                    const untilEl = document.getElementById('journalUntil');
                    const staffEl = document.getElementById('journalStaff');
                    const since = sinceEl?.value ? new Date(sinceEl.value).toISOString() : '';
                    const until = untilEl?.value ? new Date(untilEl.value).toISOString() : '';
                    const staffId = staffEl?.value || '';

                    const params = new URLSearchParams();
                    if (currentResidentId) params.set('resident_id', String(currentResidentId));
                    if (since) params.set('since', since);
                    if (until) params.set('until', until);
                    if (staffId) params.set('staff_id', staffId);

                    const res = await fetch(`/api/reports/journal?${params.toString()}`, { headers: getAuthHeaders() });
                    if (res.ok) {
                        data = await res.json();
                    }
                    title = 'Journal Report / Reporte de Diario';
                }
                break;
            case 'incidents':
                const incidentsRes = await fetch(`/api/incidents?resident_id=${currentResidentId || ''}`, { headers: getAuthHeaders() });
                if (incidentsRes.ok) {
                    data = await incidentsRes.json();
                    if (dateFrom) data = data.filter(d => d.incident_date >= dateFrom);
                    if (dateTo) data = data.filter(d => d.incident_date <= dateTo);
                }
                title = 'Incident Report / Reporte de Incidentes';
                break;
            case 'care_notes':
                const notesRes = await fetch(`/api/care-notes?resident_id=${currentResidentId || ''}`, { headers: getAuthHeaders() });
                if (notesRes.ok) {
                    data = await notesRes.json();
                    if (dateFrom) data = data.filter(d => d.note_date >= dateFrom);
                    if (dateTo) data = data.filter(d => d.note_date <= dateTo);
                }
                title = 'Care Notes Summary / Resumen de Notas de Cuidado';
                break;
            case 'medications':
                if (currentResidentId) {
                    const medsRes = await fetch(`/api/medications?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
                    if (medsRes.ok) data = await medsRes.json();
                }
                title = 'Medication Report / Reporte de Medicamentos';
                break;
            case 'appointments':
                if (currentResidentId) {
                    const appsRes = await fetch(`/api/appointments?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
                    if (appsRes.ok) {
                        data = await appsRes.json();
                        if (dateFrom) data = data.filter(d => d.date >= dateFrom);
                        if (dateTo) data = data.filter(d => d.date <= dateTo);
                    }
                }
                title = 'Appointments Report / Reporte de Citas';
                break;
            case 'vital_signs':
                if (currentResidentId) {
                    const vitalsRes = await fetch(`/api/vital-signs?resident_id=${currentResidentId}`, { headers: getAuthHeaders() });
                    if (vitalsRes.ok) {
                        data = await vitalsRes.json();
                        if (dateFrom) data = data.filter(d => d.recorded_at >= dateFrom);
                        if (dateTo) data = data.filter(d => d.recorded_at <= dateTo);
                    }
                }
                title = 'Vital Signs Report / Reporte de Signos Vitales';
                break;
            case 'comprehensive':
                title = 'Comprehensive Report / Reporte Integral';
                break;
        }

        // Render preview (Option A: Print -> Save as PDF)
        renderReportPreview({ title, reportType, dateFrom, dateTo, data });
        showMessage('Preview generated / Vista previa generada', 'success');

    } catch (error) {
        console.error('Error generating report:', error);
        showMessage('Error generating report / Error al generar reporte', 'error');
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function ensureJournalStaffOptionsLoaded() {
    const staffSelect = document.getElementById('journalStaff');
    if (!staffSelect) return;
    if (staffSelect.dataset.loaded === 'true') return;

    try {
        const res = await fetch('/api/staff', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const staff = await res.json();
        staffSelect.innerHTML = '<option value="">All Staff</option>' +
            (Array.isArray(staff)
                ? staff.map(s => `<option value="${s.id}">${escapeHtml(s.full_name || s.username || ('Staff ' + s.id))}</option>`).join('')
                : '');
        staffSelect.dataset.loaded = 'true';
    } catch {
        // ignore
    }
}

function handleReportTypeChange() {
    const typeEl = document.getElementById('reportType');
    const extras = document.getElementById('journalReportExtras');
    if (!typeEl || !extras) return;

    if (typeEl.value === 'journal') {
        extras.style.display = 'block';
        ensureJournalStaffOptionsLoaded();
    } else {
        extras.style.display = 'none';
    }
}

async function downloadJournalPdf() {
    try {
        const sinceEl = document.getElementById('journalSince');
        const untilEl = document.getElementById('journalUntil');
        const staffEl = document.getElementById('journalStaff');
        const since = sinceEl?.value ? new Date(sinceEl.value).toISOString() : null;
        const until = untilEl?.value ? new Date(untilEl.value).toISOString() : null;
        const staffId = staffEl?.value || null;

        const payload = {
            resident_id: currentResidentId || null,
            staff_id: staffId,
            since,
            until
        };

        const res = await fetch('/api/reports/journal/pdf', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to generate PDF', 'error');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal_report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('downloadJournalPdf error:', e);
        showMessage('Failed to download PDF', 'error');
    }
}

async function emailJournalPdf() {
    try {
        const toEl = document.getElementById('journalEmailTo');
        const toEmail = (toEl?.value || '').trim();
        if (!toEmail) {
            showMessage('Please enter an email address', 'error');
            return;
        }

        const sinceEl = document.getElementById('journalSince');
        const untilEl = document.getElementById('journalUntil');
        const staffEl = document.getElementById('journalStaff');
        const since = sinceEl?.value ? new Date(sinceEl.value).toISOString() : null;
        const until = untilEl?.value ? new Date(untilEl.value).toISOString() : null;
        const staffId = staffEl?.value || null;

        const payload = {
            to_email: toEmail,
            resident_id: currentResidentId || null,
            staff_id: staffId,
            since,
            until
        };

        const res = await fetch('/api/reports/journal/email', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to email PDF', 'error');
            return;
        }
        showMessage('Report emailed successfully', 'success');
    } catch (e) {
        console.error('emailJournalPdf error:', e);
        showMessage('Failed to email PDF', 'error');
    }
}

function getHistoryJournalReportPayload() {
    const allResidentsEl = document.getElementById('historyAllResidents');
    const residentEl = document.getElementById('historyResidentFilter');
    const staffEl = document.getElementById('historyStaffFilter');
    const sinceEl = document.getElementById('historySince');
    const untilEl = document.getElementById('historyUntil');

    const showAllResidents = allResidentsEl ? allResidentsEl.checked : false;
    const selectedResidentId = (residentEl?.value || '').trim();
    const staffId = (staffEl?.value || '').trim();
    const since = sinceEl?.value ? new Date(sinceEl.value).toISOString() : null;
    const until = untilEl?.value ? new Date(untilEl.value).toISOString() : null;

    let residentIdToUse = null;
    if (!showAllResidents) {
        residentIdToUse = selectedResidentId || (currentResidentId ? String(currentResidentId) : '');
        if (!residentIdToUse) {
            showMessage('Please select a resident / Por favor seleccione un residente', 'error');
            return null;
        }
    }

    return {
        resident_id: residentIdToUse || null,
        staff_id: staffId || null,
        since,
        until
    };
}

async function downloadHistoryJournalPdf() {
    try {
        const payload = getHistoryJournalReportPayload();
        if (!payload) return;

        const res = await fetch('/api/reports/journal/pdf', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to generate PDF', 'error');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal_report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error('downloadHistoryJournalPdf error:', e);
        showMessage('Failed to download PDF', 'error');
    }
}

async function printHistoryJournalPdf() {
    try {
        const payload = getHistoryJournalReportPayload();
        if (!payload) return;

        // Open a window synchronously to avoid popup blockers.
        // Safari often shows a blank print preview if we call print() before the PDF viewer finishes loading.
        const w = window.open('', '_blank');
        if (!w) {
            showMessage('Popup blocked. Please allow popups to print.', 'error');
            return;
        }

        const res = await fetch('/api/reports/journal/pdf', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to generate PDF', 'error');
            try { w.close(); } catch { /* ignore */ }
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const revoke = () => {
            try { URL.revokeObjectURL(url); } catch { /* ignore */ }
        };

        // Render into an iframe and print when iframe loads (more reliable on Safari than window load for PDFs).
        try {
            w.document.open();
            w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Print</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; }
      iframe { width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe id="pdfFrame" src="${url}"></iframe>
  </body>
</html>`);
            w.document.close();
        } catch {
            // Fallback: navigate directly (still works in many browsers).
            try { w.location.href = url; } catch { /* ignore */ }
        }

        const cleanup = () => {
            setTimeout(revoke, 1000);
        };

        const doPrint = () => {
            try {
                w.focus();
                w.print();
            } finally {
                setTimeout(cleanup, 1500);
            }
        };

        // Best-effort: iframe onload; plus a timeout fallback.
        try {
            const frame = w.document.getElementById('pdfFrame');
            if (frame) {
                frame.addEventListener('load', () => setTimeout(doPrint, 150), { once: true });
            }
        } catch { /* ignore */ }

        setTimeout(() => {
            try { doPrint(); } catch { /* ignore */ }
        }, 1500);
    } catch (e) {
        console.error('printHistoryJournalPdf error:', e);
        showMessage('Failed to print PDF', 'error');
    }
}

async function emailHistoryJournalPdf() {
    try {
        const toEl = document.getElementById('historyEmailTo');
        const toEmail = (toEl?.value || '').trim();
        if (!toEmail) {
            showMessage('Please enter an email address', 'error');
            return;
        }

        const payload = getHistoryJournalReportPayload();
        if (!payload) return;
        payload.to_email = toEmail;

        const res = await fetch('/api/reports/journal/email', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showMessage(err.error || 'Failed to email PDF', 'error');
            return;
        }

        showMessage('Report emailed successfully', 'success');
    } catch (e) {
        console.error('emailHistoryJournalPdf error:', e);
        showMessage('Failed to email PDF', 'error');
    }
}

function buildSimpleTable(data, columns) {
    if (!Array.isArray(data) || data.length === 0) {
        return '<div style="padding: 0.75rem; color: #666;">No records found for the selected filters.</div>';
    }

    const header = columns.map(c => `<th style="text-align:left; padding: 0.5rem; border-bottom: 1px solid #ddd;">${escapeHtml(c.label)}</th>`).join('');
    const rows = data.map(item => {
        const tds = columns.map(c => {
            const raw = typeof c.value === 'function' ? c.value(item) : item?.[c.key];
            return `<td style="padding: 0.5rem; border-bottom: 1px solid #eee; vertical-align: top;">${escapeHtml(raw)}</td>`;
        }).join('');
        return `<tr>${tds}</tr>`;
    }).join('');

    return `
        <div style="overflow:auto;">
            <table style="width:100%; border-collapse: collapse;">
                <thead><tr>${header}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function renderReportPreview({ title, reportType, dateFrom, dateTo, data }) {
    const card = document.getElementById('reportPreviewCard');
    const titleEl = document.getElementById('reportPreviewTitle');
    const metaEl = document.getElementById('reportPreviewMeta');
    const container = document.getElementById('reportPreview');

    if (!card || !titleEl || !metaEl || !container) return;

    titleEl.textContent = title;
    const rangeText = (dateFrom || dateTo)
        ? `Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`
        : 'Date Range: All';
    metaEl.textContent = `${rangeText} | Total Records: ${Array.isArray(data) ? data.length : 0}`;

    let html = '';
    switch (reportType) {
        case 'incidents':
            html = buildSimpleTable(data, [
                { key: 'incident_date', label: 'Date' },
                { key: 'resident_name', label: 'Resident' },
                { key: 'incident_type', label: 'Type' },
                { key: 'severity', label: 'Severity' },
                { key: 'location', label: 'Location' },
                { key: 'description', label: 'Description' }
            ]);
            break;
        case 'care_notes':
            html = buildSimpleTable(data, [
                { key: 'note_date', label: 'Date' },
                { key: 'shift', label: 'Shift' },
                { key: 'mood', label: 'Mood' },
                { key: 'pain_level', label: 'Pain' },
                { key: 'general_notes', label: 'Notes' }
            ]);
            break;
        case 'medications':
            html = buildSimpleTable(data, [
                { key: 'name', label: 'Medication' },
                { key: 'dosage', label: 'Dosage' },
                { key: 'frequency', label: 'Frequency' },
                { key: 'time_slots', label: 'Time Slots' },
                { key: 'hours_interval', label: 'Hours Interval' },
                { key: 'active', label: 'Active' }
            ]);
            break;
        case 'appointments':
            html = buildSimpleTable(data, [
                { key: 'date', label: 'Date' },
                { key: 'time', label: 'Time' },
                { key: 'doctor_name', label: 'Doctor' },
                { key: 'facility', label: 'Facility' },
                { key: 'purpose', label: 'Purpose' },
                { key: 'completed', label: 'Completed' }
            ]);
            break;
        case 'vital_signs':
            html = buildSimpleTable(data, [
                { key: 'recorded_at', label: 'Recorded At' },
                { key: 'systolic', label: 'SYS' },
                { key: 'diastolic', label: 'DIA' },
                { key: 'heart_rate', label: 'HR' },
                { key: 'temperature', label: 'Temp' },
                { key: 'glucose', label: 'Glucose' },
                { key: 'weight', label: 'Weight' },
                { key: 'notes', label: 'Notes' }
            ]);
            break;
        case 'comprehensive':
            html = '<div style="padding: 0.75rem; color: #666;">Comprehensive report preview is not implemented yet. Select a specific report type.</div>';
            break;
        default:
            html = '<div style="padding: 0.75rem; color: #666;">Please select a report type.</div>';
            break;
    }

    container.innerHTML = html;
    card.style.display = 'block';
}

function printCurrentReport() {
    const card = document.getElementById('reportPreviewCard');
    const container = document.getElementById('reportPreview');

    if (!card || card.style.display === 'none' || !container || !container.innerHTML.trim()) {
        showMessage('Generate a preview first / Genere una vista previa primero', 'error');
        return;
    }
    window.print();
}

function exportReportToCSV() {
    showMessage('CSV export coming soon / Exportación CSV próximamente', 'info');
}

// Medications
let selectedHoursInterval = 8; // Default value

function selectHour(hours) {
    selectedHoursInterval = hours;
    const input = document.getElementById('hoursIntervalInput');
    if (input) {
        input.value = hours;
    }

    // Update quick select buttons
    const buttons = document.querySelectorAll('.hours-quick-btn');
    buttons.forEach(btn => {
        const btnHours = parseInt(btn.textContent.replace('h', ''));
        if (btnHours === hours) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function selectHourFromInput() {
    const input = document.getElementById('hoursIntervalInput');
    if (input) {
        let hours = parseInt(input.value);
        if (isNaN(hours) || hours < 1) hours = 1;
        if (hours > 24) hours = 24;
        input.value = hours;
        selectHour(hours);
    }
}

function handleFrequencyChange() {
    const frequency = document.getElementById('medFrequency').value;
    const hoursIntervalGroup = document.getElementById('hoursIntervalGroup');
    const medTimesGroup = document.getElementById('medTimesGroup');
    const medTimesInput = document.getElementById('medTimes');

    if (frequency === 'At intervals') {
        hoursIntervalGroup.style.display = 'block';
        medTimesGroup.style.display = 'none';
        medTimesInput.removeAttribute('required');
        // Update quick select buttons to show current selection
        selectHour(selectedHoursInterval);
    } else {
        hoursIntervalGroup.style.display = 'none';
        medTimesGroup.style.display = 'block';
        medTimesInput.setAttribute('required', 'required');
    }
}

function handleNoEndDateChange() {
    const noEndDateCheckbox = document.getElementById('medNoEndDate');
    const endDateGroup = document.getElementById('medEndDateGroup');

    if (noEndDateCheckbox.checked) {
        endDateGroup.style.display = 'none';
        // Clear end date fields
        document.getElementById('medEndYear').value = '';
        document.getElementById('medEndMonth').value = '';
        document.getElementById('medEndDay').value = '';
        document.getElementById('medEndTime').value = '';
    } else {
        endDateGroup.style.display = 'grid';
    }
}

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
    // Reset no end date checkbox
    document.getElementById('medNoEndDate').checked = false;
    document.getElementById('medEndDateGroup').style.display = 'grid';
    // Reset hours interval
    selectedHoursInterval = 8;
    document.getElementById('hoursIntervalGroup').style.display = 'none';
    document.getElementById('medTimesGroup').style.display = 'block';
    // Update form title
    const formTitle = document.querySelector('#medicationForm h3');
    if (formTitle) {
        formTitle.textContent = t('medication.add');
    }
    replaceDualLanguageText();
}

async function editMedication(id) {
    try {
        console.log('Editing medication ID:', id);
        const response = await fetch(`${API_URL}/medications/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Medication fetch response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            if (response.status === 404) {
                showMessage('Medication not found / Medicamento no encontrado', 'error');
                return;
            }
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorData.message || 'Unknown error';
            } catch {
                errorText = await response.text();
            }
            console.error('Error fetching medication:', response.status, errorText);
            showMessage(`Error loading medication: ${errorText} / Error al cargar medicamento: ${errorText}`, 'error');
            return;
        }

        const med = await response.json();
        console.log('Medication data loaded:', med);

        editingMedicationId = id;
        document.getElementById('medicationForm').style.display = 'block';
        document.getElementById('medName').value = med.name;
        document.getElementById('medDosage').value = med.dosage;
        document.getElementById('medFrequency').value = med.frequency;

        // Handle hours_interval
        if (med.hours_interval) {
            selectedHoursInterval = med.hours_interval;
            selectHour(med.hours_interval);
        }

        // Trigger frequency change to show/hide appropriate fields
        handleFrequencyChange();

        const times = JSON.parse(med.time_slots);
        document.getElementById('medTimes').value = times.join(', ');

        if (med.start_date) {
            setDateTimeToDropdowns(med.start_date, 'medStartYear', 'medStartMonth', 'medStartDay', 'medStartTime');
        }

        // Handle end date
        if (med.end_date) {
            setDateTimeToDropdowns(med.end_date, 'medEndYear', 'medEndMonth', 'medEndDay', 'medEndTime');
            document.getElementById('medNoEndDate').checked = false;
            document.getElementById('medEndDateGroup').style.display = 'grid';
        } else {
            // No end date - check the checkbox and hide the date fields
            document.getElementById('medNoEndDate').checked = true;
            document.getElementById('medEndDateGroup').style.display = 'none';
        }

        // Update form title
        const formTitle = document.querySelector('#medicationForm h3');
        if (formTitle) {
            formTitle.textContent = t('medication.edit');
        }
        replaceDualLanguageText();

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
    document.getElementById('medNoEndDate').checked = false;
    document.getElementById('medEndDateGroup').style.display = 'grid';
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

    // Check if "No end date" is selected
    const noEndDate = document.getElementById('medNoEndDate').checked;
    const end_date = noEndDate ? null : (getDateTimeFromDropdowns('medEndYear', 'medEndMonth', 'medEndDay', 'medEndTime') || null);

    const medicationData = {
        name,
        dosage,
        frequency,
        time_slots,
        start_date,
        end_date
    };

    // Add hours_interval if frequency is "At intervals"
    if (frequency === 'At intervals') {
        medicationData.hours_interval = selectedHoursInterval;
    }

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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || errorData.message || 'Error saving medication / Error al guardar medicamento';
            console.error('Medication save error:', response.status, errorMsg);
            showMessage(errorMsg, 'error');
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
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            throw new Error(`Failed to load medications: ${response.status}`);
        }

        const medications = await response.json();

        const listContainer = document.getElementById('medicationList');
        listContainer.innerHTML = '';

        if (medications.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--dark-gray); padding: 2rem;">No medications added yet. / No hay medicamentos agregados aún.</p>';
            return;
        }

        for (const med of medications) {
            const times = JSON.parse(med.time_slots);
            const logsResponse = await fetch(`${API_URL}/medications/${med.id}/logs`, {
                headers: getAuthHeaders()
            });

            let logs = [];
            if (logsResponse.ok) {
                logs = await logsResponse.json();
            }

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
                            ${status === 'taken' ? '✓ ' + t('medication.taken') : t('medication.markTaken')}
                        </button>
                    </div>
                `;
            }).join('');

            card.innerHTML = `
                <div class="item-header">
                    <div>
                        <div class="item-title">${med.name}</div>
                        <div class="item-details">
                            <p><strong>${t('medication.dosage')}:</strong> ${med.dosage}</p>
                            <p><strong>${t('medication.frequency')}:</strong> ${med.frequency}</p>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="editMedication(${med.id})" data-translate="common.edit">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMedication(${med.id})" data-translate="common.delete">Delete</button>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <strong>${t('medication.scheduledTimes')}:</strong><br>
                    ${timesHTML}
                </div>
            `;

            listContainer.appendChild(card);
        }

        // Process any remaining dual-language text in dynamically generated content
        replaceDualLanguageText();
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
            method: 'DELETE',
            headers: getAuthHeaders()
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
    document.querySelector('#appointmentForm h3').textContent = t('appointment.add');
    replaceDualLanguageText();
}

async function editAppointment(id) {
    try {
        console.log('Editing appointment ID:', id);
        const response = await fetch(`${API_URL}/appointments/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Appointment fetch response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            if (response.status === 404) {
                showMessage('Appointment not found / Cita no encontrada', 'error');
                return;
            }
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorData.message || 'Unknown error';
            } catch {
                errorText = await response.text();
            }
            console.error('Error fetching appointment:', response.status, errorText);
            showMessage(`Error loading appointment: ${errorText} / Error al cargar cita: ${errorText}`, 'error');
            return;
        }

        const appt = await response.json();
        console.log('Appointment data loaded:', appt);

        editingAppointmentId = id;
        document.getElementById('appointmentForm').style.display = 'block';
        setDateToDropdowns(appt.date, 'apptYear', 'apptMonth', 'apptDay');
        document.getElementById('apptTime').value = appt.time;
        document.getElementById('apptDoctor').value = appt.doctor_name;
        document.getElementById('apptFacility').value = appt.facility || '';
        document.getElementById('apptPurpose').value = appt.purpose || '';
        document.getElementById('apptNotes').value = appt.notes || '';

        // Update form title
        document.querySelector('#appointmentForm h3').textContent = t('appointment.edit');
        replaceDualLanguageText();

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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || errorData.message || 'Error saving appointment / Error al guardar cita';
            console.error('Appointment save error:', response.status, errorMsg);
            showMessage(errorMsg, 'error');
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
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            throw new Error(`Failed to load appointments: ${response.status}`);
        }

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
            method: 'DELETE',
            headers: getAuthHeaders()
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
    if (formTitle) {
        formTitle.textContent = t('vitals.add');
        replaceDualLanguageText();
    }
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
        console.log('Editing vital sign ID:', id);
        const response = await fetch(`${API_URL}/vital-signs/${id}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        console.log('Vital sign fetch response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            if (response.status === 404) {
                showMessage('Vital sign not found / Signo vital no encontrado', 'error');
                return;
            }
            let errorText;
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorData.message || 'Unknown error';
            } catch {
                errorText = await response.text();
            }
            console.error('Error fetching vital sign:', response.status, errorText);
            showMessage(`Error loading vital sign: ${errorText} / Error al cargar signo vital: ${errorText}`, 'error');
            return;
        }

        const sign = await response.json();
        console.log('Vital sign data loaded:', sign);

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
        if (formTitle) {
            formTitle.textContent = t('vitals.edit');
            replaceDualLanguageText();
        }

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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || errorData.message || 'Error saving vital signs / Error al guardar signos vitales';
            console.error('Vital sign save error:', response.status, errorMsg);
            showMessage(errorMsg, 'error');
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
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('Authentication failed - token expired');
                showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentStaff');
                checkAuth();
                return;
            }
            throw new Error(`Failed to load vital signs: ${response.status}`);
        }

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
            method: 'DELETE',
            headers: getAuthHeaders()
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
        const response = await fetch(`${API_URL}/billing/balance/${currentResidentId}`, { headers: getAuthHeaders() });

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error loading account balance:', response.status, errorData);
            document.getElementById('accountBalanceCard').style.display = 'none';
            return;
        }

        const balance = await response.json();

        // Validate balance object
        if (!balance || typeof balance !== 'object' || balance.error) {
            console.error('Invalid balance data:', balance);
            document.getElementById('accountBalanceCard').style.display = 'none';
            return;
        }

        document.getElementById('accountBalanceCard').style.display = 'block';
        document.getElementById('totalBilled').textContent = `$${(balance.total_billed || 0).toFixed(2)}`;
        document.getElementById('totalPaid').textContent = `$${(balance.total_paid || 0).toFixed(2)}`;
        document.getElementById('currentBalance').textContent = `$${(balance.balance || 0).toFixed(2)}`;
        document.getElementById('currentBalance').style.color = (balance.balance || 0) >= 0 ? 'var(--success-green)' : 'var(--error-red)';
        document.getElementById('pendingAmount').textContent = `$${(balance.pending_amount || 0).toFixed(2)}`;
    } catch (error) {
        console.error('Error loading account balance:', error);
        document.getElementById('accountBalanceCard').style.display = 'none';
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
    const billFormTitle = document.getElementById('billFormTitle') || document.querySelector('#billForm h3');
    if (billFormTitle) {
        billFormTitle.textContent = t('billing.add');
        replaceDualLanguageText();
    } else {
        console.error('❌ billFormTitle element not found!');
    }
}

async function editBill(id) {
    try {
        const response = await fetch(`${API_URL}/billing/${id}`, { headers: getAuthHeaders() });

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error loading bill:', response.status, errorData);
            showMessage('Error loading bill / Error al cargar factura', 'error');
            return;
        }

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
        const billFormTitle = document.getElementById('billFormTitle') || document.querySelector('#billForm h3');
        if (billFormTitle) {
            billFormTitle.textContent = t('billing.edit');
            replaceDualLanguageText();
        } else {
            console.error('❌ billFormTitle element not found!');
        }

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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || errorData.message || 'Error saving bill / Error al guardar factura';
            console.error('Bill save error:', response.status, errorMsg);
            showMessage(errorMsg, 'error');
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
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (!response.ok) {
            console.error('Error loading billing:', response.status, response.statusText);
            const listContainer = document.getElementById('billsList');
            if (listContainer) {
                listContainer.innerHTML = '<div class="empty-state">Error loading bills / Error al cargar facturas</div>';
            }
            return;
        }

        const bills = await response.json();

        // CRITICAL: Check if bills is an array
        if (!Array.isArray(bills)) {
            console.error('Error: bills is not an array:', bills);
            const listContainer = document.getElementById('billsList');
            if (listContainer) {
                listContainer.innerHTML = '<div class="empty-state">Error: Invalid data format / Error: Formato de datos inválido</div>';
            }
            return;
        }

        const listContainer = document.getElementById('billsList');
        if (!listContainer) {
            console.error('billsList container not found');
            return;
        }

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

async function updatePaymentBillDropdown(bills) {
    const select = document.getElementById('paymentBillId');
    if (!select) {
        console.error('paymentBillId select not found');
        return;
    }
    select.innerHTML = '<option value="">-- Select bill -- / Seleccionar factura</option>';

    // Load bills if not already loaded
    if (typeof bills === 'undefined' || !Array.isArray(bills)) {
        try {
            const url = currentResidentId
                ? `${API_URL}/billing?resident_id=${currentResidentId}`
                : `${API_URL}/billing`;
            const response = await fetch(url, { headers: getAuthHeaders() });
            if (response.ok) {
                bills = await response.json();
                if (!Array.isArray(bills)) {
                    console.error('bills is not an array:', bills);
                    return;
                }
            } else {
                console.error('Error loading bills for payment form:', response.status);
                return;
            }
        } catch (error) {
            console.error('Error loading bills:', error);
            return;
        }
    }

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
    document.querySelector('#paymentForm h3').textContent = t('payment.add');
    replaceDualLanguageText();
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
        document.querySelector('#paymentForm h3').textContent = t('payment.edit');
        replaceDualLanguageText();

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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error || errorData.message || 'Error saving payment / Error al guardar pago';
            console.error('Payment save error:', response.status, errorMsg);
            showMessage(errorMsg, 'error');
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
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error loading payments:', response.status, errorData);
            const listContainer = document.getElementById('paymentsList');
            if (listContainer) {
                listContainer.innerHTML = '<div class="empty-state">Error loading payments / Error al cargar pagos</div>';
            }
            showMessage('Error loading payments / Error al cargar pagos', 'error');
            return;
        }

        const payments = await response.json();

        // Validate payments is an array
        if (!Array.isArray(payments)) {
            console.error('Error: payments is not an array:', payments);
            const listContainer = document.getElementById('paymentsList');
            if (listContainer) {
                listContainer.innerHTML = '<div class="empty-state">Error loading payments / Error al cargar pagos</div>';
            }
            showMessage('Error loading payments / Error al cargar pagos', 'error');
            return;
        }

        const listContainer = document.getElementById('paymentsList');
        if (!listContainer) {
            console.error('paymentsList container not found');
            return;
        }
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
        'billYear', 'billDueYear', 'paymentYear', 'newBirthYear', 'newBirthYearPage'
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
        { day: 'newBirthDay', month: 'newBirthMonth', year: 'newBirthYear' },
        { day: 'newBirthDayPage', month: 'newBirthMonthPage', year: 'newBirthYearPage' }
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

document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[href="#"].nav-link') : null;
    if (a) {
        e.preventDefault();
    }
}, true);

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (window.history && 'scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    } catch (e) {}

    window.updateStickyHeaderOffset = function updateStickyHeaderOffset() {
        const navbar = document.querySelector('.navbar');
        let navbarHeight = 0;
        if (navbar) {
            // Safari can over-report getBoundingClientRect() height during layout transitions.
            // offsetHeight is more stable for fixed-position elements.
            navbarHeight = navbar.offsetHeight || 0;
        }
        // Safety clamp: prevent accidental huge offsets (which look like a big blank gap).
        // Navbar can legitimately be quite tall on mobile when expanded (menu + user controls),
        // so allow a higher ceiling.
        const clamped = Math.max(0, Math.min(900, Math.ceil(navbarHeight)));
        document.documentElement.style.setProperty('--sticky-offset', `${clamped}px`);
    };

    window.updateStickyHeaderOffset();
    window.addEventListener('resize', window.updateStickyHeaderOffset);

    // Keep offset in sync when the navbar height changes (mobile menu open, wrapping rows, etc.).
    try {
        const navbar = document.querySelector('.navbar');
        if (navbar && typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => {
                if (typeof window.updateStickyHeaderOffset === 'function') {
                    window.updateStickyHeaderOffset();
                    // Some mobile browsers report intermediate heights during layout; re-check once settled.
                    setTimeout(() => {
                        try {
                            window.updateStickyHeaderOffset();
                        } catch (e) {
                            // ignore
                        }
                    }, 80);
                }
            });
            ro.observe(navbar);
        }
    } catch (e) {
        // ignore
    }

    // Load language from localStorage if available (but wait for login to use staff preferred_language)
    // Only set language from localStorage if user is not logged in yet
    if (!authToken || !currentStaff) {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
            setLanguage(savedLanguage); // Use setLanguage to ensure replaceDualLanguageText is called
        }
    }

    normalizeAuthState();
    await validateAuthOnLoad();
    normalizeAuthState();

    checkAuth();
    if (authToken && currentStaff && currentResidentId) {
        initApp();
    }
    setupDateDropdowns();

    const reportTypeEl = document.getElementById('reportType');
    if (reportTypeEl) {
        reportTypeEl.addEventListener('change', handleReportTypeChange);
        handleReportTypeChange();
    }
});

// ==================== FINANCIAL MANAGEMENT FUNCTIONS (Admin Only) ====================

// Helper function to check authentication and handle errors
function checkFinancialAuth() {
    if (!authToken || !currentStaff) {
        showMessage('Please log in to access this feature / Por favor inicie sesión para acceder a esta función', 'error');
        checkAuth();
        return false;
    }
    if (currentStaff.role !== 'admin') {
        showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
        return false;
    }
    return true;
}

// Helper function to handle API response errors
async function handleFinancialApiError(response, defaultMessage) {
    if (response.status === 401) {
        console.error('Authentication failed - token expired');
        showMessage('Session expired. Please log in again / Sesión expirada. Por favor inicie sesión nuevamente', 'error');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentStaff');
        authToken = null;
        currentStaff = null;
        checkAuth();
        return true; // Indicates auth error was handled
    }
    if (response.status === 403) {
        showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
        return true; // Indicates error was handled
    }
    return false; // Error not handled, let caller handle it
}

// Financial Tab Navigation
function showFinancialTab(tab) {
    console.log('💰 Showing financial tab:', tab);

    // Hide all tabs
    document.querySelectorAll('.financial-tab').forEach(t => {
        t.style.setProperty('display', 'none', 'important');
    });

    // Update button styles
    document.querySelectorAll('#financial .button-group button').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
    });

    // Show selected tab
    const tabElement = document.getElementById(`financial${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (tabElement) {
        tabElement.style.setProperty('display', 'block', 'important');
        tabElement.style.setProperty('visibility', 'visible', 'important');
        tabElement.style.setProperty('opacity', '1', 'important');
        tabElement.style.setProperty('min-height', '400px', 'important');
        tabElement.style.setProperty('padding', '1rem', 'important');
        tabElement.style.setProperty('background', 'white', 'important');
        console.log('✅ Tab element shown:', tabElement.id);

        // Force show all children of the tab
        Array.from(tabElement.children).forEach((child) => {
            const computedStyle = window.getComputedStyle(child);
            console.log(`  Child: ${child.tagName} ${child.id || child.className}, display: ${computedStyle.display}`);
            child.style.setProperty('display', 'block', 'important');
            child.style.setProperty('visibility', 'visible', 'important');
            child.style.setProperty('opacity', '1', 'important');

            // Special handling for form-card and item-list
            if (child.classList.contains('form-card')) {
                child.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1rem !important; padding: 1.5rem !important; background: white !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; position: relative !important; z-index: 1000 !important; min-height: 100px !important; width: 100% !important; box-sizing: border-box !important;';
                console.log('✅✅✅ FORM-CARD FORCED VISIBLE WITH CSS TEXT ✅✅✅');

                // Also ensure all children of form-card are visible (including the button and h3)
                Array.from(child.children).forEach(grandChild => {
                    if (grandChild.tagName === 'BUTTON') {
                        grandChild.style.setProperty('display', 'inline-block', 'important');
                        grandChild.style.setProperty('visibility', 'visible', 'important');
                        grandChild.style.setProperty('opacity', '1', 'important');
                        console.log('✅✅✅ BUTTON FORCED VISIBLE WITH NORMAL STYLING IN showFinancialTab ✅✅✅');
                    } else {
                        grandChild.style.setProperty('display', grandChild.tagName === 'H3' ? 'block' : 'block', 'important');
                        grandChild.style.setProperty('visibility', 'visible', 'important');
                        grandChild.style.setProperty('opacity', '1', 'important');
                    }
                });
            }
            if (child.id === 'bankAccountsList') {
                child.style.setProperty('display', 'block', 'important');
                child.style.setProperty('min-height', '200px', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('opacity', '1', 'important');
                child.style.setProperty('margin-top', '2rem', 'important');
                console.log('  ✅ bankAccountsList forced visible');

                // If empty, show empty state immediately
                if (!child.innerHTML || child.innerHTML.trim() === '') {
                    child.innerHTML = '<div class="empty-state" style="padding: 3rem; text-align: center; color: #333; background: #f5f5f5; border-radius: 8px; margin: 2rem 0; min-height: 200px; display: flex !important; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #ddd; visibility: visible !important; opacity: 1 !important;"><p style="font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: 500; color: #555;">No bank accounts found.</p><p style="color: #666; font-size: 0.95rem;">Click "Add Bank Account" above to create your first account.</p></div>';
                    console.log('  ✅✅✅ Empty state set directly in showFinancialTab ✅✅✅');
                }
            }
        });

        // Double-check visibility after a short delay
        setTimeout(() => {
            const finalStyle = window.getComputedStyle(tabElement);
            console.log(`🔍 Final tab state for ${tabElement.id}:`, {
                display: finalStyle.display,
                visibility: finalStyle.visibility,
                height: tabElement.offsetHeight,
                width: tabElement.offsetWidth
            });
        }, 50);
    } else {
        console.error('❌ Tab element not found:', `financial${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    }

    // Update button styles
    const buttonId = `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
    const button = document.getElementById(buttonId);
    if (button) {
        button.classList.remove('btn-secondary');
        button.classList.add('btn-primary');
    }

    // Load data for the tab
    if (tab === 'accounts') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // First ensure the main container and financial page don't have overflow hidden
            const mainContainer = document.querySelector('.container');
            if (mainContainer) {
                mainContainer.style.setProperty('overflow', 'visible', 'important');
                mainContainer.style.setProperty('overflow-x', 'visible', 'important');
                mainContainer.style.setProperty('overflow-y', 'visible', 'important');
            }
            const financialPage = document.getElementById('financial');
            if (financialPage) {
                financialPage.style.setProperty('overflow', 'visible', 'important');
                financialPage.style.setProperty('overflow-x', 'visible', 'important');
                financialPage.style.setProperty('overflow-y', 'visible', 'important');
            }
            const accountsTab = document.getElementById('financialAccounts');
            if (accountsTab) {
                accountsTab.style.setProperty('overflow', 'visible', 'important');
                accountsTab.style.setProperty('overflow-x', 'visible', 'important');
                accountsTab.style.setProperty('overflow-y', 'visible', 'important');
            }

        loadBankAccounts();
        }, 100);
    } else if (tab === 'transactions') {
        loadTransactions();
        loadBankAccountsForSelect('transactionBankAccount');
    } else if (tab === 'reconciliation') {
        loadBankAccountsForSelect('reconcileBankAccount');
    } else if (tab === 'receipts') {
        // Receipts tab - no initial load needed
    }
}

// Bank Accounts Functions
async function loadBankAccounts() {
    try {
        console.log('💰 loadBankAccounts() called');
        if (!checkFinancialAuth()) {
            console.error('❌ Financial auth check failed');
            return;
        }

        console.log('✅ Fetching bank accounts...');
        const response = await fetch('/api/bank-accounts', { headers: getAuthHeaders() });
        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to load bank accounts');
            if (handled) return;
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to load bank accounts');
        }
        const accounts = await response.json();
        console.log('✅ Bank accounts response:', accounts);

        const listEl = document.getElementById('bankAccountsList');
        if (!listEl) {
            console.error('❌ bankAccountsList element not found!');
            // Try to find the parent tab and make sure it's visible
            const accountsTab = document.getElementById('financialAccounts');
            if (accountsTab) {
                console.log('⚠️ Found financialAccounts tab, ensuring it\'s visible...');
                accountsTab.style.setProperty('display', 'block', 'important');
                accountsTab.style.setProperty('visibility', 'visible', 'important');
                // Try again after a short delay
                setTimeout(() => {
                    const retryEl = document.getElementById('bankAccountsList');
                    if (retryEl) {
                        console.log('✅ Found bankAccountsList on retry');
                        if (accounts.length === 0) {
                            retryEl.innerHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: #666; background: #f5f5f5; border-radius: 8px; margin: 2rem 0;"><p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No bank accounts found.</p><p>Add your first account to get started.</p></div>';
                        }
                    }
                }, 100);
            }
            return;
        }

        console.log('✅ Found bankAccountsList element, updating content...');
        // Ensure the list element is visible
        listEl.style.setProperty('display', 'block', 'important');
        listEl.style.setProperty('visibility', 'visible', 'important');
        listEl.style.setProperty('opacity', '1', 'important');
        listEl.style.setProperty('min-height', '100px', 'important');

        if (accounts.length === 0) {
            listEl.innerHTML = '<div class="empty-state" style="padding: 3rem !important; text-align: center !important; color: #333 !important; background: #f5f5f5 !important; border-radius: 8px !important; margin: 2rem 0 !important; min-height: 200px !important; height: auto !important; display: flex !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; border: 2px dashed #999 !important; visibility: visible !important; opacity: 1 !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; position: relative !important; z-index: 1000 !important;"><p style="font-size: 1.2rem !important; margin-bottom: 0.5rem !important; font-weight: 500 !important; color: #333 !important;">No bank accounts found.</p><p style="color: #666 !important; font-size: 0.95rem !important;">Click "Add Bank Account" above to create your first account.</p></div>';
            console.log('✅✅✅ Empty state message displayed with enhanced styling ✅✅✅');
            // Force the parent and list element to be visible
            listEl.style.setProperty('display', 'block', 'important');
            listEl.style.setProperty('visibility', 'visible', 'important');
            listEl.style.setProperty('opacity', '1', 'important');
            listEl.style.setProperty('min-height', '250px', 'important');
            listEl.style.setProperty('width', '100%', 'important');
            listEl.style.setProperty('position', 'relative', 'important');
            listEl.style.setProperty('z-index', '1000', 'important');
            // Also ensure parent tab is visible
            const parentTab = listEl.closest('#financialAccounts');
            if (parentTab) {
                parentTab.style.setProperty('display', 'block', 'important');
                parentTab.style.setProperty('visibility', 'visible', 'important');
                parentTab.style.setProperty('opacity', '1', 'important');
                parentTab.style.setProperty('position', 'relative', 'important');
                parentTab.style.setProperty('z-index', '999', 'important');
            }
            // Ensure form-card is visible too
            const formCard = document.querySelector('#financialAccounts .form-card');
            if (formCard) {
                formCard.style.setProperty('display', 'block', 'important');
                formCard.style.setProperty('visibility', 'visible', 'important');
                formCard.style.setProperty('opacity', '1', 'important');
                formCard.style.setProperty('background', 'white', 'important');
                formCard.style.setProperty('padding', '1.5rem', 'important');
                formCard.style.setProperty('margin-bottom', '1rem', 'important');

                // Also ensure the button inside is visible
                const addButton = formCard.querySelector('button');
                if (addButton) {
                    addButton.style.setProperty('display', 'inline-block', 'important');
                    addButton.style.setProperty('visibility', 'visible', 'important');
                    addButton.style.setProperty('opacity', '1', 'important');
                    // Force button to be positioned correctly (fix negative x position)
                    addButton.style.setProperty('position', 'relative', 'important');
                    addButton.style.setProperty('left', '0', 'important');
                    addButton.style.setProperty('right', 'auto', 'important');
                    addButton.style.setProperty('transform', 'none', 'important');
                    addButton.style.setProperty('margin-left', '0', 'important');
                    addButton.style.setProperty('margin-right', 'auto', 'important');

                    const rect = addButton.getBoundingClientRect();
                    console.log('✅✅✅ Add Bank Account button FORCED VISIBLE WITH NORMAL STYLING ✅✅✅');
                    console.log('🔍 Button text:', addButton.textContent);
                    console.log('🔍 Button computed display:', window.getComputedStyle(addButton).display);
                    console.log('🔍 Button position:', rect);

                    // Check if button is off-screen (horizontally OR vertically)
                    const isOffScreenX = rect.x < 0 || rect.x > window.innerWidth;
                    const isOffScreenY = rect.y < 0 || rect.y > window.innerHeight;

                    if (isOffScreenX || isOffScreenY) {
                        console.warn('⚠️ Button is off-screen! x:', rect.x, 'y:', rect.y, 'viewport height:', window.innerHeight);

                        // If button is below viewport, scroll to it
                        if (isOffScreenY && rect.y > window.innerHeight) {
                            console.log('📍 Button is below viewport - skipping auto-scroll');
                        }

                        // Walk up the entire parent chain and fix ALL containers
                        let current = addButton.parentElement;
                        let level = 0;
                        while (current && current !== document.body && level < 10) {
                            const computedStyle = window.getComputedStyle(current);
                            const hasTransform = computedStyle.transform && computedStyle.transform !== 'none';
                            const hasNegativeLeft = computedStyle.left && parseFloat(computedStyle.left) < 0;

                            if (hasTransform || hasNegativeLeft || current.id === 'financialAccounts' || current.classList.contains('form-card') || current.classList.contains('financial-tab')) {
                                console.log(`🔧 Fixing parent level ${level}:`, current.tagName, current.className, current.id);
                                current.style.setProperty('position', 'relative', 'important');
                                current.style.setProperty('left', '0', 'important');
                                current.style.setProperty('right', 'auto', 'important');
                                current.style.setProperty('transform', 'none', 'important');
                                current.style.setProperty('margin-left', '0', 'important');
                                current.style.setProperty('margin-right', 'auto', 'important');
                                current.style.setProperty('width', '100%', 'important');
                                current.style.setProperty('max-width', '100%', 'important');
                                current.style.setProperty('overflow', 'visible', 'important');
                            }
                            current = current.parentElement;
                            level++;
                        }

                        // Force button to be visible by resetting all positioning
                        addButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: static !important; left: auto !important; right: auto !important; transform: none !important; margin: 1rem 0 !important; width: auto !important;';
                        console.log('✅ Button position reset to static, all parents fixed');

                        // Re-check position after fix
                        setTimeout(() => {
                            const newRect = addButton.getBoundingClientRect();
                            console.log('🔍 Button position after fix:', newRect);
                            const isStillOffScreenX = newRect.x < 0 || newRect.x > window.innerWidth;
                            const isStillOffScreenY = newRect.y < 0 || newRect.y > window.innerHeight;

                            if (isStillOffScreenX || isStillOffScreenY) {
                                console.error('❌ Button still off-screen after fix! x:', newRect.x, 'y:', newRect.y, 'viewport height:', window.innerHeight);

                                // Try scrolling to the button first
                                if (isStillOffScreenY) {
                                    console.log('📍 Button still off-screen after fix - skipping auto-scroll');
                                } else {
                                    // Only x is off-screen, use emergency fix
                                    addButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: fixed !important; top: 150px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 9999 !important; background: #2196F3 !important; color: white !important; padding: 0.75rem 1.5rem !important; border: none !important; border-radius: 4px !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;';
                                }
                            } else {
                                console.log('✅ Button is visible after fix! y:', newRect.y);
                            }
                        }, 100);
                    }

                    // Also ensure parent form-card is positioned correctly
                    if (formCard) {
                        formCard.style.setProperty('position', 'relative', 'important');
                        formCard.style.setProperty('left', '0', 'important');
                        formCard.style.setProperty('transform', 'none', 'important');
                        formCard.style.setProperty('margin-left', '0', 'important');
                        formCard.style.setProperty('width', '100%', 'important');
                        formCard.style.setProperty('max-width', '100%', 'important');
                    }

                    // Ensure accounts tab is positioned correctly
                    const accountsTab = listEl.closest('#financialAccounts');
                    if (accountsTab) {
                        accountsTab.style.setProperty('position', 'relative', 'important');
                        accountsTab.style.setProperty('left', '0', 'important');
                        accountsTab.style.setProperty('transform', 'none', 'important');
                        accountsTab.style.setProperty('width', '100%', 'important');
                        accountsTab.style.setProperty('max-width', '100%', 'important');
                        accountsTab.style.setProperty('overflow', 'visible', 'important');
                    }
                } else {
                    console.error('❌ Button not found inside form-card!');
                }
            } else {
                console.error('❌ form-card not found in financialAccounts!');
            }
            return;
        }

        listEl.innerHTML = accounts.map(account => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <h3 class="item-title">${account.account_name}</h3>
                        <p class="item-details">${account.bank_name} • ${account.account_type} • Balance: $${parseFloat(account.current_balance || 0).toFixed(2)}</p>
                        ${account.account_number ? `<p class="item-details">Account: ****${account.account_number.slice(-4)}</p>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="editBankAccount(${account.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBankAccount(${account.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        console.log('✅ Bank accounts list rendered, count:', accounts.length);

        // Ensure the Add Bank Account button is always visible, even when accounts exist
        const formCard = document.querySelector('#financialAccounts .form-card');
        if (formCard) {
            formCard.style.setProperty('display', 'block', 'important');
            formCard.style.setProperty('visibility', 'visible', 'important');
            formCard.style.setProperty('opacity', '1', 'important');

            const addButton = formCard.querySelector('button[onclick*="showBankAccountForm"]');
            if (addButton) {
                addButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 999 !important; background: #2196F3 !important; color: white !important; padding: 0.75rem 1.5rem !important; border: none !important; border-radius: 4px !important; cursor: pointer !important; margin: 1rem 0 !important;';
                addButton.style.setProperty('position', 'relative', 'important');
                addButton.style.setProperty('left', '0', 'important');
                addButton.style.setProperty('transform', 'none', 'important');
                console.log('✅ Add Bank Account button ensured visible after accounts loaded');
            }
        }
    } catch (error) {
        console.error('❌ Error loading bank accounts:', error);
        showMessage('Error loading bank accounts / Error al cargar cuentas bancarias', 'error');
    }
}

function showBankAccountForm() {
    document.getElementById('bankAccountForm').style.display = 'block';
    if (!editingBankAccountId) {
        document.getElementById('newBankAccountForm').reset();
        document.getElementById('openingBalance').value = '0.00';
    }
}

function hideBankAccountForm() {
    document.getElementById('bankAccountForm').style.display = 'none';
    editingBankAccountId = null;
    document.getElementById('newBankAccountForm').reset();

    // Ensure the Add Bank Account button remains visible after hiding the form
    const formCard = document.querySelector('#financialAccounts .form-card');
    if (formCard) {
        formCard.style.setProperty('display', 'block', 'important');
        formCard.style.setProperty('visibility', 'visible', 'important');
        formCard.style.setProperty('opacity', '1', 'important');

        const addButton = formCard.querySelector('button[onclick*="showBankAccountForm"]');
        if (addButton) {
            addButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; background: #2196F3 !important; color: white !important; padding: 0.75rem 1.5rem !important; border: none !important; border-radius: 4px !important; cursor: pointer !important; margin: 1rem 0 !important;';
            console.log('✅ Add Bank Account button ensured visible after form hidden');
        }
    }
}

let editingBankAccountId = null;

async function editBankAccount(id) {
    try {
        const response = await fetch(`/api/bank-accounts/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load bank account');
        const account = await response.json();

        editingBankAccountId = id;
        document.getElementById('accountName').value = account.account_name;
        document.getElementById('bankName').value = account.bank_name;
        document.getElementById('accountNumber').value = account.account_number || '';
        document.getElementById('routingNumber').value = account.routing_number || '';
        document.getElementById('accountType').value = account.account_type;
        document.getElementById('openingBalance').value = account.opening_balance || 0;
        document.getElementById('accountNotes').value = account.notes || '';

        showBankAccountForm();
    } catch (error) {
        console.error('Error loading bank account:', error);
        showMessage('Error loading bank account / Error al cargar cuenta bancaria', 'error');
    }
}

async function deleteBankAccount(id) {
    if (!confirm('Are you sure you want to delete this bank account? / ¿Está seguro de que desea eliminar esta cuenta bancaria?')) {
        return;
    }

    try {
        if (!checkFinancialAuth()) return;

        const response = await fetch(`/api/bank-accounts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to delete bank account');
            if (handled) return;
            throw new Error('Failed to delete bank account');
        }

        showMessage('Bank account deleted successfully / Cuenta bancaria eliminada exitosamente', 'success');
        loadBankAccounts();
    } catch (error) {
        console.error('Error deleting bank account:', error);
        showMessage('Error deleting bank account / Error al eliminar cuenta bancaria', 'error');
    }
}

async function saveBankAccount(event) {
    event.preventDefault();
    try {
        if (!checkFinancialAuth()) return;

        const accountData = {
            account_name: document.getElementById('accountName').value,
            bank_name: document.getElementById('bankName').value,
            account_number: document.getElementById('accountNumber').value,
            routing_number: document.getElementById('routingNumber').value,
            account_type: document.getElementById('accountType').value,
            opening_balance: parseFloat(document.getElementById('openingBalance').value) || 0,
            notes: document.getElementById('accountNotes').value
        };

        const url = editingBankAccountId
            ? `/api/bank-accounts/${editingBankAccountId}`
            : '/api/bank-accounts';
        const method = editingBankAccountId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(accountData)
        });

        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to save bank account');
            if (handled) return;
            throw new Error('Failed to save bank account');
        }

        showMessage(editingBankAccountId
            ? 'Bank account updated successfully / Cuenta bancaria actualizada exitosamente'
            : 'Bank account saved successfully / Cuenta bancaria guardada exitosamente', 'success');
        editingBankAccountId = null;
        hideBankAccountForm();
        loadBankAccounts();
    } catch (error) {
        console.error('Error saving bank account:', error);
        showMessage('Error saving bank account / Error al guardar cuenta bancaria', 'error');
    }
}

// Transactions Functions
async function loadTransactions() {
    try {
        if (!checkFinancialAuth()) return;

        const accountId = document.getElementById('filterTransactionAccount')?.value || '';
        const reconciled = document.getElementById('filterReconciled')?.value || '';

        let url = '/api/transactions?';
        if (accountId) url += `bank_account_id=${accountId}&`;
        if (reconciled) url += `reconciled=${reconciled}`;

        const response = await fetch(url, { headers: getAuthHeaders() });
        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to load transactions');
            if (handled) return;
            throw new Error('Failed to load transactions');
        }
        const transactions = await response.json();
        const listEl = document.getElementById('transactionsList');
        if (!listEl) return;

        if (transactions.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No transactions found.</div>';
            return;
        }

        listEl.innerHTML = transactions.map(trans => `
            <div class="item-card ${trans.reconciled ? 'completed' : ''}">
                <div class="item-header">
                    <div>
                        <h3 class="item-title">${trans.description}</h3>
                        <p class="item-details">
                            ${trans.resident_name ? `${trans.resident_name} • ` : ''}
                            ${trans.account_name} • ${trans.transaction_type} •
                            ${trans.transaction_date} •
                            <strong style="color: ${trans.transaction_type === 'deposit' ? 'var(--success-green)' : 'var(--error-red)'}">
                                ${trans.transaction_type === 'deposit' ? '+' : '-'}$${parseFloat(trans.amount).toFixed(2)}
                            </strong>
                        </p>
                        ${trans.check_number ? `<p class="item-details">Check #: ${trans.check_number}</p>` : ''}
                        ${trans.reconciled ? '<span class="badge badge-success">Reconciled</span>' : '<span class="badge badge-warning">Unreconciled</span>'}
                        ${(trans.resident_is_training === 1 || trans.resident_is_training === true || trans.resident_is_training === '1') ? '<span class="badge badge-danger">TRAINING</span>' : ''}
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="editTransaction(${trans.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${trans.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading transactions:', error);
        showMessage('Error loading transactions / Error al cargar transacciones', 'error');
    }
}

async function loadBankAccountsForSelect(selectId) {
    try {
        if (!checkFinancialAuth()) return;

        const response = await fetch('/api/bank-accounts', { headers: getAuthHeaders() });
        if (!response.ok) {
            await handleFinancialApiError(response, 'Failed to load bank accounts');
            return;
        }
        const accounts = await response.json();
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">Select Account / Seleccionar Cuenta</option>' +
            accounts.map(acc => `<option value="${acc.id}">${acc.account_name} (${acc.bank_name})</option>`).join('');

        // Also populate filter selects
        if (selectId === 'transactionBankAccount') {
            const filterSelect = document.getElementById('filterTransactionAccount');
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">All Accounts / Todas las Cuentas</option>' +
                    accounts.map(acc => `<option value="${acc.id}">${acc.account_name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading bank accounts for select:', error);
    }
}

function showTransactionForm() {
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    document.getElementById('transactionForm').style.display = 'block';
    if (!editingTransactionId) {
        document.getElementById('newTransactionForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transactionDate').value = today;
    }
    loadBankAccountsForSelect('transactionBankAccount');
}

function hideTransactionForm() {
    document.getElementById('transactionForm').style.display = 'none';
    editingTransactionId = null;
    document.getElementById('newTransactionForm').reset();
}

let editingTransactionId = null;

async function editTransaction(id) {
    try {
        const response = await fetch(`/api/transactions?bank_account_id=`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load transactions');
        const transactions = await response.json();
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) throw new Error('Transaction not found');

        editingTransactionId = id;
        document.getElementById('transactionBankAccount').value = transaction.bank_account_id;
        document.getElementById('transactionDate').value = transaction.transaction_date;
        document.getElementById('transactionType').value = transaction.transaction_type;
        document.getElementById('transactionDescription').value = transaction.description;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionCheckNumber').value = transaction.check_number || '';
        document.getElementById('transactionPayee').value = transaction.payee || '';
        document.getElementById('transactionCategory').value = transaction.category || '';
        document.getElementById('transactionNotes').value = transaction.notes || '';

        loadBankAccountsForSelect('transactionBankAccount');
        showTransactionForm();
    } catch (error) {
        console.error('Error loading transaction:', error);
        showMessage('Error loading transaction / Error al cargar transacción', 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction? / ¿Está seguro de que desea eliminar esta transacción?')) {
        return;
    }

    try {
        if (!checkFinancialAuth()) return;

        const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to delete transaction');
            if (handled) return;
            throw new Error('Failed to delete transaction');
        }

        showMessage('Transaction deleted successfully / Transacción eliminada exitosamente', 'success');
        loadTransactions();
        loadBankAccounts(); // Update account balances
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showMessage('Error deleting transaction / Error al eliminar transacción', 'error');
    }
}

async function saveTransaction(event) {
    event.preventDefault();
    try {
        if (!checkFinancialAuth()) return;

        if (!currentResidentId) {
            showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
            return;
        }

        const transactionData = {
            resident_id: currentResidentId,
            bank_account_id: parseInt(document.getElementById('transactionBankAccount').value),
            transaction_date: document.getElementById('transactionDate').value,
            transaction_type: document.getElementById('transactionType').value,
            description: document.getElementById('transactionDescription').value,
            amount: parseFloat(document.getElementById('transactionAmount').value),
            check_number: document.getElementById('transactionCheckNumber').value,
            payee: document.getElementById('transactionPayee').value,
            category: document.getElementById('transactionCategory').value,
            notes: document.getElementById('transactionNotes').value
        };

        const url = editingTransactionId
            ? `/api/transactions/${editingTransactionId}`
            : '/api/transactions';
        const method = editingTransactionId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to save transaction');
            if (handled) return;
            throw new Error('Failed to save transaction');
        }

        showMessage(editingTransactionId
            ? 'Transaction updated successfully / Transacción actualizada exitosamente'
            : 'Transaction saved successfully / Transacción guardada exitosamente', 'success');
        editingTransactionId = null;
        hideTransactionForm();
        loadTransactions();
        loadBankAccounts(); // Update account balances
    } catch (error) {
        console.error('Error saving transaction:', error);
        showMessage('Error saving transaction / Error al guardar transacción', 'error');
    }
}

// Reconciliation Functions
async function loadUnreconciledTransactions() {
    const accountId = document.getElementById('reconcileBankAccount').value;
    if (!accountId) return;

    try {
        if (!checkFinancialAuth()) return;

        // Load account balance
        const accountsResponse = await fetch('/api/bank-accounts', { headers: getAuthHeaders() });
        if (accountsResponse.ok) {
            const accounts = await accountsResponse.json();
            const account = accounts.find(a => a.id == accountId);
            if (account) {
                document.getElementById('currentAccountBalance').value = `$${parseFloat(account.current_balance || 0).toFixed(2)}`;
            }
        } else {
            await handleFinancialApiError(accountsResponse, 'Failed to load account balance');
        }

        // Load unreconciled transactions
        const response = await fetch(`/api/transactions?bank_account_id=${accountId}&reconciled=false`, { headers: getAuthHeaders() });
        if (!response.ok) {
            await handleFinancialApiError(response, 'Failed to load transactions');
            return;
        }
        const transactions = await response.json();
        const container = document.getElementById('unreconciledTransactions');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = '<p>No unreconciled transactions found.</p>';
            return;
        }

        container.innerHTML = transactions.map(trans => `
            <label style="display: flex; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--light-gray);">
                <input type="checkbox" name="reconcile_trans" value="${trans.id}" style="margin-right: 1rem;">
                <div style="flex: 1;">
                    <strong>${trans.description}</strong><br>
                    <small>${trans.transaction_date} • ${trans.transaction_type} • $${parseFloat(trans.amount).toFixed(2)}</small>
                </div>
            </label>
        `).join('');
    } catch (error) {
        console.error('Error loading unreconciled transactions:', error);
    }
}

async function reconcileAccount(event) {
    event.preventDefault();
    try {
        if (!checkFinancialAuth()) return;

        const accountId = document.getElementById('reconcileBankAccount').value;
        const selectedTransactions = Array.from(document.querySelectorAll('input[name="reconcile_trans"]:checked')).map(cb => parseInt(cb.value));

        const reconciliationData = {
            bank_account_id: parseInt(accountId),
            statement_date: document.getElementById('statementDate').value,
            statement_balance: parseFloat(document.getElementById('statementBalance').value),
            transaction_ids: selectedTransactions,
            notes: document.getElementById('reconciliationNotes').value
        };

        const response = await fetch('/api/reconciliation', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(reconciliationData)
        });

        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Failed to reconcile account');
            if (handled) return;
            throw new Error('Failed to reconcile account');
        }

        const result = await response.json();
        showMessage(`Reconciliation completed. Difference: $${result.difference.toFixed(2)} / Conciliación completada. Diferencia: $${result.difference.toFixed(2)}`, 'success');
        document.getElementById('reconciliationForm').reset();
        loadTransactions();
        loadBankAccounts();
    } catch (error) {
        console.error('Error reconciling account:', error);
        showMessage('Error reconciling account / Error al conciliar cuenta', 'error');
    }
}

// Receipt Functions
async function searchReceipt() {
    const search = document.getElementById('receiptSearch').value.trim();
    if (!search) {
        showMessage('Please enter a receipt number or payment ID / Por favor ingrese un número de recibo o ID de pago', 'error');
        return;
    }

    try {
        if (!checkFinancialAuth()) return;

        // Try as payment ID first
        let paymentId = parseInt(search);
        if (isNaN(paymentId)) {
            // Search by receipt number
            const paymentsResponse = await fetch('/api/payments', { headers: getAuthHeaders() });
            if (paymentsResponse.ok) {
                const payments = await paymentsResponse.json();
                const payment = payments.find(p => p.receipt_number === search);
                if (payment) paymentId = payment.id;
            } else {
                await handleFinancialApiError(paymentsResponse, 'Failed to search payments');
            }
        }

        if (!paymentId) {
            showMessage('Receipt not found / Recibo no encontrado', 'error');
            return;
        }

        const response = await fetch(`/api/payments/${paymentId}/receipt`, { headers: getAuthHeaders() });
        if (!response.ok) {
            const handled = await handleFinancialApiError(response, 'Receipt not found');
            if (handled) return;
            throw new Error('Receipt not found');
        }

        const receipt = await response.json();
        displayReceipt(receipt);
    } catch (error) {
        console.error('Error searching receipt:', error);
        showMessage('Error searching receipt / Error al buscar recibo', 'error');
    }
}

function displayReceipt(receipt) {
    const container = document.getElementById('receiptDisplay');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = `
        <div style="text-align: center; border: 2px solid var(--primary-color); padding: 2rem; border-radius: 8px;">
            <h2>PAYMENT RECEIPT / RECIBO DE PAGO</h2>
            <hr style="margin: 1rem 0;">
            <p><strong>Receipt Number / Número de Recibo:</strong> ${receipt.receipt_number || 'N/A'}</p>
            <p><strong>Date / Fecha:</strong> ${receipt.payment_date}</p>
            <p><strong>Resident / Residente:</strong> ${receipt.first_name} ${receipt.last_name}</p>
            ${receipt.room_number ? `<p><strong>Room / Habitación:</strong> ${receipt.room_number}</p>` : ''}
            <hr style="margin: 1rem 0;">
            <p><strong>Amount / Monto:</strong> $${parseFloat(receipt.amount).toFixed(2)}</p>
            <p><strong>Payment Method / Método de Pago:</strong> ${receipt.payment_method || 'N/A'}</p>
            ${receipt.reference_number ? `<p><strong>Reference / Referencia:</strong> ${receipt.reference_number}</p>` : ''}
            ${receipt.notes ? `<p><strong>Notes / Notas:</strong> ${receipt.notes}</p>` : ''}
            ${receipt.staff_name ? `<p><strong>Processed by / Procesado por:</strong> ${receipt.staff_name}</p>` : ''}
            <hr style="margin: 1rem 0;">
            <button class="btn btn-primary" onclick="window.print()">Print Receipt / Imprimir Recibo</button>
        </div>
    `;
}

// Initialize financial page when shown
function initFinancialPage() {
    console.log('💰💰💰 INITIALIZING FINANCIAL PAGE 💰💰💰');

    // Check authentication first
    if (!authToken || !currentStaff) {
        showMessage('Please log in to access this feature / Por favor inicie sesión para acceder a esta función', 'error');
        checkAuth();
        return;
    }

    // Check if user is admin
    if (currentStaff.role !== 'admin') {
        showMessage('Access denied. Admin privileges required. / Acceso denegado. Se requieren privilegios de administrador.', 'error');
        showPage('dashboard');
        return;
    }

    const financialPage = document.getElementById('financial');
    if (!financialPage) {
        console.error('❌ Financial page element not found!');
        return;
    }

    // CRITICAL: Check if element is actually in the DOM
    if (!financialPage.parentElement) {
        console.error('❌❌❌ FINANCIAL PAGE HAS NO PARENT! ELEMENT NOT IN DOM! ❌❌❌');
        return;
    }

    // Check if element is connected to the document
    if (!financialPage.isConnected) {
        console.error('❌❌❌ FINANCIAL PAGE NOT CONNECTED TO DOCUMENT! ❌❌❌');
        return;
    }

    console.log('✅ Financial page is in DOM, parent:', financialPage.parentElement?.tagName, financialPage.parentElement?.className);

    const financialComputedStyle = window.getComputedStyle(financialPage);
    const needsAggressiveFix =
        financialComputedStyle.display === 'none' ||
        financialComputedStyle.visibility === 'hidden' ||
        financialPage.offsetHeight === 0 ||
        financialPage.offsetWidth === 0;

    if (!needsAggressiveFix) {
        showFinancialTab('accounts');
        return;
    }

    // AGGRESSIVE FIX - Same approach as incidents page
    console.log('🔴 Starting aggressive financial page fix...');

    // Ensure main container is visible and has dimensions
    const mainContainer = financialPage.closest('main.container');
    if (mainContainer) {
        const containerHeight = mainContainer.offsetHeight;
        const containerWidth = mainContainer.offsetWidth;
        console.log('🔍 Main container dimensions:', { height: containerHeight, width: containerWidth });

        mainContainer.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; min-height: 600px !important; width: 100% !important;';

        // If container has zero dimensions, force it
        if (containerHeight === 0 || containerWidth === 0) {
            mainContainer.style.cssText += 'height: 600px !important;';
            console.log('⚠️ Main container had zero dimensions - forced height');
        }
        console.log('✅ main.container forced visible');
    }

    // Also check mainApp
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        const appHeight = mainApp.offsetHeight;
        const appWidth = mainApp.offsetWidth;
        console.log('🔍 MainApp dimensions:', { height: appHeight, width: appWidth });
        if (appHeight === 0 || appWidth === 0) {
            mainApp.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 600px !important; width: 100% !important;';
            console.log('⚠️ MainApp had zero dimensions - forced height');
        }
    }

    // Force financial page visible with cssText (same as incidents)
    financialPage.classList.add('active');
    financialPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 500px !important; width: 100% !important; overflow: visible !important; background: var(--light-gray) !important;';
    console.log('✅ Financial page forced visible with cssText');

    // Show ALL direct children using cssText
    Array.from(financialPage.children).forEach((child, index) => {
        console.log(`✅ Financial child ${index}:`, child.tagName, child.id || child.className);

        if (child.tagName === 'SCRIPT') {
            return;
        }

        let displayValue = 'block';
        if (child.tagName === 'BUTTON') {
            displayValue = 'inline-block';
        } else if (child.classList.contains('button-group')) {
            displayValue = 'flex';
        }

        const beforeHeight = child.offsetHeight;
        const beforeWidth = child.offsetWidth;
        console.log(`    Before: height=${beforeHeight}, width=${beforeWidth}`);

        // Use cssText to completely replace styles
        child.style.cssText = `display: ${displayValue} !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 1 !important; width: auto !important; height: auto !important;`;

        // Add specific styles for specific elements
        if (child.tagName === 'H2') {
            child.style.cssText += 'margin-bottom: 1rem !important; font-size: 1.5rem !important; font-weight: bold !important; min-height: 30px !important;';
        } else if (child.tagName === 'P') {
            child.style.cssText += 'margin-bottom: 2rem !important; min-height: 20px !important;';
        } else if (child.classList.contains('button-group')) {
            child.style.cssText += 'margin-bottom: 2rem !important; padding-bottom: 1rem !important; border-bottom: 2px solid var(--light-gray) !important; min-height: 50px !important;';
        } else if (child.classList.contains('financial-tab')) {
            child.style.cssText += 'min-height: 300px !important;';
        }

        const afterHeight = child.offsetHeight;
        const afterWidth = child.offsetWidth;
        console.log(`    After: height=${afterHeight}, width=${afterWidth}`);

        if (afterHeight === 0 && afterWidth === 0) {
            console.error(`    ❌❌❌ CHILD ${index} STILL HAS ZERO DIMENSIONS! ❌❌❌`);
        }
    });

    // Specifically target key elements
    const h2 = financialPage.querySelector('h2');
    const p = financialPage.querySelector('p');
    const buttonGroup = financialPage.querySelector('.button-group');
    const firstTab = financialPage.querySelector('.financial-tab');

    if (h2) {
        h2.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1rem !important; font-size: 1.5rem !important; font-weight: bold !important; min-height: 30px !important; height: auto !important;';
        console.log('✅ H2 forced visible, height:', h2.offsetHeight);
    }

    if (p) {
        p.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 2rem !important; min-height: 20px !important; height: auto !important;';
        console.log('✅ P forced visible, height:', p.offsetHeight);
    }

    if (buttonGroup) {
        buttonGroup.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 2rem !important; padding-bottom: 1rem !important; border-bottom: 2px solid var(--light-gray) !important; min-height: 50px !important; height: auto !important;';
        console.log('✅ Button group forced visible, height:', buttonGroup.offsetHeight);
    }

    if (firstTab) {
        firstTab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 300px !important; height: auto !important;';
        console.log('✅ First tab forced visible, height:', firstTab.offsetHeight);
    }

    // CRITICAL FIX: Show the first tab (accounts) by default
    // All tabs are hidden by default, so we need to explicitly show one
    console.log('🔴 CRITICAL: Showing accounts tab by default...');

    // Force ALL financial-tab divs to be visible with explicit content
    const allTabs = financialPage.querySelectorAll('.financial-tab');
    console.log('🔍 Found financial tabs:', allTabs.length);
    allTabs.forEach((tab, idx) => {
        const computedStyle = window.getComputedStyle(tab);
        console.log(`  Tab ${idx}:`, tab.id, 'display:', computedStyle.display, 'visibility:', computedStyle.visibility, 'height:', tab.offsetHeight);

        // Force visible with explicit dimensions
        tab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 400px !important; height: auto !important; width: 100% !important; background: white !important; border: 1px solid #ddd !important;';

        // Force ALL children of each tab to be visible
        Array.from(tab.children).forEach((child) => {
            child.style.setProperty('display', 'block', 'important');
            child.style.setProperty('visibility', 'visible', 'important');
            child.style.setProperty('opacity', '1', 'important');
        });

        console.log(`  After fix - Tab ${idx} height:`, tab.offsetHeight);
    });

    // Now show only the accounts tab (this will hide the others)
    showFinancialTab('accounts');

    // AGGRESSIVE: Directly ensure bankAccountsList shows empty state immediately
    setTimeout(() => {
        const bankAccountsList = document.getElementById('bankAccountsList');
        const accountsTab = document.getElementById('financialAccounts');

        if (accountsTab) {
            accountsTab.style.setProperty('display', 'block', 'important');
            accountsTab.style.setProperty('visibility', 'visible', 'important');
            accountsTab.style.setProperty('opacity', '1', 'important');
        }

        if (bankAccountsList) {
            bankAccountsList.style.setProperty('display', 'block', 'important');
            bankAccountsList.style.setProperty('visibility', 'visible', 'important');
            bankAccountsList.style.setProperty('opacity', '1', 'important');
            bankAccountsList.style.setProperty('min-height', '200px', 'important');

            // If empty, show empty state immediately
            if (!bankAccountsList.innerHTML || bankAccountsList.innerHTML.trim() === '') {
                bankAccountsList.innerHTML = '<div class="empty-state" style="padding: 3rem; text-align: center; color: #333; background: #f5f5f5; border-radius: 8px; margin: 2rem 0; min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #ddd;"><p style="font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: 500; color: #555;">No bank accounts found.</p><p style="color: #666; font-size: 0.95rem;">Click "Add Bank Account" above to create your first account.</p></div>';
                console.log('✅✅✅ EMPTY STATE SET DIRECTLY IN INITFINANCIALPAGE ✅✅✅');
            }
        } else {
            console.error('❌❌❌ bankAccountsList still not found after all fixes!');
        }
    }, 200);

    // Double-check accounts tab is visible after showFinancialTab
    setTimeout(() => {
        const accountsTab = document.getElementById('financialAccounts');
        if (accountsTab) {
            const finalStyle = window.getComputedStyle(accountsTab);
            console.log('🔍 Accounts tab final state:', {
                display: finalStyle.display,
                visibility: finalStyle.visibility,
                height: accountsTab.offsetHeight,
                width: accountsTab.offsetWidth
            });

            // If still hidden, force it
            if (finalStyle.display === 'none' || accountsTab.offsetHeight === 0) {
                console.error('⚠️ Accounts tab still hidden - forcing visible!');
                accountsTab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 400px !important; height: auto !important; width: 100% !important; background: white !important;';
            }
        }
    }, 300);

    // Verify dimensions after a delay and force if still zero
    setTimeout(() => {
        const computedHeight = financialPage.offsetHeight;
        const computedWidth = financialPage.offsetWidth;
        console.log('🔍 Final financial page dimensions:', { height: computedHeight, width: computedWidth });

        if (computedHeight === 0 || computedWidth === 0) {
            console.error('❌❌❌ FINANCIAL PAGE STILL HAS ZERO DIMENSIONS! Applying LAST RESORT FIX... ❌❌❌');

            // LAST RESORT: Force absolute positioning and explicit dimensions
            financialPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; height: 600px !important; min-height: 600px !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; background: var(--light-gray) !important; box-sizing: border-box !important;';

            // Force ALL children to have explicit heights
            Array.from(financialPage.children).forEach((child) => {
                if (child.tagName === 'SCRIPT') return;

                const childHeight = child.offsetHeight;
                if (childHeight === 0) {
                    if (child.tagName === 'H2') {
                        child.style.cssText = 'display: block !important; visibility: visible !important; height: 40px !important; min-height: 40px !important; margin-bottom: 1rem !important; font-size: 1.5rem !important;';
                    } else if (child.tagName === 'P') {
                        child.style.cssText = 'display: block !important; visibility: visible !important; height: 30px !important; min-height: 30px !important; margin-bottom: 2rem !important;';
                    } else if (child.classList.contains('button-group')) {
                        child.style.cssText = 'display: flex !important; visibility: visible !important; height: 60px !important; min-height: 60px !important; margin-bottom: 2rem !important; padding-bottom: 1rem !important;';
                    } else if (child.classList.contains('financial-tab')) {
                        child.style.cssText = 'display: block !important; visibility: visible !important; height: 400px !important; min-height: 400px !important;';
                    } else {
                        child.style.cssText = 'display: block !important; visibility: visible !important; height: auto !important; min-height: 50px !important;';
                    }
                }
            });

            // Check again after forcing
            setTimeout(() => {
                const finalHeight = financialPage.offsetHeight;
                const finalWidth = financialPage.offsetWidth;
                const computedStyle = window.getComputedStyle(financialPage);
                console.log('🔍 After last resort fix:', {
                    height: finalHeight,
                    width: finalWidth,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    position: computedStyle.position,
                    zIndex: computedStyle.zIndex
                });

                if (finalHeight > 0 && finalWidth > 0) {
                    console.log('✅✅✅ LAST RESORT FIX WORKED! ✅✅✅');
                } else {
                    console.error('❌❌❌ LAST RESORT FIX FAILED - PAGE STILL ZERO DIMENSIONS ❌❌❌');
                    console.error('🔍 Computed styles:', {
                        display: computedStyle.display,
                        visibility: computedStyle.visibility,
                        height: computedStyle.height,
                        width: computedStyle.width,
                        position: computedStyle.position,
                        top: computedStyle.top,
                        left: computedStyle.left
                    });

                    // FINAL ATTEMPT: Clone and replace the element
                    console.log('🔄 Attempting to clone and replace element...');
                    const clone = financialPage.cloneNode(true);
                    financialPage.parentElement.replaceChild(clone, financialPage);
                    clone.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; height: 600px !important; min-height: 600px !important; width: 100% !important; background: var(--light-gray) !important;';
                    console.log('✅ Element cloned and replaced');
                }
            }, 100);
        } else {
            console.log('✅✅✅ FINANCIAL PAGE HAS DIMENSIONS! ✅✅✅');
        }
    }, 200);
}

// Update showPage to handle financial page
const originalShowPage = window.showPage;
if (typeof originalShowPage === 'function') {
    // This will be handled in the existing showPage function
}
