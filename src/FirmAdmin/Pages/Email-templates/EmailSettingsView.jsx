import { useState, useEffect } from 'react';
import { firmAdminEmailSettingsAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import {
  ShieldCheckIcon,
  PaperPlaneIcon,
  StatsEyeIcon,
  StatsClickIcon,
  UploadIcon
} from './Icons';

const stats = [
  {
    label: 'Total Templates',
    value: '12',
    change: '+2 from last month',
    Icon: ShieldCheckIcon
  },
  {
    label: 'Emails Sent',
    value: '247',
    change: 'This Month',
    Icon: PaperPlaneIcon
  },
  {
    label: 'Avg. Open Rate',
    value: '91.5%',
    change: '+2.3% from last month',
    Icon: StatsEyeIcon
  },
  {
    label: 'Avg. Click Rate',
    value: '81.5%',
    change: '+1.8% from last month',
    Icon: StatsClickIcon
  }
];

const Toggle = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-start justify-between rounded-lg px-2 py-2">
      <div>
        <p className="text-sm font-medium text-[#1F2A55] font-[BasisGrotesquePro]">{label}</p>
        {description && <p className="text-xs text-[#7B8AB2] font-[BasisGrotesquePro]">{description}</p>}
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${checked ? 'bg-[#FF8A63]' : 'bg-[#CBD5F5]'
          }`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </div>
      </label>
    </div>
  );
};

export default function EmailSettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Compliance Settings State
  const [complianceSettings, setComplianceSettings] = useState({
    auto_include_irs_disclaimers: true,
    auto_include_opt_out_links: false,
    enable_audit_trails: true,
    default_irs_disclaimer: 'This communication is for informational purposes only and does not constitute tax advice. Please consult with a qualified tax professional for specific guidance.'
  });

  // Email Branding State
  const [emailBranding, setEmailBranding] = useState({
    email_footer: '© 2024 Tax Practice Pro. All rights reserved.',
    logo_url: 'https://example.com/logo.png'
  });

  // Automation Settings State
  const [automationSettings, setAutomationSettings] = useState({
    auto_send_welcome_emails: true,
    auto_send_appointment_confirmations: true,
    auto_send_document_reminders: true,
    reminder_frequency_days: 3
  });

  // Fetch email settings on mount
  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await firmAdminEmailSettingsAPI.getEmailSettings();

      if (response?.success && response?.data) {
        const data = response.data;

        // Set compliance settings
        if (data.compliance_settings) {
          setComplianceSettings(prev => ({
            ...prev,
            ...data.compliance_settings
          }));
        }

        // Set email branding
        if (data.email_branding) {
          setEmailBranding(prev => ({
            ...prev,
            ...data.email_branding
          }));
        }

        // Set automation settings
        if (data.automation_settings) {
          setAutomationSettings(prev => ({
            ...prev,
            ...data.automation_settings
          }));
        }
      } else if (response?.data) {
        // Handle case where response.data is the settings object directly
        const data = response.data;
        if (data.compliance_settings) {
          setComplianceSettings(prev => ({ ...prev, ...data.compliance_settings }));
        }
        if (data.email_branding) {
          setEmailBranding(prev => ({ ...prev, ...data.email_branding }));
        }
        if (data.automation_settings) {
          setAutomationSettings(prev => ({ ...prev, ...data.automation_settings }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch email settings:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to load email settings');
      toast.error(errorMsg || 'Failed to load email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        compliance_settings: complianceSettings,
        email_branding: emailBranding,
        automation_settings: automationSettings
      };

      const response = await firmAdminEmailSettingsAPI.updateEmailSettings(payload);

      if (response?.success || response?.data) {
        toast.success('Email settings saved successfully');
      } else {
        throw new Error(response?.message || 'Failed to save email settings');
      }
    } catch (err) {
      console.error('Failed to save email settings:', err);
      const errorMsg = handleAPIError(err);
      setError(errorMsg || 'Failed to save email settings');
      toast.error(errorMsg || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading email settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#E8F0FF]">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0FBFF] text-[#3AD6F2]">
                <stat.Icon />
              </div>
              <span className={`text-xs font-medium ${stat.change.includes('+') ? 'text-green-600' : 'text-[#7B8AB2]'}`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[#7B8AB2] font-[BasisGrotesquePro]">{stat.label}</h3>
              <p className="mt-1 text-2xl font-bold text-[#1F2A55] font-[BasisGrotesquePro]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 !border border-[#E8F0FF]">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#1F2A55]">Compliance Settings</h3>
              <p className="text-sm text-[#7B8AB2]">Configure compliance and legal requirements</p>
            </div>

            <div className="space-y-3">
              <Toggle
                label="Auto-include IRS Disclaimers"
                description="Automatically add required tax disclaimers"
                checked={complianceSettings.auto_include_irs_disclaimers}
                onChange={(e) => setComplianceSettings(prev => ({
                  ...prev,
                  auto_include_irs_disclaimers: e.target.checked
                }))}
              />
              <Toggle
                label="Auto-include Opt-out Links"
                description="Add unsubscribe links to marketing emails"
                checked={complianceSettings.auto_include_opt_out_links}
                onChange={(e) => setComplianceSettings(prev => ({
                  ...prev,
                  auto_include_opt_out_links: e.target.checked
                }))}
              />
              <Toggle
                label="Enable Audit Trails"
                description="Track all template changes and usage"
                checked={complianceSettings.enable_audit_trails}
                onChange={(e) => setComplianceSettings(prev => ({
                  ...prev,
                  enable_audit_trails: e.target.checked
                }))}
              />

              <div>
                <label className="text-sm font-semibold tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Default IRS Disclaimer</label>
                <textarea
                  rows={3}
                  value={complianceSettings.default_irs_disclaimer || ''}
                  onChange={(e) => setComplianceSettings(prev => ({
                    ...prev,
                    default_irs_disclaimer: e.target.value
                  }))}
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 !border border-[#E8F0FF]">
            <div className="mb-5">
              <h3 className="text-lg font-regular text-[#1F2A55]">Email Branding</h3>
              <p className="text-sm text-[#7B8AB2]">Customize your email appearance</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Email Footer</label>
                <textarea
                  rows={3}
                  value={emailBranding.email_footer || ''}
                  onChange={(e) => setEmailBranding(prev => ({
                    ...prev,
                    email_footer: e.target.value
                  }))}
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
              {/* Logo URL Section */}
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={emailBranding.logo_url || ''}
                  onChange={(e) => setEmailBranding(prev => ({
                    ...prev,
                    logo_url: e.target.value
                  }))}
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>

              {/* OR Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-[#E4ECFF]" />
                <span className="mx-3 text-xs text-[#7B8AB2] font-semibold">Or</span>
                <div className="flex-grow border-t border-[#E4ECFF]" />
              </div>

              {/* Upload Logo Section */}
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">
                  Upload Logo
                </label>
                <div className="mt-1 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#C8D5FF] bg-[#F8FBFF] p-6 text-sm">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1F2A55] shadow-sm ring-1 ring-[#DDE5FF] transition">
                    <UploadIcon />
                    Upload Logo
                  </button>
                  <p className="text-xs text-[#7B8AB2]">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 !border border-[#E8F0FF]">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-[#1F2A55]">Automation Settings</h3>
          <p className="text-sm text-[#7B8AB2]">Configure automated email workflows</p>
        </div>

        <div className="space-y-4">
          <Toggle
            label="Auto-send Welcome Emails"
            description="Send welcome email to new clients"
            checked={automationSettings.auto_send_welcome_emails}
            onChange={(e) => setAutomationSettings(prev => ({
              ...prev,
              auto_send_welcome_emails: e.target.checked
            }))}
          />
          <Toggle
            label="Auto-send Appointment Confirmations"
            description="Confirm appointments automatically"
            checked={automationSettings.auto_send_appointment_confirmations}
            onChange={(e) => setAutomationSettings(prev => ({
              ...prev,
              auto_send_appointment_confirmations: e.target.checked
            }))}
          />
          <Toggle
            label="Auto-send Document Reminders"
            description="Remind clients about missing documents"
            checked={automationSettings.auto_send_document_reminders}
            onChange={(e) => setAutomationSettings(prev => ({
              ...prev,
              auto_send_document_reminders: e.target.checked
            }))}
          />

          <div>
            <label className="text-sm font-semibold tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Reminder Frequency (days)</label>
            <input
              type="number"
              value={automationSettings.reminder_frequency_days || 3}
              onChange={(e) => setAutomationSettings(prev => ({
                ...prev,
                reminder_frequency_days: parseInt(e.target.value) || 3
              }))}
              min="1"
              className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-start">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="!rounded-lg bg-[#F56D2D] px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
