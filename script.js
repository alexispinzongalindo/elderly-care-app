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

// Language system
let currentLanguage = 'en'; // Default to English
let currentUser = null;

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

        // Login
        'login.title': 'Elder Care Management',
        'login.subtitle': 'Login',
        'login.username': 'Username',
        'login.password': 'Password',
        'login.submit': 'Login',
        'login.placeholder.username': 'Enter username',
        'login.placeholder.password': 'Enter password',
        'login.hint': 'Default: admin / admin123',

        // Resident Selector
        'resident.select': 'Select Resident',
        'resident.choose': 'Choose Resident',
        'resident.selectOption': 'Select a resident',
        'resident.addNew': 'Add New Resident',

        // Resident Form
        'resident.title': 'Residents Management',
        'resident.add': 'Add New Resident',
        'resident.edit': 'Edit Resident',
        'resident.firstName': 'First Name',
        'resident.lastName': 'Last Name',
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
    },
    es: {
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

        // Login
        'login.title': 'Gestión de Cuidado de Ancianos',
        'login.subtitle': 'Iniciar Sesión',
        'login.username': 'Usuario',
        'login.password': 'Contraseña',
        'login.submit': 'Iniciar Sesión',
        'login.placeholder.username': 'Ingrese usuario',
        'login.placeholder.password': 'Ingrese contraseña',
        'login.hint': 'Por defecto: admin / admin123',

        // Resident Selector
        'resident.select': 'Seleccionar Residente',
        'resident.choose': 'Elegir Residente',
        'resident.selectOption': 'Seleccione un residente',
        'resident.addNew': 'Agregar Nuevo Residente',

        // Resident Form
        'resident.title': 'Gestión de Residentes',
        'resident.add': 'Agregar Nuevo Residente',
        'resident.edit': 'Editar Residente',
        'resident.firstName': 'Nombre',
        'resident.lastName': 'Apellido',
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
    }
};

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
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

    // Replace all dual-language text with single language
    replaceDualLanguageText();

    // Update all translatable elements
    updateTranslations();

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

    // Update month options dynamically
    const monthSelects = document.querySelectorAll('select[id*="BirthMonth"], select[id*="birthMonth"]');
    monthSelects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value && option.value !== '') {
                const monthKey = `month.${option.value.toLowerCase()}`;
                const monthNames = {
                    '01': 'january', '02': 'february', '03': 'march', '04': 'april',
                    '05': 'may', '06': 'june', '07': 'july', '08': 'august',
                    '09': 'september', '10': 'october', '11': 'november', '12': 'december'
                };
                if (monthNames[option.value]) {
                    option.textContent = t(`month.${monthNames[option.value]}`);
                }
            } else {
                option.textContent = t('resident.month');
            }
        });
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
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentStaff', JSON.stringify(currentStaff));

            // Load user's preferred language
            const userLanguage = currentStaff.preferred_language || localStorage.getItem('preferredLanguage') || 'en';
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
            showResidentSelector();
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

    document.getElementById('mainApp').style.display = 'block';
    initNavigation();
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
            const statsGrid = document.querySelector('.stats-grid');
            if (statsGrid && document.getElementById('dashboard')?.classList.contains('active')) {
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
            }
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
            const page = link.dataset.page;
            showPage(page);

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Close mobile menu when a link is clicked
            if (navMenu) navMenu.classList.remove('active');
        });
    });

    // Add event listener to menu toggle button (backup to onclick)
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileMenu();
        });
    }
}

// Make showPage globally accessible - CRITICAL FUNCTION
function showPage(pageName) {
    console.log('%c📄📄📄 showPage() CALLED with: ' + pageName + ' 📄📄📄', 'background: #FF6B6B; color: white; font-size: 18px; font-weight: bold; padding: 10px;');
    console.log('📄 Current URL:', window.location.href);
    console.log('📄 Timestamp:', new Date().toISOString());

    if (!pageName) {
        console.error('❌ showPage called with no pageName!');
        return;
    }

    const pages = document.querySelectorAll('.page');
    console.log('📄 Found', pages.length, 'pages in DOM');

    // CRITICAL: Hide ALL pages first with inline styles to override any forced visibility
    pages.forEach(page => {
        if (page.id !== pageName) {
            // SPECIAL: Don't hide financial page if we're showing it
            if (page.id === 'financial' && pageName === 'financial') {
                return;
            }
            page.classList.remove('active');
            // Use !important via setProperty to override any CSS - only hide the page container itself
            // Don't hide children here as it can interfere with the target page's children
            page.style.setProperty('display', 'none', 'important');
            page.style.setProperty('visibility', 'hidden', 'important');
            page.style.setProperty('opacity', '0', 'important');
            page.style.setProperty('position', 'absolute', 'important');
            page.style.setProperty('left', '-9999px', 'important');
            page.style.setProperty('z-index', '-1', 'important');
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

    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        // CRITICAL: For carenotes, apply styles IMMEDIATELY before anything else
        if (pageName === 'carenotes') {
            console.log('🔴🔴🔴 IMMEDIATE CARE NOTES FIX 🔴🔴🔴');
            targetPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; padding: 2rem !important; overflow: visible !important; background: var(--light-gray) !important;';
            targetPage.classList.add('active');
            // Force all children visible immediately
            Array.from(targetPage.children).forEach((child) => {
                if (child.tagName === 'SCRIPT') return;
                if (child.id === 'careNoteForm' && child.style.display === 'none') return;
                child.style.setProperty('display', child.tagName === 'BUTTON' ? 'inline-block' : 'block', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('opacity', '1', 'important');
            });
        }
        targetPage.classList.add('active');

        // CRITICAL: For financial page, scroll to top immediately
        if (pageName === 'financial') {
            window.scrollTo({ top: 0, behavior: 'instant' });
            // Also scroll the page container to top
            targetPage.scrollTop = 0;
            // Ensure no excessive top margin/padding causing offset
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
            mainContainer.style.setProperty('display', 'block', 'important');
            mainContainer.style.setProperty('visibility', 'visible', 'important');
            mainContainer.style.setProperty('opacity', '1', 'important');
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
        // For carenotes page, ensure it stays visible
        if (pageName === 'carenotes') {
            targetPage.style.setProperty('position', 'relative', 'important');
            targetPage.style.setProperty('z-index', '10', 'important');
            targetPage.style.setProperty('min-height', '400px', 'important');
            targetPage.style.setProperty('width', '100%', 'important');
            targetPage.style.setProperty('padding', '2rem', 'important');
        }
        targetPage.style.setProperty('visibility', 'visible', 'important');
        targetPage.style.setProperty('opacity', '1', 'important');
        targetPage.style.setProperty('position', 'relative', 'important');
        targetPage.style.removeProperty('left'); // Remove left: -9999px if it was set
        targetPage.style.removeProperty('right'); // Remove any right positioning
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

        // SPECIAL HANDLING FOR CARE NOTES PAGE - Force dimensions immediately
        if (pageName === 'carenotes') {
            targetPage.style.setProperty('min-height', '400px', 'important');
            targetPage.style.setProperty('width', '100%', 'important');
            targetPage.style.setProperty('padding', '2rem', 'important');
            // Force all children visible immediately
            Array.from(targetPage.children).forEach((child) => {
                if (child.tagName === 'SCRIPT') return;
                // Skip the form if it should be hidden
                if (child.id === 'careNoteForm' && child.style.display === 'none') {
                    return;
                }
                const display = child.tagName === 'BUTTON' ? 'inline-block' :
                              child.classList.contains('item-list') ? 'block' : 'block';
                child.style.setProperty('display', display, 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('opacity', '1', 'important');
                if (child.tagName === 'H2') {
                    child.style.setProperty('min-height', '30px', 'important');
                } else if (child.classList.contains('item-list')) {
                    child.style.setProperty('min-height', '200px', 'important');
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

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });

        // Load page-specific data
        if (pageName === 'dashboard') {
            // Force grid layout immediately - run multiple times to ensure it sticks
            const forceGridLayout = () => {
                const statsGrid = document.querySelector('.stats-grid');
                if (statsGrid) {
                    const width = window.innerWidth;
                    console.log('🔧 [showPage] Fixing dashboard grid. Width:', width);
                    let columns = 'repeat(3, 1fr)';
                    if (width >= 1025) {
                        columns = 'repeat(3, 1fr)';
                    } else if (width >= 769) {
                        columns = 'repeat(2, 1fr)';
                    } else if (width >= 481) {
                        columns = 'repeat(2, 1fr)';
                    } else {
                        columns = '1fr';
                    }
                    statsGrid.style.setProperty('display', 'grid', 'important');
                    statsGrid.style.setProperty('grid-template-columns', columns, 'important');
                    statsGrid.style.setProperty('width', '100%', 'important');
                    statsGrid.style.setProperty('max-width', '100%', 'important');
                    console.log('✅ [showPage] Applied grid:', columns);

                    // Force cards to not be full width
                    const cards = statsGrid.querySelectorAll('.stat-card');
                    cards.forEach(card => {
                        card.style.setProperty('width', 'auto', 'important');
                        card.style.setProperty('max-width', '100%', 'important');
                    });
                } else {
                    console.warn('⚠️ [showPage] stats-grid not found');
                }
            };

            // Run immediately and after short delays to ensure it sticks
            forceGridLayout();
            setTimeout(forceGridLayout, 50);
            setTimeout(forceGridLayout, 200);
            setTimeout(forceGridLayout, 500);

            loadDashboard();
        }
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
            incidentsPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; background: var(--light-gray) !important; padding: 2rem !important; overflow: visible !important;';
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

            const carenotesPage = document.getElementById('carenotes');
            if (!carenotesPage) {
                console.error('❌ Care notes page not found!');
                return;
            }

            console.log('✅ Care notes page element found in DOM');
            console.log('✅ Element ID:', carenotesPage.id);
            console.log('✅ Element classes:', carenotesPage.className);
            console.log('✅ Element parent:', carenotesPage.parentElement?.tagName, carenotesPage.parentElement?.id);
            console.log('✅ Element children count:', carenotesPage.children.length);

            // CRITICAL: Ensure ALL parents are visible, starting from carenotesPage up to mainApp
            let currentElement = carenotesPage;
            let level = 0;
            while (currentElement && level < 10) {
                const computedStyle = window.getComputedStyle(currentElement);
                const display = computedStyle.display;
                const visibility = computedStyle.visibility;
                const opacity = computedStyle.opacity;

                console.log(`🔍 Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}): display=${display}, visibility=${visibility}, opacity=${opacity}`);

                // Skip intentionally hidden elements
                if (currentElement.id === 'loginModal' || currentElement.id === 'residentSelector' || currentElement.id === 'careNoteForm') {
                    currentElement = currentElement.parentElement;
                    level++;
                    continue;
                }

                // Fix any parent with display:none
                if (display === 'none') {
                    console.log(`⚠️ Fixing Parent ${level} (${currentElement.tagName}#${currentElement.id || ''}) - setting display to block with !important`);
                    currentElement.style.setProperty('display', 'block', 'important');
                    currentElement.style.setProperty('visibility', 'visible', 'important');
                    currentElement.style.setProperty('opacity', '1', 'important');
                    currentElement.style.setProperty('position', 'relative', 'important');
                    currentElement.style.setProperty('z-index', '1', 'important');
                }

                // Also fix if visibility is hidden or opacity is 0
                if (visibility === 'hidden' || opacity === '0') {
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
            const mainContainer = carenotesPage.closest('main.container');
            if (mainContainer) {
                mainContainer.style.setProperty('display', 'block', 'important');
                mainContainer.style.setProperty('visibility', 'visible', 'important');
                mainContainer.style.setProperty('opacity', '1', 'important');
                console.log('✅ main.container forced visible');
            }

            // Force carenotes page to be visible using cssText for maximum control
            carenotesPage.classList.add('active');
            carenotesPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; padding: 2rem !important; overflow: visible !important; background: var(--light-gray) !important;';

            // DOUBLE-CHECK: Force it again after a micro-delay to override any timing issues
            setTimeout(() => {
                carenotesPage.style.setProperty('display', 'block', 'important');
                carenotesPage.style.setProperty('visibility', 'visible', 'important');
                carenotesPage.style.setProperty('opacity', '1', 'important');
                carenotesPage.style.setProperty('min-height', '400px', 'important');
                carenotesPage.style.setProperty('width', '100%', 'important');
                console.log('✅ Care notes page re-forced visible after timeout');
            }, 50);

            // Ensure all child elements are visible
            Array.from(carenotesPage.children).forEach((child) => {
                if (child.tagName === 'SCRIPT') return;
                // Skip the form if it should be hidden
                if (child.id === 'careNoteForm' && child.style.display === 'none') {
                    return;
                }
                const display = child.tagName === 'BUTTON' ? 'inline-block' :
                              child.classList.contains('item-list') ? 'block' : 'block';
                child.style.setProperty('display', display, 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('opacity', '1', 'important');
                if (child.tagName === 'H2') {
                    child.style.setProperty('min-height', '30px', 'important');
                    child.style.setProperty('margin-bottom', '1.5rem', 'important');
                }
            });

            // Ensure the careNotesList container exists and is visible
            const careNotesList = document.getElementById('careNotesList');
            if (careNotesList) {
                careNotesList.style.setProperty('display', 'block', 'important');
                careNotesList.style.setProperty('visibility', 'visible', 'important');
                careNotesList.style.setProperty('min-height', '200px', 'important');
                console.log('✅ careNotesList container found and made visible');
            } else {
                console.error('❌ careNotesList container not found in DOM!');
            }

            console.log('✅ Care notes page forced visible');
            console.log('✅ Care notes page offsetHeight:', carenotesPage.offsetHeight);
            console.log('✅ Care notes page offsetWidth:', carenotesPage.offsetWidth);

            loadCareNotes();
        }
        else if (pageName === 'notifications') {
            loadNotificationsPage();
        }
        else if (pageName === 'reports') {
            loadReportsAnalytics();
        }
        else if (pageName === 'financial') {
            console.log('💰💰💰 FINANCIAL PAGE - COMPLETE REWRITE APPROACH 💰💰💰');

            const financialPage = document.getElementById('financial');
            if (!financialPage) {
                console.error('❌ Financial page not found!');
                return;
            }

            // COMPLETE REWRITE: Remove all inline styles and start fresh
            financialPage.removeAttribute('style');
            financialPage.className = 'page active';

            // Check parent chain
            let parent = financialPage.parentElement;
            let level = 0;
            while (parent && level < 5) {
                const parentStyle = window.getComputedStyle(parent);
                console.log(`🔍 Parent level ${level}:`, parent.tagName, parent.className, {
                    display: parentStyle.display,
                    visibility: parentStyle.visibility,
                    height: parent.offsetHeight,
                    width: parent.offsetWidth
                });

                // Force parent visible if needed
                if (parentStyle.display === 'none' || parent.offsetHeight === 0) {
                    parent.style.setProperty('display', 'block', 'important');
                    parent.style.setProperty('visibility', 'visible', 'important');
                    parent.style.setProperty('min-height', '600px', 'important');
                    console.log(`⚠️ Fixed parent level ${level}`);
                }

                parent = parent.parentElement;
                level++;
            }

            // Now set the financial page with ALL possible CSS properties
            financialPage.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 999 !important;
                height: 800px !important;
                min-height: 800px !important;
                max-height: none !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 2rem !important;
                margin: 0 !important;
                overflow: visible !important;
                background: #f5f5f5 !important;
                box-sizing: border-box !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: auto !important;
            `;

            // Force ALL children with explicit content - MORE AGGRESSIVE
            Array.from(financialPage.children).forEach((child, idx) => {
                if (child.tagName === 'SCRIPT') return;

                let css = '';
                if (child.tagName === 'H2') {
                    css = 'display: block !important; visibility: visible !important; opacity: 1 !important; height: auto !important; min-height: 50px !important; margin: 1rem 0 !important; padding: 0.5rem 0 !important; font-size: 2rem !important; font-weight: bold !important; color: #333 !important; background: transparent !important; position: relative !important; z-index: 100 !important;';
                } else if (child.tagName === 'P') {
                    css = 'display: block !important; visibility: visible !important; opacity: 1 !important; height: auto !important; min-height: 40px !important; margin: 1rem 0 2rem 0 !important; padding: 0.5rem 0 !important; color: #666 !important; background: transparent !important; position: relative !important; z-index: 100 !important;';
                } else if (child.classList.contains('button-group')) {
                    css = 'display: flex !important; visibility: visible !important; opacity: 1 !important; height: auto !important; min-height: 80px !important; margin: 2rem 0 !important; padding: 1rem 0 !important; background: transparent !important; position: relative !important; z-index: 100 !important; flex-wrap: wrap !important; gap: 1rem !important;';
                } else if (child.classList.contains('financial-tab')) {
                    css = 'display: block !important; visibility: visible !important; opacity: 1 !important; height: auto !important; min-height: 500px !important; margin: 1rem 0 !important; padding: 1rem !important; background: white !important; border: 1px solid #ddd !important; position: relative !important; z-index: 100 !important;';
                } else {
                    css = 'display: block !important; visibility: visible !important; opacity: 1 !important; height: auto !important; min-height: 100px !important; position: relative !important; z-index: 100 !important;';
                }

                child.style.cssText = css;
                // Also set individual properties as backup
                child.style.setProperty('display', child.tagName === 'H2' || child.classList.contains('button-group') ? (child.classList.contains('button-group') ? 'flex' : 'block') : 'block', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('opacity', '1', 'important');
                console.log(`✅ Child ${idx} (${child.tagName || child.className}) forced, height:`, child.offsetHeight, 'display:', window.getComputedStyle(child).display);
            });

            // Removed debug test div code

            // Verify ALL children are visible with detailed logging
            setTimeout(() => {
                console.log('🔍🔍🔍 DETAILED CHILD VISIBILITY CHECK 🔍🔍🔍');
                Array.from(financialPage.children).forEach((child, idx) => {
                    if (child.tagName === 'SCRIPT') return;
                    const computed = window.getComputedStyle(child);
                    console.log(`Child ${idx} (${child.tagName || child.className}):`, {
                        tagName: child.tagName,
                        className: child.className,
                        id: child.id,
                        inDOM: child.isConnected,
                        offsetHeight: child.offsetHeight,
                        offsetWidth: child.offsetWidth,
                        display: computed.display,
                        visibility: computed.visibility,
                        opacity: computed.opacity,
                        backgroundColor: computed.backgroundColor,
                        position: computed.position,
                        zIndex: computed.zIndex
                    });

                    // If child has zero height but should be visible, force it again
                    if (child.offsetHeight === 0 && computed.display !== 'none') {
                        console.warn(`⚠️ Child ${idx} has zero height! Forcing again...`);
                        child.style.setProperty('display', 'block', 'important');
                        child.style.setProperty('min-height', '50px', 'important');
                        child.style.setProperty('height', 'auto', 'important');
                    }
                });

                const testDivCheck = document.getElementById('financialTestDiv');
                if (testDivCheck) {
                    console.log('🔍 Test div check:', {
                        inDOM: testDivCheck.isConnected,
                        parent: testDivCheck.parentElement?.id,
                        height: testDivCheck.offsetHeight,
                        width: testDivCheck.offsetWidth,
                        display: window.getComputedStyle(testDivCheck).display,
                        visibility: window.getComputedStyle(testDivCheck).visibility,
                        opacity: window.getComputedStyle(testDivCheck).opacity,
                        background: window.getComputedStyle(testDivCheck).backgroundColor
                    });
                } else {
                    console.error('❌ Test div not found after creation!');
                }
            }, 100);

            console.log('✅ Financial page completely rewritten, test div added');
            console.log('🔍 Financial page dimensions:', {
                height: financialPage.offsetHeight,
                width: financialPage.offsetWidth,
                display: window.getComputedStyle(financialPage).display
            });

            // CRITICAL: Show accounts tab IMMEDIATELY before initFinancialPage
            console.log('🔴 CRITICAL: Showing accounts tab IMMEDIATELY...');
            const accountsTab = document.getElementById('financialAccounts');
            if (accountsTab) {
                accountsTab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 400px !important; height: auto !important; width: 100% !important; padding: 1rem !important; background: white !important; border: 1px solid #ddd !important; position: relative !important;';
                console.log('✅ Accounts tab forced visible immediately, height:', accountsTab.offsetHeight);

                // Force all children of accounts tab visible
                Array.from(accountsTab.children).forEach((child) => {
                    child.style.setProperty('display', 'block', 'important');
                    child.style.setProperty('visibility', 'visible', 'important');
                    child.style.setProperty('opacity', '1', 'important');
                });

                // AGGRESSIVE: Find and force form-card visible
                const formCard = accountsTab.querySelector('.form-card');
                if (formCard) {
                    formCard.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1rem !important; padding: 2rem !important; background: white !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; position: relative !important; z-index: 10000 !important; min-height: 150px !important; width: 100% !important; box-sizing: border-box !important;';
                    console.log('✅✅✅ FORM-CARD FOUND AND FORCED VISIBLE IN showPage ✅✅✅');

                    // Find and force button visible
                    const button = formCard.querySelector('button');
                    if (button) {
                        button.style.setProperty('display', 'inline-block', 'important');
                        button.style.setProperty('visibility', 'visible', 'important');
                        button.style.setProperty('opacity', '1', 'important');

                        console.log('✅✅✅ BUTTON FOUND AND FORCED VISIBLE IN showPage ✅✅✅');
                        console.log('🔍 Button position:', button.getBoundingClientRect());
                    } else {
                        console.error('❌❌❌ BUTTON NOT FOUND IN FORM-CARD!');
                    }
                } else {
                    console.error('❌❌❌ FORM-CARD NOT FOUND IN ACCOUNTS TAB!');
                }
            }

            // Hide other tabs
            ['financialTransactions', 'financialReconciliation', 'financialReceipts'].forEach(tabId => {
                const tab = document.getElementById(tabId);
                if (tab) {
                    tab.style.setProperty('display', 'none', 'important');
                }
            });

            // Update button styles
            const tabButtons = financialPage.querySelectorAll('.button-group button');
            tabButtons.forEach((btn, idx) => {
                if (idx === 0) {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary');
                } else {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                }
            });

            // ULTRA AGGRESSIVE FIX: Add test div and create button if missing
            setTimeout(() => {

                const accountsTab = document.getElementById('financialAccounts');
                if (!accountsTab) {
                    console.error('❌❌❌ ACCOUNTS TAB NOT FOUND!');
                    return;
                }

                accountsTab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 999 !important; min-height: 500px !important;';

                // Try multiple selectors to find form-card
                let formCard = accountsTab.querySelector('.form-card');
                if (!formCard) {
                    formCard = document.querySelector('#financialAccounts .form-card');
                }
                if (!formCard) {
                    // Create form-card if it doesn't exist
                    formCard = document.createElement('div');
                    formCard.className = 'form-card';
                    formCard.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; padding: 2rem !important; background: white !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; margin-bottom: 1rem !important; min-height: 200px !important;';
                    formCard.innerHTML = '<h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Bank Accounts / Cuentas Bancarias</h3>';
                    accountsTab.insertBefore(formCard, accountsTab.firstChild);
                    console.log('✅✅✅ CREATED FORM-CARD BECAUSE IT WAS MISSING ✅✅✅');
                } else {
                    formCard.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; margin-bottom: 1rem !important; padding: 2rem !important; background: white !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; position: relative !important; z-index: 10000 !important; min-height: 150px !important; width: 100% !important; box-sizing: border-box !important;';
                    console.log('✅✅✅ FORM-CARD FOUND AND FORCED VISIBLE ✅✅✅');
                }

                // Find or create button
                let addButton = formCard.querySelector('button');
                if (!addButton) {
                    addButton = document.querySelector('#financialAccounts button');
                }

                if (!addButton) {
                    // CREATE BUTTON if it doesn't exist
                    addButton = document.createElement('button');
                    addButton.className = 'btn btn-primary';
                    addButton.textContent = '+ Add Bank Account / Agregar Cuenta Bancaria';
                    addButton.onclick = function() { showBankAccountForm(); };
                    formCard.appendChild(addButton);
                    console.log('✅✅✅ CREATED BUTTON BECAUSE IT WAS MISSING ✅✅✅');
                }

                // Force button visible with normal styling
                addButton.style.setProperty('display', 'inline-block', 'important');
                addButton.style.setProperty('visibility', 'visible', 'important');
                addButton.style.setProperty('opacity', '1', 'important');
                console.log('✅✅✅ BUTTON FORCED VISIBLE WITH NORMAL STYLING ✅✅✅');
                console.log('🔍 Button position:', addButton.getBoundingClientRect());

                const bankAccountsList = document.getElementById('bankAccountsList');
                if (bankAccountsList) {
                    bankAccountsList.style.setProperty('display', 'block', 'important');
                    bankAccountsList.style.setProperty('visibility', 'visible', 'important');
                    bankAccountsList.style.setProperty('opacity', '1', 'important');
                    bankAccountsList.style.setProperty('min-height', '250px', 'important');

                    if (!bankAccountsList.innerHTML || bankAccountsList.innerHTML.trim() === '') {
                        bankAccountsList.innerHTML = '<div style="padding: 3rem; text-align: center; color: #333; background: #f5f5f5; border-radius: 8px; margin: 2rem 0; min-height: 200px; display: flex !important; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #ddd; visibility: visible !important; opacity: 1 !important; width: 100%; box-sizing: border-box;"><p style="font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: 500; color: #555;">No bank accounts found.</p><p style="color: #666; font-size: 0.95rem;">Click "Add Bank Account" above to create your first account.</p></div>';
                    }
                }
                initFinancialPage();
            }, 100);
        }
    } else {
        console.error('❌ Page not found:', pageName);
    }

    // Replace dual-language text with single language after page is shown
    replaceDualLanguageText();

    // Update all translatable elements (data-translate attributes)
    updateTranslations();
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
        // Force stats-grid to display side-by-side (backup for CSS)
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            const width = window.innerWidth;
            console.log('🔧 Fixing dashboard grid layout. Window width:', width);
            let columns = 'repeat(3, 1fr)';
            if (width >= 1025) {
                columns = 'repeat(3, 1fr)';
            } else if (width >= 769) {
                columns = 'repeat(2, 1fr)';
            } else if (width >= 481) {
                columns = 'repeat(2, 1fr)';
            } else {
                columns = '1fr';
            }
            statsGrid.style.setProperty('display', 'grid', 'important');
            statsGrid.style.setProperty('grid-template-columns', columns, 'important');
            statsGrid.style.setProperty('width', '100%', 'important');
            statsGrid.style.setProperty('max-width', '100%', 'important');
            console.log('✅ Applied grid layout:', columns);

            // Also force each stat-card to not be full width
            const statCards = statsGrid.querySelectorAll('.stat-card');
            statCards.forEach(card => {
                card.style.setProperty('width', 'auto', 'important');
                card.style.setProperty('max-width', '100%', 'important');
                card.style.setProperty('flex-shrink', '1', 'important');
            });
        } else {
            console.warn('⚠️ stats-grid element not found!');
        }

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
        const apptsEl = document.getElementById('apptsToday');
        if (apptsEl) apptsEl.textContent = '0';
        const residentsEl = document.getElementById('totalResidents');
        if (residentsEl) residentsEl.textContent = '0';
    }
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
            listEl.innerHTML = '<p class="empty-state">No upcoming appointments / No hay citas próximas</p>';
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
                            ${isToday ? 'Today / Hoy' : aptDate.toLocaleDateString()} at ${apt.time}
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
            listEl.innerHTML = '<p class="empty-state">No medications scheduled / No hay medicamentos programados</p>';
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
                        title: 'Vital Signs Recorded / Signos Vitales Registrados',
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
                        title: 'Care Note Added / Nota de Cuidado Agregada',
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
            listEl.innerHTML = '<p class="empty-state">No recent activity / No hay actividad reciente</p>';
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

    if (minutes < 1) return 'Just now / Ahora mismo';
    if (minutes < 60) return `${minutes}m ago / hace ${minutes}m`;
    if (hours < 24) return `${hours}h ago / hace ${hours}h`;
    if (days < 7) return `${days}d ago / hace ${days}d`;
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
                const formattedPhone = resident.emergency_contact_phone_formatted || formatPhoneNumber(resident.emergency_contact_phone) || '';
                p.innerHTML = `<strong>Emergency Contact / Contacto de Emergencia:</strong> ${resident.emergency_contact_name}${formattedPhone ? ` (${formattedPhone})` : ''}`;
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
        // Ensure staff page is visible first
        const staffPage = document.getElementById('staff');
        if (staffPage) {
            showPage('staff');
            // Wait a moment for page to render
            await new Promise(resolve => setTimeout(resolve, 100));
        }

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

        // ALWAYS ensure the page is visible and active - don't check, just force it
        incidentsPage.classList.add('active');
        incidentsPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 400px !important; width: 100% !important; padding: 2rem !important; background: var(--light-gray) !important; overflow: visible !important;';
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
            container.innerHTML = `<div class="empty-state" style="display: block !important; visibility: visible !important; opacity: 1 !important; padding: 2rem !important; background: #fee !important; border: 2px solid #f00 !important; border-radius: 8px !important; color: #c00 !important; font-weight: bold !important;">Error: Server returned invalid data format. Please check console. / Error: El servidor devolvió un formato de datos inválido. Por favor revise la consola.</div>`;
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
    try {
        // Check if user is authenticated
        if (!authToken) {
            console.error('No auth token available, redirecting to login');
            checkAuth();
            return;
        }

        const url = currentResidentId ? `/api/care-notes?resident_id=${currentResidentId}` : '/api/care-notes';
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

        if (!response.ok) throw new Error(`Failed to load care notes: ${response.status}`);

        const notes = await response.json();
        const container = document.getElementById('careNotesList');
        if (!container) {
            console.error('❌ careNotesList container not found!');
            return;
        }

        // Ensure container is visible
        container.style.display = 'block';
        container.style.visibility = 'visible';

        if (notes.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: #666;"><p>No care notes found. / No se encontraron notas de cuidado.</p><p style="margin-top: 1rem;">Click the "Add Care Note" button above to create your first care note.</p></div>';
            return;
        }

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load language from localStorage if available (but wait for login to use staff preferred_language)
    // Only set language from localStorage if user is not logged in yet
    if (!authToken || !currentStaff) {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
            setLanguage(savedLanguage); // Use setLanguage to ensure replaceDualLanguageText is called
        }
    }

    checkAuth();
    if (authToken && currentStaff && currentResidentId) {
        initApp();
    }
    setupDateDropdowns();
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

            // Scroll window to top to ensure content is visible (button was at y:1300, way below viewport)
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Also scroll to the form-card button specifically
            const formCard = document.querySelector('#financialAccounts .form-card');
            if (formCard) {
                const addButton = formCard.querySelector('button');
                if (addButton) {
                    setTimeout(() => {
                        addButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                        // Also try window scroll as backup
                        const rect = addButton.getBoundingClientRect();
                        window.scrollTo({ top: Math.max(0, rect.top + window.scrollY - 100), behavior: 'smooth' });
                    }, 200);
                }
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

                // Also ensure the button inside is visible - SUPER VISIBLE FOR DEBUGGING
                const addButton = formCard.querySelector('button');
                if (addButton) {
                    // Make button SUPER visible with bright red background and yellow border
                    addButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 99999 !important; background: #FF0000 !important; color: white !important; padding: 1rem 2rem !important; border: 5px solid #FFFF00 !important; border-radius: 8px !important; cursor: pointer !important; font-size: 1.2rem !important; font-weight: bold !important; margin: 1rem 0 !important; width: auto !important; height: auto !important; min-height: 50px !important; box-shadow: 0 0 30px rgba(255,0,0,1) !important;';

                    // Force button to be positioned correctly (fix negative x position)
                    addButton.style.setProperty('position', 'relative', 'important');
                    addButton.style.setProperty('left', '0', 'important');
                    addButton.style.setProperty('right', 'auto', 'important');
                    addButton.style.setProperty('transform', 'none', 'important');
                    addButton.style.setProperty('margin-left', '0', 'important');
                    addButton.style.setProperty('margin-right', 'auto', 'important');

                    // Ensure ALL parent containers have overflow: visible
                    let parent = addButton.parentElement;
                    let level = 0;
                    while (parent && parent !== document.body && level < 15) {
                        parent.style.setProperty('overflow', 'visible', 'important');
                        parent.style.setProperty('overflow-x', 'visible', 'important');
                        parent.style.setProperty('overflow-y', 'visible', 'important');
                        parent.style.setProperty('height', 'auto', 'important');
                        parent.style.setProperty('min-height', 'auto', 'important');
                        if (parent.id === 'financialAccounts' || parent.classList.contains('form-card') || parent.classList.contains('financial-tab') || parent.classList.contains('page') || parent.id === 'financial') {
                            parent.style.setProperty('display', 'block', 'important');
                            parent.style.setProperty('visibility', 'visible', 'important');
                            parent.style.setProperty('opacity', '1', 'important');
                        }
                        parent = parent.parentElement;
                        level++;
                    }

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
                            console.log('📍 Button is below viewport - scrolling to it...');
                            addButton.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                            // Also try scrolling the window
                            window.scrollTo({ top: Math.max(0, rect.top + window.scrollY - 100), behavior: 'smooth' });
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
                                    console.log('📍 Attempting scroll to button...');
                                    addButton.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                    window.scrollTo({ top: Math.max(0, newRect.top + window.scrollY - 50), behavior: 'smooth' });

                                    // After scroll, check again
                                    setTimeout(() => {
                                        const finalRect = addButton.getBoundingClientRect();
                                        if (finalRect.y < 0 || finalRect.y > window.innerHeight) {
                                            console.error('❌❌ Button still off-screen after scroll - using emergency fix');
                                            // Emergency: Move button to a safe location at top of viewport
                                            addButton.style.cssText = 'display: inline-block !important; visibility: visible !important; opacity: 1 !important; position: fixed !important; top: 150px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 9999 !important; background: #2196F3 !important; color: white !important; padding: 0.75rem 1.5rem !important; border: none !important; border-radius: 4px !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;';
                                        } else {
                                            console.log('✅ Button visible after scroll! y:', finalRect.y);
                                        }
                                    }, 300);
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
                            ${trans.account_name} • ${trans.transaction_type} •
                            ${trans.transaction_date} •
                            <strong style="color: ${trans.transaction_type === 'deposit' ? 'var(--success-green)' : 'var(--error-red)'}">
                                ${trans.transaction_type === 'deposit' ? '+' : '-'}$${parseFloat(trans.amount).toFixed(2)}
                            </strong>
                        </p>
                        ${trans.check_number ? `<p class="item-details">Check #: ${trans.check_number}</p>` : ''}
                        ${trans.reconciled ? '<span class="badge badge-success">Reconciled</span>' : '<span class="badge badge-warning">Unreconciled</span>'}
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

        const transactionData = {
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
    console.log('💰💰💰 INITIALIZING FINANCIAL PAGE - AGGRESSIVE FIX 💰💰💰');

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
            mainContainer.style.cssText += 'height: 600px !important; padding: 2rem !important;';
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
    financialPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; min-height: 500px !important; width: 100% !important; padding: 2rem !important; overflow: visible !important; background: var(--light-gray) !important;';
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
        tab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 400px !important; height: auto !important; width: 100% !important; padding: 1rem !important; background: white !important; border: 1px solid #ddd !important;';

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
                accountsTab.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; min-height: 400px !important; height: auto !important; width: 100% !important; padding: 1rem !important; background: white !important;';
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
            financialPage.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; height: 600px !important; min-height: 600px !important; width: 100% !important; max-width: 100% !important; padding: 2rem !important; overflow: visible !important; background: var(--light-gray) !important; box-sizing: border-box !important;';

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
                    clone.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; z-index: 10 !important; height: 600px !important; min-height: 600px !important; width: 100% !important; padding: 2rem !important; background: var(--light-gray) !important;';
                    console.log('✅ Element cloned and replaced');
                }
            }, 100);
        } else {
            console.log('✅✅✅ FINANCIAL PAGE HAS DIMENSIONS! ✅✅✅');
        }
    }, 200);

    // Show the accounts tab (this will also load bank accounts)
    showFinancialTab('accounts');
}

// Update showPage to handle financial page
const originalShowPage = window.showPage;
if (typeof originalShowPage === 'function') {
    // This will be handled in the existing showPage function
}
