#!/usr/bin/env python3
"""Script to update all HTML forms with translation attributes"""

import re

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Dictionary of replacements: (pattern, replacement)
replacements = [
    # Medication form
    (r'<label[^>]*>Medication Name / Nombre del Medicamento \*</label>', '<label for="medName" data-translate="medication.name">Medication Name *</label>'),
    (r'<label[^>]*>Dosage / Dosis \*</label>', '<label for="medDosage" data-translate="medication.dosage">Dosage *</label>'),
    (r'<label[^>]*>Frequency / Frecuencia \*</label>', '<label for="medFrequency" data-translate="medication.frequency">Frequency *</label>'),
    (r'<label[^>]*>Start Date / Fecha de Inicio</label>', '<label data-translate="medication.startDate">Start Date</label>'),
    (r'<label[^>]*>End Date / Fecha de Fin</label>', '<label data-translate="medication.endDate">End Date</label>'),
    (r'<label[^>]*>Instructions / Instrucciones</label>', '<label data-translate="medication.instructions">Instructions</label>'),
    (r'<label[^>]*>Time\(s\) / Hora\(s\) \*</label>', '<label for="medTimes" data-translate="medication.times">Time(s) *</label>'),
    (r'<label[^>]*>Hours Between Doses / Horas Entre Dosis</label>', '<label data-translate="medication.hoursBetween">Hours Between Doses</label>'),
    
    # Appointment form
    (r'<label[^>]*>Date / Fecha \*</label>', '<label data-translate="appointment.date">Date *</label>'),
    (r'<label[^>]*>Time / Hora \*</label>', '<label data-translate="appointment.time">Time *</label>'),
    (r'<label[^>]*>Type / Tipo</label>', '<label data-translate="appointment.type">Type</label>'),
    (r'<label[^>]*>Provider / Proveedor</label>', '<label data-translate="appointment.provider">Provider</label>'),
    (r'<label[^>]*>Location / Ubicación</label>', '<label data-translate="appointment.location">Location</label>'),
    (r'<label[^>]*>Notes / Notas</label>', '<label data-translate="appointment.notes">Notes</label>'),
    
    # Billing form
    (r'<label[^>]*>Billing Date / Fecha de Factura \*</label>', '<label data-translate="billing.date">Billing Date *</label>'),
    (r'<label[^>]*>Amount / Monto \*</label>', '<label data-translate="billing.amount">Amount *</label>'),
    (r'<label[^>]*>Description / Descripción</label>', '<label data-translate="billing.description">Description</label>'),
    (r'<label[^>]*>Due Date / Fecha de Vencimiento</label>', '<label data-translate="billing.dueDate">Due Date</label>'),
    (r'<label[^>]*>Status / Estado</label>', '<label data-translate="billing.status">Status</label>'),
    
    # Vital Signs form
    (r'<label[^>]*>Blood Pressure / Presión Arterial</label>', '<label data-translate="vitals.bloodPressure">Blood Pressure</label>'),
    (r'<label[^>]*>Heart Rate / Frecuencia Cardíaca</label>', '<label data-translate="vitals.heartRate">Heart Rate</label>'),
    (r'<label[^>]*>Temperature / Temperatura</label>', '<label data-translate="vitals.temperature">Temperature</label>'),
    (r'<label[^>]*>Oxygen Saturation / Saturación de Oxígeno</label>', '<label data-translate="vitals.oxygenSaturation">Oxygen Saturation</label>'),
    (r'<label[^>]*>Weight / Peso</label>', '<label data-translate="vitals.weight">Weight</label>'),
    
    # Care Notes form
    (r'<label[^>]*>Category / Categoría</label>', '<label data-translate="carenote.category">Category</label>'),
    (r'<label[^>]*>Note / Nota</label>', '<label data-translate="carenote.note">Note</label>'),
    
    # Incident form
    (r'<label[^>]*>Type / Tipo</label>', '<label data-translate="incident.type">Type</label>'),
    (r'<label[^>]*>Description / Descripción</label>', '<label data-translate="incident.description">Description</label>'),
    (r'<label[^>]*>Severity / Severidad</label>', '<label data-translate="incident.severity">Severity</label>'),
    (r'<label[^>]*>Action Taken / Acción Tomada</label>', '<label data-translate="incident.actionTaken">Action Taken</label>'),
    
    # Staff form
    (r'<label[^>]*>Username / Usuario \*</label>', '<label data-translate="staff.username">Username *</label>'),
    (r'<label[^>]*>Full Name / Nombre Completo \*</label>', '<label data-translate="staff.fullName">Full Name *</label>'),
    (r'<label[^>]*>Role / Rol \*</label>', '<label data-translate="staff.role">Role *</label>'),
    (r'<label[^>]*>Email / Correo Electrónico</label>', '<label data-translate="staff.email">Email</label>'),
    (r'<label[^>]*>Phone / Teléfono</label>', '<label data-translate="staff.phone">Phone</label>'),
    (r'<label[^>]*>Password / Contraseña</label>', '<label data-translate="staff.password">Password</label>'),
    
    # Buttons
    (r'<button[^>]*>Save Medication / Guardar Medicamento</button>', '<button type="submit" class="btn btn-success" data-translate="medication.save">Save Medication</button>'),
    (r'<button[^>]*>Save Appointment / Guardar Cita</button>', '<button type="submit" class="btn btn-success" data-translate="appointment.save">Save Appointment</button>'),
    (r'<button[^>]*>Save Bill / Guardar Factura</button>', '<button type="submit" class="btn btn-success" data-translate="billing.save">Save Bill</button>'),
    (r'<button[^>]*>Save Vital Signs / Guardar Signos Vitales</button>', '<button type="submit" class="btn btn-success" data-translate="vitals.save">Save Vital Signs</button>'),
    (r'<button[^>]*>Save Care Note / Guardar Nota de Cuidado</button>', '<button type="submit" class="btn btn-success" data-translate="carenote.save">Save Care Note</button>'),
    (r'<button[^>]*>Save Incident / Guardar Incidente</button>', '<button type="submit" class="btn btn-success" data-translate="incident.save">Save Incident</button>'),
    (r'<button[^>]*>Save Staff / Guardar Personal</button>', '<button type="submit" class="btn btn-success" data-translate="staff.save">Save Staff</button>'),
    
    # Form titles
    (r'<h3>Edit Medication / Editar Medicamento</h3>', '<h3 data-translate="medication.edit">Edit Medication</h3>'),
    (r'<h3>Edit Appointment / Editar Cita</h3>', '<h3 data-translate="appointment.edit">Edit Appointment</h3>'),
    (r'<h3>Edit Bill / Editar Factura</h3>', '<h3 data-translate="billing.edit">Edit Bill</h3>'),
    (r'<h3>Edit Vital Signs / Editar Signos Vitales</h3>', '<h3 data-translate="vitals.edit">Edit Vital Signs</h3>'),
    (r'<h3>Edit Care Note / Editar Nota de Cuidado</h3>', '<h3 data-translate="carenote.edit">Edit Care Note</h3>'),
    (r'<h3>Edit Incident / Editar Incidente</h3>', '<h3 data-translate="incident.edit">Edit Incident</h3>'),
    (r'<h3>Edit Staff Member / Editar Personal</h3>', '<h3 data-translate="staff.edit">Edit Staff Member</h3>'),
    
    # Small text
    (r'<small>Enter times separated by commas / Ingrese horas separadas por comas</small>', '<small data-translate="medication.timesHint">Enter times separated by commas</small>'),
]

# Apply replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Updated all forms with translation attributes')

