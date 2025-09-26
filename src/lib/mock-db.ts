// In a real application, this would be a database.
// For this demo, we're using an in-memory object.

export type FeedbackStatus = 'New' | 'Archived';

export type FeedbackItem = {
    id: string;
    content: string;
    user: string;
    date: string;
    status: FeedbackStatus;
};

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export type SupportTicket = {
    id: string;
    subject: string;
    user: string;
    date: string;
    status: TicketStatus;
    priority: 'Low' | 'Medium' | 'High';
    details?: string;
};

export type StaffRole = 'Admin' | 'Manager' | 'Support';
export type StaffStatus = 'Active' | 'Inactive';

export type StaffMember = {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    status: StaffStatus;
};

let mockDb = {
    content: {
        terms: `## 1. Agreement to Terms
By using our services, you agree to be bound by these Terms. If you do not agree to be bound by these Terms, do not use the services.

## 2. Your Account
You are responsible for safeguarding your account, and you agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.`,
        privacy: `## Introduction
Welcome to Master PhotoCopy. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.

## Information We Collect
We collect personal information that you voluntarily provide to us when you register on the website.`,
        refund: `## General Policy
We want you to be satisfied with your purchase. We offer refunds and reprints on a case-by-case basis. If you are not satisfied with your order, please contact our support team within 7 days of receiving your order.

## Eligibility for a Refund
To be eligible for a refund or reprint, you must provide proof of the issue. This may include photographs of the product defects. We will not be liable for errors in user-submitted files.`,
    },
    feedback: [
        { id: 'f1', user: 'John Doe', date: '2024-05-22', content: 'The file upload process was seamless! Great job.', status: 'New' as FeedbackStatus },
        { id: 'f2', user: 'Alice', date: '2024-05-21', content: 'I wish there was an option for a hardcover binding. Otherwise, the service was excellent.', status: 'New' as FeedbackStatus },
        { id: 'f3', user: 'Bob', date: '2024-05-20', content: 'The AI suggestions for my resume were surprisingly helpful.', status: 'Archived' as FeedbackStatus },
    ],
    supportTickets: [
        { id: 'TKT-001', user: 'John Doe', subject: 'Refund request for ORD780', date: '2024-05-22', status: 'Open' as TicketStatus, priority: 'High' as const },
        { id: 'TKT-002', user: 'Alice', subject: 'Question about binding options', date: '2024-05-21', status: 'In Progress' as TicketStatus, priority: 'Medium' as const },
        { id: 'TKT-003', user: 'Bob', subject: 'Unable to login', date: '2024-05-20', status: 'Resolved' as TicketStatus, priority: 'Low' as const },
    ],
    staff: [
        { id: 'STAFF001', name: 'Admin User', email: 'admin@example.com', role: 'Admin', status: 'Active' },
        { id: 'STAFF002', name: 'Manager User', email: 'manager@example.com', role: 'Manager', status: 'Active' },
        { id: 'STAFF003', name: 'Support Rep', email: 'support@example.com', role: 'Support', status: 'Inactive' },
    ]
};

// --- Dashboard & Analytics Data ---

export const recentOrders = [
    { id: 'ORD789', user: 'John Doe', status: 'Processing', total: 450.00 },
    { id: 'ORD788', user: 'Alice', status: 'Shipped', total: 250.50 },
    { id: 'ORD787', user: 'Bob', status: 'Delivered', total: 1200.00 },
    { id: 'ORD786', user: 'Charlie', status: 'Delivered', total: 75.00 },
];

export const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4500 },
  { name: 'May', sales: 6000 },
  { name: 'Jun', sales: 5500 },
];

export const orderStatusData = [
  { name: 'Delivered', value: 400 },
  { name: 'Processing', value: 150 },
  { name: 'Shipped', value: 100 },
  { name: 'Cancelled', value: 50 },
];

export const topCustomers = [
    { id: 'CUST003', name: 'Bob', totalSpent: 1275.00, totalOrders: 8 },
    { id: 'CUST001', name: 'John Doe', totalSpent: 950.50, totalOrders: 5 },
    { id: 'CUST002', name: 'Alice', totalSpent: 300.00, totalOrders: 2 },
];


// --- Content Management ---
export const getContent = async () => {
    return Promise.resolve(mockDb.content);
}

export const updateContent = async (newContent: Partial<typeof mockDb.content>) => {
    mockDb.content = { ...mockDb.content, ...newContent };
    return Promise.resolve(mockDb.content);
}

// --- Feedback Management ---
export const getFeedback = async () => {
    return Promise.resolve(mockDb.feedback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export const addFeedback = async (item: FeedbackItem) => {
    mockDb.feedback.push(item);
    return Promise.resolve(item);
}

export const archiveFeedback = async (id: string) => {
    mockDb.feedback = mockDb.feedback.map(f => f.id === id ? { ...f, status: 'Archived' } : f);
    return Promise.resolve();
}

export const deleteFeedback = async (id: string) => {
    mockDb.feedback = mockDb.feedback.filter(f => f.id !== id);
    return Promise.resolve();
}


// --- Support Ticket Management ---
export const getSupportTickets = async () => {
    return Promise.resolve(mockDb.supportTickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export const addSupportTicket = async (ticket: Omit<SupportTicket, 'id' | 'date' | 'status'>) => {
    const newTicket: SupportTicket = {
        id: `TKT-${String(Date.now()).slice(-4)}`,
        date: new Date().toISOString(),
        status: 'Open',
        ...ticket
    }
    mockDb.supportTickets.push(newTicket);
    return Promise.resolve(newTicket);
}

export const updateTicketStatus = async (id: string, status: TicketStatus) => {
    mockDb.supportTickets = mockDb.supportTickets.map(t => t.id === id ? { ...t, status } : t);
    return Promise.resolve();
}

export const resolveSupportTicket = async (id: string) => {
    mockDb.supportTickets = mockDb.supportTickets.map(t => t.id === id ? { ...t, status: 'Resolved' } : t);
    return Promise.resolve();
}

// --- Staff Management ---
export const mockStaff = mockDb.staff;
