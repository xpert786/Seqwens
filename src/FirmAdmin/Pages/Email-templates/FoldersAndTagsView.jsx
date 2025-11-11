import React from 'react';

const folders = [
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    templates: 8,
    cardBg: 'bg-white',
    border: 'border-[#FFD9A8]',
    iconColor: 'text-[#F59E0B]'
  },
  {
    id: 'tax-season',
    name: 'Tax Season',
    templates: 15,
    cardBg: 'bg-white',
    border: 'border-[#E7EDFF]',
    iconColor: 'text-[#F59E0B]'
  },
  {
    id: 'billing',
    name: 'Billing & Payments',
    templates: 6,
    cardBg: 'bg-white',
    border: 'border-[#E7EDFF]',
    iconColor: 'text-[#F59E0B]'
  },
  {
    id: 'appointments',
    name: 'Appointments',
    templates: 8,
    cardBg: 'bg-white',
    border: 'border-[#E7EDFF]',
    iconColor: 'text-[#F59E0B]'
  }
];

const tags = ['Documents', 'Billing', 'Tax Prep', 'Appointments', 'Tax Return', 'Compliance', 'Urgent'];

export default function FoldersAndTagsView() {
  const [selectedFolder, setSelectedFolder] = React.useState(folders[0]?.id ?? null);

  return (
    <div className="space-y-6 py-6 ">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Documents / Folders */}
        <div className="rounded-2xl border border-[#E7EDFF] bg-white">
          <div className="flex flex-wrap justify-between gap-3 border-b border-[#E9F0FF] px-5 py-5">
            <div>
              <h3 className="text-lg font-semibold text-[#1F2A55]">Documents</h3>
              <p className="text-sm text-[#7B8AB2]">Client documents and supporting materials</p>
            </div>
            <button className="inline-flex h-9 items-center gap-2 !rounded-lg bg-[#F56D2D] px-4 text-sm font-semibold text-white transition hover:bg-[#FF7142]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 7.5V12M6.75 9.75H11.25M15 15C15.3978 15 15.7794 14.842 16.0607 14.5607C16.342 14.2794 16.5 13.8978 16.5 13.5V6C16.5 5.60218 16.342 5.22064 16.0607 4.93934C15.7794 4.65804 15.3978 4.5 15 4.5H9.075C8.82414 4.50246 8.57666 4.44196 8.35523 4.32403C8.13379 4.20611 7.94547 4.03453 7.8075 3.825L7.2 2.925C7.06342 2.7176 6.87748 2.54736 6.65887 2.42955C6.44027 2.31174 6.19583 2.25004 5.9475 2.25H3C2.60218 2.25 2.22064 2.40804 1.93934 2.68934C1.65804 2.97064 1.5 3.35218 1.5 3.75V13.5C1.5 13.8978 1.65804 14.2794 1.93934 14.5607C2.22064 14.842 2.60218 15 3 15H15Z" stroke="white" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              Create New Folder
            </button>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {folders.map((folder, index) => {
              const isSelected = selectedFolder === folder.id;

              return (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`flex h-[116px] w-full cursor-pointer items-center justify-between rounded-2xl border px-2 py-4 transition ${
                    isSelected
                      ? 'border-[#FFD9A8] bg-[#FFF5EB]'
                      : `${folder.border} ${folder.cardBg} hover:border-[#FFD9A8] hover:bg-[#FFF5EB]`
                  }`}
                >
                  <div className="flex  gap-3">
                    <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 0H1.66667C0.75 0 0 0.75 0 1.66667V10C0 10.9167 0.75 11.6667 1.66667 11.6667H15C15.9167 11.6667 16.6667 10.9167 16.6667 10V1.66667C16.6667 0.75 15.9167 0 15 0Z" fill="#FFCA28" />
                    </svg>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#1F2A55]">{folder.name}</p>
                      <p className="text-xs text-[#7B8AB2]">{folder.templates} templates</p>
                    </div>
                  </div>
                  <button className=" p-1 text-[#94A3B8] transition hover:text-[#1F2A55]">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="4.75" fill="white" />
                      <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="4.75" stroke="#E8F0FF" stroke-width="0.5" />
                      <path d="M8.58317 9.0026C8.58317 9.23272 8.76972 9.41927 8.99984 9.41927C9.22996 9.41927 9.4165 9.23272 9.4165 9.0026C9.4165 8.77249 9.22996 8.58594 8.99984 8.58594C8.76972 8.58594 8.58317 8.77249 8.58317 9.0026Z" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M8.58317 11.9167C8.58317 12.1468 8.76972 12.3333 8.99984 12.3333C9.22996 12.3333 9.4165 12.1468 9.4165 11.9167C9.4165 11.6865 9.22996 11.5 8.99984 11.5C8.76972 11.5 8.58317 11.6865 8.58317 11.9167Z" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M8.58317 6.08073C8.58317 6.31085 8.76972 6.4974 8.99984 6.4974C9.22996 6.4974 9.4165 6.31085 9.4165 6.08073C9.4165 5.85061 9.22996 5.66406 8.99984 5.66406C8.76972 5.66406 8.58317 5.85061 8.58317 6.08073Z" stroke="black" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>

                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-2xl bg-[#FFFFFF] p-6 ">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[#1F2A55]">Tags</h3>
            <p className="text-sm text-[#7B8AB2]">Manage template tags for better organization</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full !border border-[#F49C2D] bg-[#FFF4E6] px-4 py-2 text-sm font-medium text-[#2D3A5C]"
              >

                {tag}
                <button
                  type="button"
                  className="flex text-[#2D3A5C] transition hover:border-[#F6AD55] hover:bg-[#FFF4E6]"
                  aria-label={`Remove ${tag}`}
                >
                  <svg width="7" height="8" viewBox="0 0 7 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.25 1.58333H6.25M5.58333 1.58333V6.25C5.58333 6.58333 5.25 6.91667 4.91667 6.91667H1.58333C1.25 6.91667 0.916667 6.58333 0.916667 6.25V1.58333M1.91667 1.58333V0.916667C1.91667 0.583333 2.25 0.25 2.58333 0.25H3.91667C4.25 0.25 4.58333 0.583333 4.58333 0.916667V1.58333M2.58333 3.25V5.25M3.91667 3.25V5.25" stroke="#3B4A66" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>

                </button>
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-row flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Add new tag..."
              className="min-w-[180px] flex-1 !rounded-lg !border border-[#DDE5FF] bg-white px-3 py-2 text-sm text-[#1F2A55] placeholder:text-[#9AA7C7]  focus:outline-none "
            />
            <button className=" !rounded-lg bg-[#F56D2D] px-6 py-2 text-sm font-semibold text-white">
              Add Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}







