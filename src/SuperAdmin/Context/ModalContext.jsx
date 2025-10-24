import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectedPrivileges, setSelectedPrivileges] = useState([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [showPrivilegesDropdown, setShowPrivilegesDropdown] = useState(false);

  const privileges = [
    "Manage Users",
    "Manage Firms", 
    "Manage Subscriptions",
    "View Analytics",
    "Billing & Payments",
    "Support Tools",
    "System Settings"
  ];

  const handleShowRoleModal = () => {
    setShowRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setRoleName("");
    setSelectedPrivileges([]);
    setSaveAsTemplate(true);
    setShowPrivilegesDropdown(false);
  };

  const handleSaveRole = () => {
    console.log("Save role:", { roleName, selectedPrivileges, saveAsTemplate });
    handleCloseRoleModal();
  };

  const togglePrivilege = (privilege) => {
    if (selectedPrivileges.includes(privilege)) {
      setSelectedPrivileges(selectedPrivileges.filter(p => p !== privilege));
    } else {
      setSelectedPrivileges([...selectedPrivileges, privilege]);
    }
  };

  const value = {
    showRoleModal,
    roleName,
    setRoleName,
    selectedPrivileges,
    saveAsTemplate,
    setSaveAsTemplate,
    showPrivilegesDropdown,
    setShowPrivilegesDropdown,
    privileges,
    handleShowRoleModal,
    handleCloseRoleModal,
    handleSaveRole,
    togglePrivilege
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
