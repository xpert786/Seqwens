import React from 'react';
import './styles/MembershipStatusBadge.css';

const STATUS_COLORS = {
  active: {
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#10B981'
  },
  pending: {
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#F59E0B'
  },
  disabled: {
    bg: '#F3F4F6',
    text: '#374151',
    border: '#6B7280'
  }
};

const ROLE_COLORS = {
  team_member: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#3B82F6'
  },
  taxpayer: {
    bg: '#E0E7FF',
    text: '#3730A3',
    border: '#6366F1'
  },
  firm_admin: {
    bg: '#FCE7F3',
    text: '#831843',
    border: '#EC4899'
  },
  admin: {
    bg: '#FCE7F3',
    text: '#831843',
    border: '#EC4899'
  },
  firm: {
    bg: '#FCE7F3',
    text: '#831843',
    border: '#EC4899'
  }
};

export default function MembershipStatusBadge({ status, role, className = '' }) {
  const statusLower = (status || 'active').toLowerCase();
  const roleLower = (role || '').toLowerCase();
  
  const statusColors = STATUS_COLORS[statusLower] || STATUS_COLORS.active;
  const roleColors = ROLE_COLORS[roleLower] || {
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#9CA3AF'
  };

  const statusDisplay = statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
  
  const roleDisplayNames = {
    team_member: 'Team Member',
    taxpayer: 'Taxpayer',
    firm_admin: 'Firm Admin',
    admin: 'Firm Admin',
    firm: 'Firm Admin'
  };
  
  const roleDisplay = roleDisplayNames[roleLower] || role || 'Member';

  return (
    <div className={`membership-badge-container ${className}`}>
      {role && (
        <span
          className="membership-badge membership-badge-role"
          style={{
            backgroundColor: roleColors.bg,
            color: roleColors.text,
            borderColor: roleColors.border
          }}
        >
          {roleDisplay}
        </span>
      )}
      <span
        className="membership-badge membership-badge-status"
        style={{
          backgroundColor: statusColors.bg,
          color: statusColors.text,
          borderColor: statusColors.border
        }}
      >
        {statusDisplay}
      </span>
    </div>
  );
}

