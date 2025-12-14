// FORCE IMMEDIATE CONSOLE LOG - IF YOU SEE THIS, SCRIPT IS LOADING
console.log('%c🚀🚀🚀 SCRIPT.JS LOADED - Version 7.0 - Network Request Logging Enabled! 🚀🚀🚀', 'background: #00ff00; color: #000; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('Timestamp:', new Date().toISOString());
console.log('%c📡 TIP: Open Network tab (not Console) to see HTTP requests!', 'background: #2196F3; color: #fff; font-size: 14px; padding: 5px;');

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
        console.log(
            `%c🌐🌐🌐 NETWORK REQUEST 🌐🌐🌐\n` +
            `%c${method} ${url}\n` +
            `%cTime: ${timestamp}\n` +
            `%cCache: ${options.cache || 'default'}`,
            'background: #2196F3; color: white; font-size: 16px; font-weight: bold; padding: 10px;',
            'background: #4CAF50; color: white; font-size: 14px; padding: 5px;',
            'color: #666; font-size: 12px;',
            'color: #666; font-size: 12px;'
        );
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
        options.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
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
                `%c${method} ${url}\n` +
                `%cStatus: ${response.status} ${response.statusText}\n` +
                `%cTime: ${responseTimestamp}`,
                'background: ' + statusColor + '; color: white; font-size: 16px; font-weight: bold; padding: 10px;',
                'background: #2196F3; color: white; font-size: 14px; padding: 5px;',
                'color: ' + statusColor + '; font-size: 14px; font-weight: bold;',
                'color: #666; font-size: 12px;'
            );
            console.log('Full response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            // Clone response to read body without consuming it
            response.clone().json().then(data => {
                console.log(`%c📦 Response data:`, 'background: #FF9800; color: white; padding: 5px;', data);
            }).catch(() => {
                // Not JSON, try text
                response.clone().text().then(text => {
                    console.log(`%c📦 Response text:`, 'background: #FF9800; color: white; padding: 5px;', text.substring(0, 200));
                }).catch(() => {});
            });
            
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
        // Show Staff nav link if user is admin
        const staffNavLink = document.getElementById('staffNavLink');
        if (staffNavLink && currentStaff.role === 'admin') {
            staffNavLink.style.display = 'block';
        } else if (staffNavLink) {
            staffNavLink.style.display = 'none';
        }
        
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
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validate inputs
    if (!username || !password) {
        showMessage('Please enter both username and password / Por favor ingrese usuario y contraseña', 'error');
        return;
    }
    
    console.log('🔐 Attempting login for username:', username);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        console.log('Login response status:', response.status);
        
        // Try to parse response
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            const text = await response.text();
            console.error('Failed to parse login response:', text);
            showMessage('Server error. Please try again / Error del servidor. Por favor intente de nuevo', 'error');
            return;
        }
        
        if (response.ok) {
            console.log('✅ Login successful!', data);
            authToken = data.token;
            currentStaff = data.staff;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentStaff', JSON.stringify(currentStaff));
            
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
            
            hideLoginModal();
            showResidentSelector();
            showMessage('Login successful! / ¡Inicio de sesión exitoso!', 'success');
        } else {
            // Login failed - show error message
            const errorMsg = data.error || 'Login failed / Error de inicio de sesión';
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
        const response = await fetch('/api/residents?active_only=true', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            console.error('Residents selector API error:', response.status);
            return;
        }
        
        const residents = await response.json();
        
        const select = document.getElementById('residentSelect');
        if (!select) return;
        
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

function showAddResidentForm() {
    console.log('%c📝 showAddResidentForm() CALLED!', 'background: #ff00ff; color: #fff; font-size: 16px; padding: 5px;');
    
    // Store the current editingResidentId to prevent it from being lost
    const wasEditing = editingResidentId !== null && editingResidentId !== undefined;
    const savedEditingId = editingResidentId;
    
    console.log('showAddResidentForm called. editingResidentId:', editingResidentId, 'wasEditing:', wasEditing);
    
    // Only reset editingResidentId if it's not already set (i.e., when adding new, not editing)
    if (!wasEditing) {
        editingResidentId = null;
        
        // Reset form titles only when adding new
        const formTitleModal = document.querySelector('#addResidentForm h3');
        if (formTitleModal) {
            formTitleModal.textContent = 'Add New Resident / Agregar Nuevo Residente';
        }
        
        const formTitlePage = document.querySelector('#addResidentFormPage h3');
        if (formTitlePage) {
            formTitlePage.textContent = 'Add New Resident / Agregar Nuevo Residente';
        }
        
        // Reset forms only when adding new
        resetResidentForm();
    } else {
        // Restore editingResidentId if it was set (defensive programming)
        editingResidentId = savedEditingId;
        console.log('Preserving editingResidentId:', editingResidentId);
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
    
    // Final safeguard - restore editingResidentId if it was lost
    if (wasEditing && editingResidentId !== savedEditingId) {
        console.warn('⚠️ Restoring lost editingResidentId:', savedEditingId);
        editingResidentId = savedEditingId;
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
    const relationEl = usePageForm ? document.getElementById('newEmergencyRelationPage') : document.getElementById('newEmergencyRelation');
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
    
    const resident = {
        first_name: firstNameEl.value.trim(),
        last_name: lastNameEl.value.trim(),
        date_of_birth: dateOfBirth || null,
        gender: genderEl ? genderEl.value : '',
        room_number: roomEl ? roomEl.value : '',
        bed_number: bedEl ? bedEl.value : '',
        emergency_contact_name: emergencyEl ? emergencyEl.value : '',
        emergency_contact_phone: phoneEl ? phoneEl.value : '',
        emergency_contact_relation: relationEl ? relationEl.value : '',
        insurance_provider: insuranceProviderEl ? insuranceProviderEl.value : null,
        insurance_number: insuranceNumberEl ? insuranceNumberEl.value : null,
        medical_conditions: conditionsEl ? conditionsEl.value : '',
        allergies: allergiesEl ? allergiesEl.value : '',
        dietary_restrictions: dietaryEl ? dietaryEl.value : '',
        notes: notesEl ? notesEl.value : null,
        photo_path: photoData || null
    };
    
    console.log('Resident data to save:', resident);
    console.log('Date of birth:', dateOfBirth);
    
    try {
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
    document.getElementById('mainApp').style.display = 'block';
    initNavigation();
    loadDashboard();
    updateClock();
    setInterval(updateClock, 1000);
    initializeCalendarControls();
    initQuickWins();
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
        else if (pageName === 'staff') {
            loadStaff();
        }
        else if (pageName === 'incidents') {
            loadIncidents();
        }
        else if (pageName === 'carenotes') {
            loadCareNotes();
        }
        else if (pageName === 'notifications') {
            loadNotificationsPage();
        }
        else if (pageName === 'reports') {
            loadReportsAnalytics();
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
        const response = await fetch(url, { headers: getAuthHeaders() });
        
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
        }
        
        const apptsEl = document.getElementById('apptsToday');
        if (apptsEl) {
            apptsEl.textContent = apptsToday;
        }
        
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
                billingCard.style.display = 'block';
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
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Set default values on error
        const medsStatEl = document.getElementById('medsTakenStat');
        if (medsStatEl) medsStatEl.textContent = '0/0';
        const apptsEl = document.getElementById('apptsToday');
        if (apptsEl) apptsEl.textContent = '0';
        const residentsEl = document.getElementById('totalResidents');
        if (residentsEl) residentsEl.textContent = '0';
    }
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
            
            const residentName = `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || 'Unnamed Resident / Residente Sin Nombre';
            
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
                p.innerHTML = `<strong>Room / Habitación:</strong> ${resident.room_number}`;
                details.appendChild(p);
            }
            if (resident.bed_number) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Bed / Cama:</strong> ${resident.bed_number}`;
                details.appendChild(p);
            }
            if (resident.date_of_birth) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Date of Birth / Fecha de Nacimiento:</strong> ${new Date(resident.date_of_birth).toLocaleDateString()}`;
                details.appendChild(p);
            }
            if (resident.gender) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Gender / Género:</strong> ${resident.gender}`;
                details.appendChild(p);
            }
            if (resident.emergency_contact_name) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Emergency Contact / Contacto de Emergencia:</strong> ${resident.emergency_contact_name} (${resident.emergency_contact_phone || ''})`;
                details.appendChild(p);
            }
            if (resident.medical_conditions) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Medical Conditions / Condiciones Médicas:</strong> ${resident.medical_conditions}`;
                details.appendChild(p);
            }
            if (resident.allergies) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>Allergies / Alergias:</strong> ${resident.allergies}`;
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
            selectBtn.textContent = 'Select / Seleccionar';
            selectBtn.onclick = () => selectResidentById(resident.id);
            actionsDiv.appendChild(selectBtn);
            
            // Edit button - CREATE IT EXPLICITLY
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-success btn-sm';
            editBtn.textContent = 'Edit / Editar';
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
            deleteBtn.textContent = 'Delete / Eliminar';
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
        setValue('newEmergencyRelationPage', 'newEmergencyRelation', resident.emergency_contact_relation);
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
            formTitlePage.textContent = 'Edit Resident / Editar Residente';
        }
        
        const formTitleModal = document.querySelector('#addResidentForm h3');
        if (formTitleModal) {
            formTitleModal.textContent = 'Edit Resident / Editar Residente';
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
    document.getElementById('staffFormTitle').textContent = 'Add New Staff Member / Agregar Nuevo Personal';
    document.getElementById('staffPassword').required = true;
    document.getElementById('staffPasswordHint').textContent = '(Required for new staff / Requerido para nuevo personal)';
    document.getElementById('staffActiveGroup').style.display = 'none';
    document.getElementById('newStaffForm').reset();
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
                        <p><strong>Phone / Teléfono:</strong> ${staff.phone || 'N/A'}</p>
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
            throw new Error(`Failed to load staff: ${response.status}`);
        }
        
        const staff = await response.json();
        
        document.getElementById('staffFullName').value = staff.full_name || '';
        document.getElementById('staffUsername').value = staff.username || '';
        document.getElementById('staffEmail').value = staff.email || '';
        document.getElementById('staffPhone').value = staff.phone || '';
        document.getElementById('staffRole').value = staff.role || 'caregiver';
        document.getElementById('staffActive').checked = staff.active !== 0;
        document.getElementById('staffPassword').value = '';
        document.getElementById('staffPassword').required = false;
        document.getElementById('staffPasswordHint').textContent = '(Leave blank to keep current / Dejar en blanco para mantener actual)';
        document.getElementById('staffActiveGroup').style.display = 'block';
        
        document.getElementById('staffFormTitle').textContent = 'Edit Staff Member / Editar Personal';
        document.getElementById('addStaffForm').style.display = 'block';
        document.getElementById('addStaffForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        role: document.getElementById('staffRole').value,
        active: document.getElementById('staffActive').checked ? 1 : 0
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

function showIncidentForm() {
    editingIncidentId = null;
    document.getElementById('incidentForm').style.display = 'block';
    document.getElementById('incidentFormTitle').textContent = 'Report Incident / Reportar Incidente';
    document.getElementById('newIncidentForm').reset();
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('incidentDate').value = now.toISOString().slice(0, 16);
    document.getElementById('familyNotificationDateGroup').style.display = 'none';
    document.getElementById('followUpNotesGroup').style.display = 'none';
    
    // Setup checkbox handlers
    const familyNotified = document.getElementById('incidentFamilyNotified');
    const followUp = document.getElementById('incidentFollowUp');
    if (familyNotified) {
        familyNotified.onchange = function() {
            document.getElementById('familyNotificationDateGroup').style.display = this.checked ? 'block' : 'none';
        };
    }
    if (followUp) {
        followUp.onchange = function() {
            document.getElementById('followUpNotesGroup').style.display = this.checked ? 'block' : 'none';
        };
    }
    
    document.getElementById('incidentForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideIncidentForm() {
    editingIncidentId = null;
    document.getElementById('incidentForm').style.display = 'none';
    const form = document.getElementById('newIncidentForm');
    if (form) form.reset();
}

async function loadIncidents() {
    try {
        const container = document.getElementById('incidentsList');
        if (!container) {
            console.error('incidentsList container not found');
            return;
        }
        
        const url = currentResidentId ? `/api/incidents?resident_id=${currentResidentId}` : '/api/incidents';
        const response = await fetch(url, { headers: getAuthHeaders() });
        
        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to load incidents: ${response.status}`);
        }
        
        const incidents = await response.json();
        
        if (incidents.length === 0) {
            container.innerHTML = '<div class="empty-state">No incident reports found. / No se encontraron reportes de incidentes.</div>';
            return;
        }
        
        container.innerHTML = incidents.map(incident => {
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
                <div class="item-card">
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
    } catch (error) {
        console.error('Error loading incidents:', error);
        showMessage('Error loading incidents / Error al cargar incidentes', 'error');
    }
}

async function editIncident(id) {
    try {
        editingIncidentId = id;
        const response = await fetch(`/api/incidents/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`Failed to load incident: ${response.status}`);
        
        const incident = await response.json();
        
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
        
        if (incident.family_notification_date) {
            const notifDate = new Date(incident.family_notification_date);
            notifDate.setMinutes(notifDate.getMinutes() - notifDate.getTimezoneOffset());
            document.getElementById('familyNotificationDate').value = notifDate.toISOString().slice(0, 16);
        }
        
        document.getElementById('familyNotificationDateGroup').style.display = incident.family_notified ? 'block' : 'none';
        document.getElementById('followUpNotesGroup').style.display = incident.follow_up_required ? 'block' : 'none';
        
        document.getElementById('incidentFormTitle').textContent = 'Edit Incident Report / Editar Reporte de Incidente';
        document.getElementById('incidentForm').style.display = 'block';
        document.getElementById('incidentForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error loading incident:', error);
        showMessage('Error loading incident / Error al cargar incidente', 'error');
    }
}

async function saveIncident(event) {
    event.preventDefault();
    console.log('💾 Saving incident...');
    
    // Validate required fields
    const incidentDate = document.getElementById('incidentDate').value;
    const incidentType = document.getElementById('incidentType').value;
    const description = document.getElementById('incidentDescription').value;
    const severity = document.getElementById('incidentSeverity').value;
    
    if (!incidentDate || !incidentType || !description || !severity) {
        showMessage('Please fill in all required fields / Por favor complete todos los campos requeridos', 'error');
        return;
    }
    
    if (!currentResidentId) {
        showMessage('Please select a resident first / Por favor seleccione un residente primero', 'error');
        return;
    }
    
    const incidentData = {
        resident_id: parseInt(currentResidentId),
        incident_date: incidentDate,
        incident_type: incidentType,
        location: document.getElementById('incidentLocation').value || '',
        description: description,
        severity: severity,
        witnesses: document.getElementById('incidentWitnesses').value || '',
        actions_taken: document.getElementById('incidentActions').value || '',
        family_notified: document.getElementById('incidentFamilyNotified').checked || false,
        follow_up_required: document.getElementById('incidentFollowUp').checked || false,
        follow_up_notes: document.getElementById('followUpNotes').value || ''
    };
    
    if (incidentData.family_notified) {
        const notifDate = document.getElementById('familyNotificationDate').value;
        if (notifDate) {
            incidentData.family_notification_date = notifDate;
        }
    }
    
    console.log('📤 Sending incident data:', incidentData);
    
    try {
        const url = editingIncidentId ? `/api/incidents/${editingIncidentId}` : '/api/incidents';
        const method = editingIncidentId ? 'PUT' : 'POST';
        
        console.log(`🌐 ${method} ${url}`);
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(incidentData)
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.status === 401) {
            showMessage('Session expired. Please login again. / Sesión expirada. Por favor inicie sesión nuevamente.', 'error');
            handleLogout();
            return;
        }
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Success:', result);
            showMessage(
                editingIncidentId ? 'Incident updated successfully / Incidente actualizado exitosamente' : 
                'Incident reported successfully / Incidente reportado exitosamente',
                'success'
            );
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
    
    try {
        const response = await fetch(`/api/incidents/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showMessage('Incident deleted successfully / Incidente eliminado exitosamente', 'success');
            loadIncidents();
        } else {
            showMessage('Error deleting incident / Error al eliminar incidente', 'error');
        }
    } catch (error) {
        console.error('Error deleting incident:', error);
        showMessage('Error deleting incident / Error al eliminar incidente', 'error');
    }
}

// Daily Care Notes Management
let editingCareNoteId = null;

function showCareNoteForm() {
    editingCareNoteId = null;
    document.getElementById('careNoteForm').style.display = 'block';
    document.getElementById('careNoteFormTitle').textContent = 'Add Care Note / Agregar Nota de Cuidado';
    const form = document.getElementById('newCareNoteForm');
    if (form) form.reset();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('careNoteDate').value = today;
    document.getElementById('careNoteForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideCareNoteForm() {
    editingCareNoteId = null;
    document.getElementById('careNoteForm').style.display = 'none';
    const form = document.getElementById('newCareNoteForm');
    if (form) form.reset();
}

async function loadCareNotes() {
    try {
        const url = currentResidentId ? `/api/care-notes?resident_id=${currentResidentId}` : '/api/care-notes';
        const response = await fetch(url, { headers: getAuthHeaders() });
        
        if (!response.ok) throw new Error(`Failed to load care notes: ${response.status}`);
        
        const notes = await response.json();
        const container = document.getElementById('careNotesList');
        if (!container) return;
        
        if (notes.length === 0) {
            container.innerHTML = '<div class="empty-state">No care notes found. / No se encontraron notas de cuidado.</div>';
            return;
        }
        
        container.innerHTML = notes.map(note => {
            const date = new Date(note.note_date);
            return `
                <div class="item-card">
                    <div class="item-header">
                        <h3>${date.toLocaleDateString()} - ${note.resident_name || 'N/A'}</h3>
                        ${note.shift ? `<span class="badge badge-success">${note.shift}</span>` : ''}
                    </div>
                    <div class="item-details">
                        ${note.meal_breakfast ? `<p><strong>Breakfast / Desayuno:</strong> ${note.meal_breakfast}</p>` : ''}
                        ${note.meal_lunch ? `<p><strong>Lunch / Almuerzo:</strong> ${note.meal_lunch}</p>` : ''}
                        ${note.meal_dinner ? `<p><strong>Dinner / Cena:</strong> ${note.meal_dinner}</p>` : ''}
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
    } catch (error) {
        console.error('Error loading care notes:', error);
        showMessage('Error loading care notes / Error al cargar notas de cuidado', 'error');
    }
}

async function editCareNote(id) {
    try {
        editingCareNoteId = id;
        const response = await fetch(`/api/care-notes/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`Failed to load care note: ${response.status}`);
        
        const note = await response.json();
        
        document.getElementById('careNoteDate').value = note.note_date || '';
        document.getElementById('careNoteShift').value = note.shift || '';
        document.getElementById('mealBreakfast').value = note.meal_breakfast || '';
        document.getElementById('mealLunch').value = note.meal_lunch || '';
        document.getElementById('mealDinner').value = note.meal_dinner || '';
        document.getElementById('mealSnacks').value = note.meal_snacks || '';
        document.getElementById('bathing').value = note.bathing || '';
        document.getElementById('hygiene').value = note.hygiene || '';
        document.getElementById('sleepHours').value = note.sleep_hours || '';
        document.getElementById('sleepQuality').value = note.sleep_quality || '';
        document.getElementById('mood').value = note.mood || '';
        document.getElementById('behaviorNotes').value = note.behavior_notes || '';
        document.getElementById('activities').value = note.activities || '';
        document.getElementById('generalNotes').value = note.general_notes || '';
        
        document.getElementById('careNoteFormTitle').textContent = 'Edit Care Note / Editar Nota de Cuidado';
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
        shift: document.getElementById('careNoteShift').value,
        meal_breakfast: document.getElementById('mealBreakfast').value,
        meal_lunch: document.getElementById('mealLunch').value,
        meal_dinner: document.getElementById('mealDinner').value,
        meal_snacks: document.getElementById('mealSnacks').value,
        bathing: document.getElementById('bathing').value,
        hygiene: document.getElementById('hygiene').value,
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
        
        // Generate PDF
        if (typeof window.jspdf === 'undefined') {
            showMessage('PDF library not loaded. Please refresh. / Biblioteca PDF no cargada. Por favor recargue.', 'error');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        
        // Add date range if provided
        if (dateFrom || dateTo) {
            doc.setFontSize(10);
            doc.text(`Date Range: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, 14, 30);
        }
        
        // Add data (simplified - would format better in production)
        doc.setFontSize(10);
        let y = 40;
        doc.text(`Total Records: ${data.length}`, 14, y);
        y += 10;
        
        // Add summary data
        if (data.length > 0 && data.length <= 50) {
            data.forEach((item, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                const summary = JSON.stringify(item).substring(0, 80) + '...';
                doc.text(`${index + 1}. ${summary}`, 14, y);
                y += 7;
            });
        } else if (data.length > 50) {
            doc.text('Too many records to display. Use CSV export for full data.', 14, y);
        }
        
        // Save PDF
        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        showMessage('PDF generated successfully / PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error generating report:', error);
        showMessage('Error generating report / Error al generar reporte', 'error');
    }
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
    document.querySelector('#medicationForm h3').textContent = 'Add Medication / Agregar Medicamento';
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
    document.querySelector('#appointmentForm h3').textContent = 'Add Appointment / Agregar Cita';
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (authToken && currentStaff && currentResidentId) {
        initApp();
    }
    setupDateDropdowns();
});




