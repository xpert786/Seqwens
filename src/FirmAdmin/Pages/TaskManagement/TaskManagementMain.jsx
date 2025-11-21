import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TableView from './TableView';
import CreateTaskModal from './CreateTaskModal';
import { firmAdminTasksAPI, handleAPIError } from '../../../ClientOnboarding/utils/apiUtils';
import { toast } from 'react-toastify';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TaskManagementMain = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskData, setTaskData] = useState([]);
  const [summary, setSummary] = useState({
    completed: 0,
    in_progress: 0,
    pending: 0,
    overdue: 0,
    total_hours: 0
  });
  const [pagination, setPagination] = useState({
    total_count: 0,
    page: 1,
    page_size: 3,
    total_pages: 1
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        page_size: 3 // Show 3 tasks per page
      };

      // Add filters if needed
      if (priorityFilter !== 'All Priorities') {
        params.priority = priorityFilter.toLowerCase();
      }
      if (categoryFilter !== 'All Categories') {
        params.category = categoryFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await firmAdminTasksAPI.listTasks(params);

      if (response.success && response.data) {
        // Update summary from statistics (new API) or summary (old API) for backward compatibility
        const stats = response.data.statistics || response.data.summary;
        if (stats) {
          setSummary({
            completed: stats.completed || 0,
            in_progress: stats.in_progress || 0,
            pending: stats.pending || 0,
            overdue: stats.overdue || 0,
            total_hours: stats.total_hours || 0
          });
        }

        // Transform API tasks to component format
        const transformedTasks = (response.data.tasks || []).map(task => ({
          id: task.id,
          task: task.task_title,
          description: task.description || task.category || '',
          assignedTo: {
            initials: task.assigned_to_initials || (task.assigned_to_name ? task.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'NA'),
            name: task.assigned_to_name || 'Unassigned'
          },
          client: task.client_name || (task.clients_info && task.clients_info.length > 0 ? task.clients_info[0].name : 'No Client'),
          priority: task.priority_display || task.priority || 'Medium',
          status: task.status_display || task.status || 'Pending',
          progress: task.progress_percentage || 0,
          dueDate: task.due_date_formatted || task.due_date || '',
          // hours: task.hours_display || `${task.hours_spent || 0}h / ${task.estimated_hours || 0}h`,
          category: task.category || task.task_type_display || '',
          is_overdue: task.is_overdue || false
        }));

        setTaskData(transformedTasks);

        // Update pagination info
        if (response.data.pagination) {
          setPagination({
            total_count: response.data.pagination.total_count || 0,
            page: response.data.pagination.page || currentPage,
            page_size: response.data.pagination.page_size || 3,
            total_pages: response.data.pagination.total_pages || 1
          });
        }
      } else {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(handleAPIError(err));
      toast.error(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, categoryFilter, searchTerm, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, categoryFilter]);

  // Fetch tasks when filters or page changes (with debounce for search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, searchTerm ? 500 : 0); // Only debounce search, not filters

    return () => clearTimeout(timer);
  }, [searchTerm, priorityFilter, categoryFilter, currentPage, fetchTasks]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // KPI Data - using real summary data
  const kpiData = [
    {
      title: 'Completed',
      value: summary.completed.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'In Progress',
      value: summary.in_progress.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3L20 12L6 21V3Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Pending',
      value: summary.pending.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 6V12L16 14" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: 'Overdue',
      value: summary.overdue.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8V12" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 16H12.01" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    // {
    //   title: 'Total Hours',
    //   value: summary.total_hours.toString(),
    //   icon: (
    //     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    //       <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    //       <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#3AD6F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    //     </svg>
    //   )
    // }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-[#EF4444] text-white';
      case 'Medium': return 'bg-[#FBBF24] text-white';
      case 'Low': return 'bg-[#10B981] text-white';
      default: return 'bg-[#6B7280] text-white';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress')) return 'bg-[#1E40AF] text-white';
    if (statusLower.includes('pending')) return 'bg-[#FBBF24] text-white';
    if (statusLower.includes('review')) return 'bg-[#854D0E] text-white';
    if (statusLower.includes('overdue')) return 'bg-[#EF4444] text-white';
    if (statusLower.includes('completed')) return 'bg-[#10B981] text-white';
    return 'bg-[#6B7280] text-white';
  };

  const handleActionClick = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  const handleActionSelect = (action, taskId) => {
    console.log(`${action} clicked for task ${taskId}`);
    setOpenDropdown(null);
    if (action === 'View Details') {
      navigate(`/firmadmin/tasks/${taskId}`);
    } else if (action === 'Delete Task') {
      const task = taskData.find(t => t.id === taskId);
      setTaskToDelete({ id: taskId, title: task?.task || 'Task' });
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setDeleting(true);
      const response = await firmAdminTasksAPI.deleteTask(taskToDelete.id);

      if (response.success) {
        toast.success(response.message || 'Task deleted successfully');
        setShowDeleteConfirm(false);
        setTaskToDelete(null);
        // Refresh task list
        fetchTasks();
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      const errorMsg = handleAPIError(err);
      toast.error(errorMsg || 'Failed to delete task. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Export Tasks List to PDF
  const exportTasksToPDF = async () => {
    try {
      if (taskData.length === 0) {
        toast.info("No tasks to export", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Fetch all tasks (not just current page)
      const params = {
        page: 1,
        page_size: 1000 // Get all tasks
      };

      if (priorityFilter !== 'All Priorities') {
        params.priority = priorityFilter.toLowerCase();
      }
      if (categoryFilter !== 'All Categories') {
        params.category = categoryFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await firmAdminTasksAPI.listTasks(params);

      let allTasks = taskData;
      if (response.success && response.data && response.data.tasks) {
        allTasks = (response.data.tasks || []).map(task => ({
          id: task.id,
          task: task.task_title,
          description: task.description || task.category || '',
          assignedTo: {
            name: task.assigned_to_name || 'Unassigned'
          },
          client: task.client_name || (task.clients_info && task.clients_info.length > 0 ? task.clients_info[0].name : 'No Client'),
          priority: task.priority_display || task.priority || 'Medium',
          status: task.status_display || task.status || 'Pending',
          progress: task.progress_percentage || 0,
          dueDate: task.due_date_formatted || task.due_date || '',
          hours: task.hours_display || `${task.hours_spent || 0}h / ${task.estimated_hours || 0}h`,
          category: task.category || task.task_type_display || '',
          is_overdue: task.is_overdue || false
        }));
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Task Management Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Report Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, yPosition);
      yPosition += 8;

      const completedCount = allTasks.filter(t => (t.status || '').toLowerCase().includes('completed')).length;
      const inProgressCount = allTasks.filter(t => (t.status || '').toLowerCase().includes('progress')).length;
      const pendingCount = allTasks.filter(t => (t.status || '').toLowerCase().includes('pending')).length;
      const overdueCount = allTasks.filter(t => t.is_overdue || (t.status || '').toLowerCase().includes('overdue')).length;

      const summaryData = [
        ["Total Tasks", allTasks.length.toString()],
        ["Completed", completedCount.toString()],
        ["In Progress", inProgressCount.toString()],
        ["Pending", pendingCount.toString()],
        ["Overdue", overdueCount.toString()],
      ];

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Tasks Table
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`All Tasks (${allTasks.length})`, 14, yPosition);
      yPosition += 8;

      // Prepare table data
      const tableData = allTasks.map((task) => {
        return [
          task.task || 'N/A',
          task.assignedTo?.name || 'Unassigned',
          task.client || 'No Client',
          task.priority || 'Medium',
          task.status || 'Pending',
          `${task.progress || 0}%`,
          task.dueDate || 'N/A',
          task.category || 'N/A',
        ];
      });

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [["Task", "Assigned To", "Client", "Priority", "Status", "Progress", "Due Date", "Category"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [59, 74, 102], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 18 },
          6: { cellWidth: 25 },
          7: { cellWidth: 25 }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        didDrawPage: (data) => {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        }
      });

      // Open PDF in new window for preview/download
      const fileName = `Task_Management_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.output('dataurlnewwindow', { filename: fileName });
      toast.success("PDF opened in new window. You can download it from there.", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Error generating PDF: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FF] p-6">
      <div className=" mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 space-y-4 lg:space-y-0">
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2 font-[BasisGrotesquePro]">Task Management</h4>
            <p className="text-gray-600 font-[BasisGrotesquePro]">Track and manage all firm tasks and workflows</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportTasksToPDF}
              className="px-4 py-2 bg-white text-gray-700 !border border-[#E8F0FF] !rounded-[7px] hover:bg-gray-50 transition-colors flex items-center gap-x-2 font-[BasisGrotesquePro]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.75 11.25V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V11.25M5.25 7.5L9 11.25M9 11.25L12.75 7.5M9 11.25V2.25"
                  stroke="#4B5563"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              Export Report
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCreateTaskModal(true);
              }}
              className="px-4 py-2 bg-[#F56D2D] text-white !rounded-lg hover:bg-[#E55A1D] transition-colors flex items-center font-[BasisGrotesquePro]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <div key={index} className="bg-white !rounded-lg !border border-[#E8F0FF] p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-600 font-[BasisGrotesquePro]">{kpi.title}</p>
                <div className="text-[#3AD6F2] flex-shrink-0">
                  {kpi.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-[BasisGrotesquePro]">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
            {/* Search Bar */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block bg-white w-full pl-10 pr-3 py-2 !border border-[#E8F0FF] !rounded-lg  focus:border-transparent font-[BasisGrotesquePro]"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex space-x-3">
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-4 py-2.5 pr-10 text-[#4B5563] focus:outline-none font-[BasisGrotesquePro] cursor-pointer min-w-[160px]"
                >
                  <option>All Priorities</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-white !border border-[#E8F0FF] !rounded-lg px-4 py-2.5 pr-10 text-[#4B5563] focus:outline-none font-[BasisGrotesquePro] cursor-pointer min-w-[160px]"
                >
                  <option>All Categories</option>
                  <option>Tax Preparation</option>
                  <option>Business Review</option>
                  <option>Amendment</option>
                  <option>Document Management</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table View Content */}
        {!loading && !error && (
          <>
            <TableView
              taskData={taskData}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              handleActionClick={handleActionClick}
              openDropdown={openDropdown}
              handleActionSelect={handleActionSelect}
            />
            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                <button
                  className="btn btn-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    backgroundColor: currentPage === 1 ? '#E5E7EB' : '#F56D2D',
                    color: currentPage === 1 ? '#9CA3AF' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.6 : 1,
                    fontFamily: 'BasisGrotesquePro'
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '14px', color: '#4B5563', minWidth: '100px', textAlign: 'center', fontFamily: 'BasisGrotesquePro' }}>
                  Page {currentPage} of {pagination.total_pages}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.total_pages}
                  style={{
                    backgroundColor: currentPage >= pagination.total_pages ? '#E5E7EB' : '#F56D2D',
                    color: currentPage >= pagination.total_pages ? '#9CA3AF' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    cursor: currentPage >= pagination.total_pages ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= pagination.total_pages ? 0.6 : 1,
                    fontFamily: 'BasisGrotesquePro'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-[BasisGrotesquePro]">{error}</p>
            <button
              onClick={fetchTasks}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-[BasisGrotesquePro]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={() => {
            setShowCreateTaskModal(false);
            fetchTasks(); // Refresh task list after creating
          }}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !deleting) {
                setShowDeleteConfirm(false);
                setTaskToDelete(null);
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4 font-[BasisGrotesquePro]" style={{ color: '#1F2937' }}>
                Delete Task
              </h3>
              <p className="text-sm mb-6 font-[BasisGrotesquePro]" style={{ color: '#6B7280' }}>
                Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setTaskToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 !rounded-lg hover:bg-gray-200 transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={deleting}
                  className="px-4 py-2 bg-[#EF4444] text-white !rounded-lg hover:bg-[#DC2626] transition-colors font-[BasisGrotesquePro] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagementMain;
