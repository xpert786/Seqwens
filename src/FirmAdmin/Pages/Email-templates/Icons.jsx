import React from 'react';

export function EyeIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function EditIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 20H21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.2786 2.87868 18.5544 2.93359 18.8107 3.04104C19.0669 3.14849 19.2984 3.30628 19.4926 3.50046C19.6868 3.69464 19.8446 3.92611 19.952 4.18237C20.0595 4.43862 20.1144 4.71445 20.1144 4.993C20.1144 5.27156 20.0595 5.54739 19.952 5.80364C19.8446 6.0599 19.6868 6.29137 19.4926 6.48554L7.5 18.5L3 19.5L4 15L16.5 3.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function DuplicateIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="9"
                y="9"
                width="11"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15 9V7C15 5.34315 13.6569 4 12 4H7C5.34315 4 4 5.34315 4 7V12C4 13.6569 5.34315 15 7 15H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SendIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4 12L20 4L16 20L11.5 13.5L4 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M20 4L11.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function FolderIcon({ className = '' }) {
    return (
        <svg
            className={`h-4 w-4 ${className}`}
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4.66659 5.83073H9.33325M4.66659 10.4974H9.33325M4.66659 8.16406H6.99992M2.33325 12.4807V1.51406C2.33325 1.42124 2.37013 1.33221 2.43576 1.26658C2.5014 1.20094 2.59043 1.16406 2.68325 1.16406H9.48025C9.57305 1.16414 9.66201 1.20107 9.72759 1.26673L11.5639 3.10306C11.5966 3.13567 11.6224 3.17441 11.6401 3.21706C11.6577 3.25971 11.6667 3.30542 11.6666 3.35156V12.4807C11.6666 12.5267 11.6575 12.5722 11.6399 12.6147C11.6224 12.6571 11.5966 12.6957 11.5641 12.7282C11.5316 12.7607 11.493 12.7865 11.4505 12.8041C11.4081 12.8217 11.3625 12.8307 11.3166 12.8307H2.68325C2.63729 12.8307 2.59178 12.8217 2.54931 12.8041C2.50685 12.7865 2.46827 12.7607 2.43576 12.7282C2.40326 12.6957 2.37748 12.6571 2.35989 12.6147C2.34231 12.5722 2.33325 12.5267 2.33325 12.4807Z"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9.33325 1.16406V3.1474C9.33325 3.24022 9.37013 3.32925 9.43576 3.39488C9.5014 3.46052 9.59043 3.4974 9.68325 3.4974H11.6666"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function PeopleIcon({ className = '' }) {
    return (
        <svg
            className={`h-4 w-4 ${className}`}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M6.5 8C7.88071 8 9 6.88071 9 5.5C9 4.11929 7.88071 3 6.5 3C5.11929 3 4 4.11929 4 5.5C4 6.88071 5.11929 8 6.5 8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13.5 8C14.6046 8 15.5 7.10457 15.5 6C15.5 4.89543 14.6046 4 13.5 4C12.3954 4 11.5 4.89543 11.5 6C11.5 7.10457 12.3954 8 13.5 8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2.5 16C2.5 13.7909 4.29086 12 6.5 12H6.5C8.70914 12 10.5 13.7909 10.5 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.5 12H14C15.932 12 17.5 13.568 17.5 15.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function ClockIcon({ className = '' }) {
    return (
        <svg
            className={`h-4 w-4 ${className}`}
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4.66675 1.16406V3.4974"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9.33325 1.16406V3.4974"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.0833 2.33594H2.91667C2.27233 2.33594 1.75 2.85827 1.75 3.5026V11.6693C1.75 12.3136 2.27233 12.8359 2.91667 12.8359H11.0833C11.7277 12.8359 12.25 12.3136 12.25 11.6693V3.5026C12.25 2.85827 11.7277 2.33594 11.0833 2.33594Z"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M1.75 5.83594H12.25"
                stroke="#3B4A66"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function InboxIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M21 13H17L15 16H9L7 13H3V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V13Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21 13V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 13C7 15.2091 8.79086 17 11 17H13C15.2091 17 17 15.2091 17 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function PlusIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M9 3.75V14.25M3.75 9H14.25"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function BoxedEditIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
            <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" strokeWidth="0.5" />
            <path d="M8.70947 4.03906H4.62614C4.31672 4.03906 4.01997 4.16198 3.80118 4.38077C3.58239 4.59956 3.45947 4.89631 3.45947 5.20573V13.3724C3.45947 13.6818 3.58239 13.9786 3.80118 14.1974C4.01997 14.4161 4.31672 14.5391 4.62614 14.5391H12.7928C13.1022 14.5391 13.399 14.4161 13.6178 14.1974C13.8366 13.9786 13.9595 13.6818 13.9595 13.3724V9.28906" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.4284 3.82337C12.6605 3.59131 12.9753 3.46094 13.3034 3.46094C13.6316 3.46094 13.9464 3.59131 14.1784 3.82337C14.4105 4.05544 14.5409 4.37019 14.5409 4.69837C14.5409 5.02656 14.4105 5.34131 14.1784 5.57337L8.92086 10.8315C8.78234 10.9699 8.61123 11.0712 8.42327 11.1261L6.74736 11.6161C6.69716 11.6308 6.64395 11.6316 6.5933 11.6187C6.54265 11.6057 6.49642 11.5793 6.45945 11.5424C6.42248 11.5054 6.39613 11.4592 6.38315 11.4085C6.37017 11.3579 6.37105 11.3047 6.38569 11.2545L6.87569 9.57854C6.93083 9.39074 7.03234 9.21982 7.17086 9.08154L12.4284 3.82337Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function BoxedSendIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" fill="#E8F0FF" />
            <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="3.75" stroke="#DFE2FF" strokeWidth="0.5" />
            <path d="M13.9582 4.03906L4.0415 7.2474L7.83317 8.9974L11.9165 6.08073L8.99984 10.1641L10.7498 13.9557L13.9582 4.03906Z" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function TrashIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

export function ShieldCheckIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0.4375L22 3.9375V11.9975C22 16.1245 19.467 19.0095 17.104 20.8005C15.6786 21.872 14.1143 22.7449 12.454 23.3955L12.367 23.4285L12.342 23.4375L12.335 23.4395L12.332 23.4405C12.331 23.4405 12.33 23.4405 12 22.4975L11.669 23.4415L11.665 23.4395L11.658 23.4375L11.633 23.4275L11.546 23.3955C11.0744 23.2131 10.6106 23.0109 10.156 22.7895C9.00838 22.232 7.91674 21.566 6.896 20.8005C4.534 19.0095 2 16.1245 2 11.9975V3.9375L12 0.4375ZM12 22.4975L11.669 23.4415L12 23.5575L12.331 23.4415L12 22.4975ZM12 21.4255L12.009 21.4215C13.3927 20.8496 14.6986 20.1054 15.896 19.2065C18.034 17.5875 20 15.2205 20 11.9975V5.3575L12 2.5575L4 5.3575V11.9975C4 15.2205 5.966 17.5855 8.104 19.2075C9.304 20.1081 10.613 20.8533 12 21.4255ZM18.072 8.3405L11.001 15.4115L6.758 11.1695L8.173 9.7545L11 12.5835L16.657 6.9265L18.072 8.3405Z" fill="#3AD6F2" />
        </svg>
    );
}

export function PaperPlaneIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.6109 5.38281L5.38867 9.66059L10.4442 11.9939L15.8887 8.10503L11.9998 13.5495L14.3331 18.605L18.6109 5.38281Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function StatsEyeIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#3AD6F2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function StatsClickIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 11C13 9.93913 12.5786 8.92172 11.8284 8.17157C11.0783 7.42143 10.0609 7 9 7C7.93913 7 6.92172 7.42143 6.17157 8.17157C5.42143 8.92172 5 9.93913 5 11C5 12.0609 5.42143 13.0783 6.17157 13.8284C6.92172 14.5786 7.93913 15 9 15C10.0609 15 11.0783 14.5786 11.8284 13.8284C12.5786 13.0783 13 12.0609 13 11Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.039 7.55685C10.9128 6.65932 11.0952 5.74555 11.5563 4.96522C12.0173 4.1849 12.7297 3.58429 13.5768 3.26179C14.4238 2.93928 15.3553 2.91401 16.2185 3.1901C17.0818 3.4662 17.8257 4.02729 18.3284 4.78147C18.8311 5.53564 19.0628 6.43818 18.9855 7.34123C18.9081 8.24428 18.5264 9.0943 17.9028 9.75205C17.2793 10.4098 16.4508 10.8363 15.5531 10.9616C14.6555 11.0869 13.7419 10.9037 12.962 10.4419M15 20.9989C15 19.4076 14.3679 17.8814 13.2426 16.7562C12.1174 15.631 10.5913 14.9989 9 14.9989C7.4087 14.9989 5.88258 15.631 4.75736 16.7562C3.63214 17.8814 3 19.4076 3 20.9989" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 17C21 15.4087 20.3679 13.8826 19.2426 12.7574C18.1174 11.6321 16.5913 11 15 11" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function UploadIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 8.75V11.0833C12.25 11.3928 12.1271 11.6895 11.9083 11.9083C11.6895 12.1271 11.3928 12.25 11.0833 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.91634 4.66667L6.99967 1.75L4.08301 4.66667" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 1.75V8.75" stroke="#3B4A66" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function FolderPlusIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 7.5V12M6.75 9.75H11.25M15 15C15.3978 15 15.7794 14.842 16.0607 14.5607C16.342 14.2794 16.5 13.8978 16.5 13.5V6C16.5 5.60218 16.342 5.22064 16.0607 4.93934C15.7794 4.65804 15.3978 4.5 15 4.5H9.075C8.82414 4.50246 8.57666 4.44196 8.35523 4.32403C8.13379 4.20611 7.94547 4.03453 7.8075 3.825L7.2 2.925C7.06342 2.7176 6.87748 2.54736 6.65887 2.42955C6.44027 2.31174 6.19583 2.25004 5.9475 2.25H3C2.60218 2.25 2.22064 2.40804 1.93934 2.68934C1.65804 2.97064 1.5 3.35218 1.5 3.75V13.5C1.5 13.8978 1.65804 14.2794 1.93934 14.5607C2.22064 14.842 2.60218 15 3 15H15Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MiniFolderIcon() {
    return (
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0H1.66667C0.75 0 0 0.75 0 1.66667V10C0 10.9167 0.75 11.6667 1.66667 11.6667H15C15.9167 11.6667 16.6667 10.9167 16.6667 10V1.66667C16.6667 0.75 15.9167 0 15 0Z" fill="#FFCA28" />
        </svg>
    );
}

export function BoxedDotsIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="4.75" fill="white" />
            <rect x="0.25" y="0.25" width="17.5" height="17.5" rx="4.75" stroke="#E8F0FF" strokeWidth="0.5" />
            <path d="M8.58317 9.0026C8.58317 9.23272 8.76972 9.41927 8.99984 9.41927C9.22996 9.41927 9.4165 9.23272 9.4165 9.0026C9.4165 8.77249 9.22996 8.58594 8.99984 8.58594C8.76972 8.58594 8.58317 8.77249 8.58317 9.0026Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.58317 11.9167C8.58317 12.1468 8.76972 12.3333 8.99984 12.3333C9.22996 12.3333 9.4165 12.1468 9.4165 11.9167C9.4165 11.6865 9.22996 11.5 8.99984 11.5C8.76972 11.5 8.58317 11.6865 8.58317 11.9167Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.58317 6.08073C8.58317 6.31085 8.76972 6.4974 8.99984 6.4974C9.22996 6.4974 9.4165 6.31085 9.4165 6.08073C9.4165 5.85061 9.22996 5.66406 8.99984 5.66406C8.76972 5.66406 8.58317 5.85061 8.58317 6.08073Z" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function TinyTrashIcon() {
    return (
        <svg width="7" height="8" viewBox="0 0 7 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.25 1.58333H6.25M5.58333 1.58333V6.25C5.58333 6.58333 5.25 6.91667 4.91667 6.91667H1.58333C1.25 6.91667 0.916667 6.58333 0.916667 6.25V1.58333M1.91667 1.58333V0.916667C1.91667 0.583333 2.25 0.25 2.58333 0.25H3.91667C4.25 0.25 4.58333 0.583333 4.58333 0.916667V1.58333M2.58333 3.25V5.25M3.91667 3.25V5.25" stroke="#3B4A66" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
