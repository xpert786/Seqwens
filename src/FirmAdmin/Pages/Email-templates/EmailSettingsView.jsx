import React, { useState } from 'react';

const stats = [
  {
    label: 'Total Templates',
    value: '12',
    change: '+2 from last month',
    Icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0.4375L22 3.9375V11.9975C22 16.1245 19.467 19.0095 17.104 20.8005C15.6786 21.872 14.1143 22.7449 12.454 23.3955L12.367 23.4285L12.342 23.4375L12.335 23.4395L12.332 23.4405C12.331 23.4405 12.33 23.4405 12 22.4975L11.669 23.4415L11.665 23.4395L11.658 23.4375L11.633 23.4275L11.546 23.3955C11.0744 23.2131 10.6106 23.0109 10.156 22.7895C9.00838 22.232 7.91674 21.566 6.896 20.8005C4.534 19.0095 2 16.1245 2 11.9975V3.9375L12 0.4375ZM12 22.4975L11.669 23.4415L12 23.5575L12.331 23.4415L12 22.4975ZM12 21.4255L12.009 21.4215C13.3927 20.8496 14.6986 20.1054 15.896 19.2065C18.034 17.5875 20 15.2205 20 11.9975V5.3575L12 2.5575L4 5.3575V11.9975C4 15.2205 5.966 17.5855 8.104 19.2075C9.304 20.1081 10.613 20.8533 12 21.4255ZM18.072 8.3405L11.001 15.4115L6.758 11.1695L8.173 9.7545L11 12.5835L16.657 6.9265L18.072 8.3405Z" fill="#3AD6F2" />
      </svg>
    )
  },
  {
    label: 'Emails Sent',
    value: '247',
    change: 'This Month',
    Icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.6109 5.38281L5.38867 9.66059L10.4442 11.9939L15.8887 8.10503L11.9998 13.5495L14.3331 18.605L18.6109 5.38281Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Avg. Open Rate',
    value: '91.5%',
    change: '+2.3% from last month',
    Icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Avg. Click Rate',
    value: '81.5%',
    change: '+1.8% from last month',
    Icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 11C13 9.93913 12.5786 8.92172 11.8284 8.17157C11.0783 7.42143 10.0609 7 9 7C7.93913 7 6.92172 7.42143 6.17157 8.17157C5.42143 8.92172 5 9.93913 5 11C5 12.0609 5.42143 13.0783 6.17157 13.8284C6.92172 14.5786 7.93913 15 9 15C10.0609 15 11.0783 14.5786 11.8284 13.8284C12.5786 13.0783 13 12.0609 13 11Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.039 7.55685C10.9128 6.65932 11.0952 5.74555 11.5563 4.96522C12.0173 4.1849 12.7297 3.58429 13.5768 3.26179C14.4238 2.93928 15.3553 2.91401 16.2185 3.1901C17.0818 3.4662 17.8257 4.02729 18.3284 4.78147C18.8311 5.53564 19.0628 6.43818 18.9855 7.34123C18.9081 8.24428 18.5264 9.0943 17.9028 9.75205C17.2793 10.4098 16.4508 10.8363 15.5531 10.9616C14.6555 11.0869 13.7419 10.9037 12.962 10.4419M15 20.9989C15 19.4076 14.3679 17.8814 13.2426 16.7562C12.1174 15.631 10.5913 14.9989 9 14.9989C7.4087 14.9989 5.88258 15.631 4.75736 16.7562C3.63214 17.8814 3 19.4076 3 20.9989" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 17C21 15.4087 20.3679 13.8826 19.2426 12.7574C18.1174 11.6321 16.5913 11 15 11" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

const Toggle = ({ label, description, defaultOn }) => {
  const [isOn, setIsOn] = useState(defaultOn);
  
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
          checked={isOn}
          onChange={() => setIsOn(!isOn)}
        />
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
          isOn ? 'bg-[#FF8A63]' : 'bg-[#CBD5F5]'
        }`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isOn ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>
      </label>
    </div>
  );
};

export default function EmailSettingsView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 !border border-[#E8F0FF]">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-[#1F2A55]">SMTP Configuration</h3>
              <p className="text-sm text-[#7B8AB2]">Configure your email server settings</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">SMTP Host</label>
                <input
                  type="text"
                  defaultValue="smtp.gmail.com"
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Port</label>
                  <input
                    type="text"
                    defaultValue="587"
                    className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Encryption</label>
                  <select className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30">
                    <option>TLS</option>
                    <option>SSL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Username</label>
                <input
                  type="email"
                  defaultValue="admin@taxpractice.com"
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Password</label>
                <input
                  type="password"
                  defaultValue="********"
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 !border border-[#E8F0FF]">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#1F2A55]">Compliance Settings</h3>
              <p className="text-sm text-[#7B8AB2]">Configure compliance and legal requirements</p>
            </div>

            <div className="space-y-3">
              <Toggle label="Auto-include IRS Disclaimers" description="Automatically add required tax disclaimers" defaultOn />
              <Toggle label="Auto-include Opt-out Links" description="Add unsubscribe links to marketing emails" defaultOn={false} />
              <Toggle label="Enable Audit Trails" description="Track all template changes and usage" defaultOn />

              <div>
                <label className="text-sm font-semibold tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Default IRS Disclaimer</label>
                <div className="rounded-2xl !border border-[#E8F0FF] bg-[#FFFFFF] p-4 text-sm text-[#1F2A55]">
                  This communication is for informational purposes only and does not constitute tax advice. Please consult with a qualified tax professional for specific guidance.
                </div>
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
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">From Name</label>
                <input
                  type="text"
                  defaultValue="Tax Practice Pro"
                  className="mt-1 w-full rounded-lg !border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">From Email</label>
                <input
                  type="email"
                  defaultValue="noreply@taxpractice.com"
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Reply-To Email</label>
                <input
                  type="email"
                  defaultValue="support@taxpractice.com"
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
              <div>
                <label className="text-sm font-regular tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Email Footer</label>
                <textarea
                  rows={3}
                  defaultValue="© 2024 Tax Practice Pro. All rights reserved."
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
                  defaultValue="https://example.com/logo.png"
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
                  <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1F2A55] shadow-sm ring-1 ring-[#DDE5FF] hover:bg-[#F0F4FF] transition">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M9.91634 4.66667L6.99967 1.75L4.08301 4.66667" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M7 1.75V8.75" stroke="#3B4A66" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                    Upload Logo
                  </button>
                  <p className="text-xs text-[#7B8AB2]">PNG, JPG up to 2MB</p>
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
                defaultOn
              />
              <Toggle
                label="Auto-send Appointment Confirmations"
                description="Confirm appointments automatically"
                defaultOn
              />
              <Toggle
                label="Auto-send Document Reminders"
                description="Remind clients about missing documents"
                defaultOn
              />

              <div>
                <label className="text-sm font-semibold tracking-wide text-[#3B4A66] font-[BasisGrotesquePro]">Reminder Frequency (days)</label>
                <input
                  type="number"
                  defaultValue={3}
                  className="mt-1 w-full rounded-lg border border-[#DDE5FF] px-3 py-2 text-sm text-[#1F2A55] focus:border-[#3AD6F2] focus:outline-none focus:ring-2 focus:ring-[#3AD6F2]/30"
                />
              </div>
            </div>

           
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button className="!rounded-lg px-4 py-2 text-sm font-regular text-[#3B4A66] bg-[#FFFFFF] !border border-[#E8F0FF]">
                Test Email Configuration
              </button>
              <button className="!rounded-lg bg-[#F56D2D] px-4 py-2 text-sm font-regular text-white transition hover:bg-[#FF7142]">
                Save Settings
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}

