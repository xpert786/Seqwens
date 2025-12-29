/**
 * Workflow Feature - All Dropdown Selectable Values
 * This file contains all valid choices for workflow dropdown fields
 */

// StageAction - Action Types
export const ACTION_TYPES = [
  { value: 'task', label: 'Create Task' },
  { value: 'email', label: 'Send Email' },
  { value: 'sms', label: 'Send SMS' },
  { value: 'document_request', label: 'Request Document' },
  { value: 'esign', label: 'Request E-Signature' },
  { value: 'appointment', label: 'Schedule Appointment' },
  { value: 'status_update', label: 'Update Status' },
  { value: 'notification', label: 'Send Notification' },
  { value: 'invoice', label: 'Create Invoice' }
];

// StageAction - Execute On
export const EXECUTE_ON_OPTIONS = [
  { value: 'stage_start', label: 'Stage Start' },
  { value: 'stage_complete', label: 'Stage Complete' }
];

// WorkflowStage - User Type Groups
export const USER_TYPE_GROUPS = [
  { value: 'admin', label: 'Admin Only' },
  { value: 'preparer', label: 'Tax Preparer' },
  { value: 'taxpayer', label: 'Taxpayer/Client' },
  { value: 'all', label: 'All Users' }
];

// WorkflowTemplate - Tax Form Types
export const TAX_FORM_TYPES = [
  { value: '1040', label: 'Form 1040 - Individual' },
  { value: '1120', label: 'Form 1120 - Corporation' },
  { value: '1120S', label: 'Form 1120S - S Corporation' },
  { value: '1065', label: 'Form 1065 - Partnership' },
  { value: '1041', label: 'Form 1041 - Estate/Trust' },
  { value: '990', label: 'Form 990 - Nonprofit' },
  { value: 'other', label: 'Other' }
];

// WorkflowInstance - Status
export const WORKFLOW_INSTANCE_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// DocumentRequest - Status
export const DOCUMENT_REQUEST_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_revision', label: 'Needs Revision' }
];

// WorkflowTrigger - Trigger Types
export const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'time_based', label: 'Time Based' },
  { value: 'event_based', label: 'Event Based' },
  { value: 'condition_based', label: 'Condition Based' }
];

// WorkflowTrigger - Event Types
export const EVENT_TYPES = [
  { value: 'document_uploaded', label: 'Document Uploaded' },
  { value: 'document_verified', label: 'Document Verified' },
  { value: 'esign_completed', label: 'E-Signature Completed' },
  { value: 'task_completed', label: 'Task Completed' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled' },
  { value: 'invoice_created', label: 'Invoice Created' }
];

// WorkflowReminder - Reminder Types
export const REMINDER_TYPES = [
  { value: 'admin', label: 'Admin' },
  { value: 'preparer', label: 'Tax Preparer' },
  { value: 'taxpayer', label: 'Taxpayer/Client' }
];

// WorkflowReminder - Timing Types
export const TIMING_TYPES = [
  { value: 'before_due', label: 'Before Due Date' },
  { value: 'on_due', label: 'On Due Date' },
  { value: 'after_overdue', label: 'After Overdue' }
];

// WorkflowReminder - Timing Units
export const TIMING_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'hours', label: 'Hours' }
];

// WorkflowReminder - Notification Channels
export const NOTIFICATION_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'in_app', label: 'In-App Notification' }
];

// Task Priority
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

