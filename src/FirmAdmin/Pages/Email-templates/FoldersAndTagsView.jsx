import React from 'react';
import {
    FolderPlusIcon,
    MiniFolderIcon,
    BoxedDotsIcon,
    TinyTrashIcon
} from './Icons';

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
              <FolderPlusIcon />

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
                    <MiniFolderIcon />

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#1F2A55]">{folder.name}</p>
                      <p className="text-xs text-[#7B8AB2]">{folder.templates} templates</p>
                    </div>
                  </div>
                  <button className=" p-1 text-[#94A3B8] transition hover:text-[#1F2A55]">
                    <BoxedDotsIcon />
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
                  <TinyTrashIcon />

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







