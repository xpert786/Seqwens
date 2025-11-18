const sampleOffices = {
    '1': {
        id: '1',
        name: 'Main Office - Manhattan',
        location: 'New York, NY',
        status: 'Active',
        staff: 12,
        clients: 245,
        monthlyRevenue: 125000,
        growthRate: 12.5,
        address: '123 Business Ave',
        city: 'New York, NY 10001',
        email: 'Manhattan@Taxpracticepro.Com',
        phone: '123-456-7890',
        hours: 'Mon-Fri 9:00 AM - 6:00 PM',
        established: '2018-01-15',
        description: 'Our Flagship Location In The Heart Of Manhattan, Serving Individual And Business Clients.',
        clientSatisfaction: 4.9,
        taskCompletionRate: 94,
        avgRevenuePerClient: 510,
        staffUtilization: 87,
        clientRetention: 96,
        monthlyPerformanceData: [
            { month: 'Jan', value: 2.5 },
            { month: 'Feb', value: 3.5 },
            { month: 'Mar', value: 4 },
            { month: 'Apr', value: 6 },
            { month: 'May', value: 8 },
            { month: 'Jun', value: 10.5 },
            { month: 'Jul', value: 11.5 },
            { month: 'Aug', value: 12.5 }
        ],
        resourceManagement: {
            monthlyPerformance: [
                { name: 'Category A', value: 4500, color: '#3B82F6' },
                { name: 'Category B', value: 2100, color: '#10B981' },
                { name: 'Category C', value: 1200, color: '#F59E0B' },
                { name: 'Category D', value: 800, color: '#F97316' }
            ],
            roiComparison: [
                { location: 'New York', revenue: 16000, cost: 8000 },
                { location: 'London', revenue: 12000, cost: 8000 },
                { location: 'Mumbai', revenue: 10000, cost: 6000 }
            ],
            inventory: [
                { id: 1, item: 'Laptops', stock: 25, reorderAlert: 10, status: 'Okay' },
                { id: 2, item: 'Printers', stock: 8, reorderAlert: 5, status: 'Low' },
                { id: 3, item: 'Paper Stock', stock: 200, reorderAlert: 50, status: 'Okay' },
                { id: 4, item: 'Software Licenses', stock: 45, reorderAlert: 15, status: 'Okay' }
            ]
        },
        efinStatus: {
            active: 8,
            pending: 2,
            revoked: 1
        },
        bankPartners: [
            { id: 'partner-1', name: 'Chase Bank', status: 'Active' },
            { id: 'partner-2', name: 'Wells Fargo', status: 'Pending' },
            { id: 'partner-3', name: 'Bank of America', status: 'Rejected' }
        ],
        auditTrail: [
            { id: 'log-1', user: 'John D.', office: 'NYC', action: 'Filed Return', ip: '192.168.1.12', timestamp: '2025-07-21 14:32' },
            { id: 'log-2', user: 'Maria P.', office: 'LA', action: 'Bank Enrollment', ip: '192.168.2.45', timestamp: '2025-07-21 13:10' },
            { id: 'log-3', user: 'Alex K.', office: 'Chicago', action: 'Filed Return', ip: '10.0.0.22', timestamp: '2025-07-20 18:55' }
        ],
        staffMembers: [
            {
                id: 1,
                name: 'Sarah Martinez',
                role: 'Office Manager',
                email: 'Sarah.Martinez@Firm.Com',
                phone: '(555) 111-1111',
                clients: 32,
                status: 'Active'
            },
            {
                id: 2,
                name: 'Michael Chen',
                role: 'Senior Tax Preparer',
                email: 'Michael.Chen@Firm.Com',
                phone: '(555) 222-2222',
                clients: 45,
                status: 'Active'
            },
            {
                id: 3,
                name: 'Jennifer Wilson',
                role: 'Tax Preparer',
                email: 'Jennifer.Wilson@Firm.Com',
                phone: '(555) 333-3333',
                clients: 38,
                status: 'Active'
            },
            {
                id: 4,
                name: 'Robert Johnson',
                role: 'Administrative Assistant',
                email: 'Robert.Johnson@Firm.Com',
                phone: '(555) 444-4444',
                clients: 0,
                status: 'Active'
            }
        ],
        officeClients: [
            {
                id: 1,
                name: 'ABC Corporation',
                type: 'Business',
                assignedTo: 'Michael Chen',
                lastService: 'Quarterly Filing',
                revenue: 15000,
                status: 'Active'
            },
            {
                id: 2,
                name: 'John Smith',
                type: 'Individual',
                assignedTo: 'Jennifer Wilson',
                lastService: 'Tax Return',
                revenue: 750,
                status: 'Active'
            },
            {
                id: 3,
                name: 'Tech Startup LLC',
                type: 'Business',
                assignedTo: 'Sarah Martinez',
                lastService: 'Business Setup',
                revenue: 8500,
                status: 'Active'
            }
        ],
        topPerformers: [
            { id: 'staff-1', name: 'Michael Chen', role: 'Senior Tax Preparer', clients: 45, revenue: 22500 },
            { id: 'staff-2', name: 'Jennifer Wilson', role: 'Tax Preparer', clients: 38, revenue: 19000 },
            { id: 'staff-3', name: 'Sarah Martinez', role: 'Office Manager', clients: 32, revenue: 16000 }
        ],
        metrics: {
            taskCompletionRate: 94,
            staffUtilization: 87,
            clientSatisfaction: 4.8
        },
        performanceDashboard: {
            revenueVsExpenses: [
                { month: 'Jan', revenue: 95000, expenses: 68000 },
                { month: 'Feb', revenue: 110000, expenses: 72000 },
                { month: 'Mar', revenue: 122000, expenses: 76000 },
                { month: 'Apr', revenue: 130000, expenses: 78000 }
            ],
            clientGrowth: [
                { month: 'Jan', newClients: 20, totalClients: 180 },
                { month: 'Feb', newClients: 25, totalClients: 195 },
                { month: 'Mar', newClients: 28, totalClients: 215 },
                { month: 'Apr', newClients: 32, totalClients: 245 }
            ],
            averageRevenueTarget: 1000,
            staffUtilization: [
                { name: 'Utilized', value: 87 },
                { name: 'Available', value: 13 }
            ],
            trends: [
                { month: 'Jan', revenue: 90000, clients: 175, tasks: 120 },
                { month: 'Feb', revenue: 105000, clients: 190, tasks: 130 },
                { month: 'Mar', revenue: 115000, clients: 205, tasks: 135 },
                { month: 'Apr', revenue: 123000, clients: 220, tasks: 140 },
                { month: 'May', revenue: 128000, clients: 230, tasks: 145 },
                { month: 'Jun', revenue: 132000, clients: 236, tasks: 150 },
                { month: 'Jul', revenue: 136000, clients: 242, tasks: 155 },
                { month: 'Aug', revenue: 140000, clients: 248, tasks: 160 },
                { month: 'Sep', revenue: 145000, clients: 255, tasks: 168 },
                { month: 'Oct', revenue: 150000, clients: 262, tasks: 172 },
                { month: 'Nov', revenue: 156000, clients: 270, tasks: 178 },
                { month: 'Dec', revenue: 162000, clients: 280, tasks: 185 }
            ]
        },
        teamAnalytics: {
            staffPerformance: [
                { name: 'Alice', tasksCompleted: 42, utilization: 88 },
                { name: 'Bob', tasksCompleted: 38, utilization: 92 },
                { name: 'Charlie', tasksCompleted: 28, utilization: 80 },
                { name: 'Diana', tasksCompleted: 50, utilization: 95 },
                { name: 'Ethan', tasksCompleted: 33, utilization: 85 }
            ]
        }
    }
};

export default sampleOffices;

