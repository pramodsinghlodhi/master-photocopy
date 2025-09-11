'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL, listAll, getMetadata, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod, DeliveryType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  FileText,
  Image,
  FolderOpen,
  Folder,
  UserPlus, 
  Truck, 
  AlertTriangle, 
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  MoreHorizontal,
  Maximize2,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types
interface OrderFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  deliveryType?: DeliveryType;
  urgent?: boolean;
  assignedAgent?: string;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  urgent: number;
}

interface OrderFile {
  name: string;
  path: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  groupName?: string;
  order: number;
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFiles, setOrderFiles] = useState<OrderFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [seeding, setSeeding] = useState(false);
  const [previewFile, setPreviewFile] = useState<OrderFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch orders
  useEffect(() => {
    if (!db) return;
    
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch agents
  useEffect(() => {
    if (!db) return;
    
    const agentsQuery = query(collection(db, 'agents'));
    const unsubscribe = onSnapshot(agentsQuery, (snapshot) => {
      const agentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgents(agentsData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(search) ||
        order.orderId?.toLowerCase().includes(search) ||
        order.customer.first_name?.toLowerCase().includes(search) ||
        order.customer.last_name?.toLowerCase().includes(search) ||
        order.customer.phone_number?.includes(search) ||
        order.customer.phone?.includes(search)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(order => order.payment.method === filters.paymentMethod);
    }

    // Delivery type filter
    if (filters.deliveryType) {
      filtered = filtered.filter(order => order.delivery.type === filters.deliveryType);
    }

    // Urgent filter
    if (filters.urgent) {
      filtered = filtered.filter(order => order.urgent);
    }

    // Assigned agent filter
    if (filters.assignedAgent === 'unassigned') {
      filtered = filtered.filter(order => !order.assignedAgentId);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filters]);

  // Calculate stats
  const stats: OrderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    urgent: orders.filter(o => o.urgent).length,
  };

  // Fetch files for an order
  const fetchOrderFiles = async (orderId: string) => {
    setFilesLoading(true);
    try {
      const orderRef = ref(storage, `orders/${orderId}`);
      const filesList = await listAll(orderRef);
      
      const files: OrderFile[] = [];
      
      for (const fileRef of filesList.items) {
        try {
          const metadata = await getMetadata(fileRef);
          const downloadURL = await getDownloadURL(fileRef);
          
          // Extract group name and order from metadata or file path
          const pathParts = fileRef.fullPath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          
          files.push({
            name: fileName,
            path: fileRef.fullPath,
            url: downloadURL,
            type: metadata.contentType || 'application/octet-stream',
            size: metadata.size,
            uploadedAt: new Date(metadata.timeCreated),
            groupName: metadata.customMetadata?.groupName || 'Default Group',
            order: parseInt(metadata.customMetadata?.order || '0')
          });
        } catch (error) {
          console.error('Error fetching file metadata:', error);
        }
      }
      
      // Sort files by upload order
      files.sort((a, b) => a.order - b.order);
      setOrderFiles(files);
    } catch (error) {
      console.error('Error fetching order files:', error);
      setOrderFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  // Download file
  const downloadFile = async (file: OrderFile) => {
    try {
      const fileRef = ref(storage, file.path);
      const url = await getDownloadURL(fileRef);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Preview file
  const previewFileFunc = async (file: OrderFile) => {
    if (!storage) return;
    
    setPreviewLoading(true);
    try {
      const fileRef = ref(storage, file.path);
      const url = await getDownloadURL(fileRef);
      setPreviewFile(file);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error loading file preview:', error);
      alert('Error loading file preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close preview
  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl('');
  };  // Download all files
  const downloadAllFiles = async (orderId: string) => {
    if (orderFiles.length === 0) return;
    
    try {
      // Create a zip-like download by downloading each file individually
      for (const file of orderFiles) {
        await downloadFile(file);
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error downloading all files:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Group files by group name
  const groupedFiles = orderFiles.reduce((groups, file) => {
    const groupName = file.groupName || 'Default Group';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(file);
    return groups;
  }, {} as Record<string, OrderFile[]>);

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Update delivery type
  const updateDeliveryType = async (orderId: string, deliveryType: 'own' | 'shiprocket') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        'delivery.type': deliveryType 
      });
    } catch (error) {
      console.error('Error updating delivery type:', error);
    }
  };

  // Handle order selection
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableOrders = filteredOrders.filter(order => 
        !order.assignedAgentId && order.delivery.type === 'own'
      );
      setSelectedOrders(new Set(selectableOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Bulk assign agent
  const handleBulkAssignAgent = async (agentId: string) => {
    if (!db) return;
    try {
      const promises = Array.from(selectedOrders).map(orderId =>
        updateDoc(doc(db!, 'orders', orderId), { assignedAgentId: agentId })
      );
      await Promise.all(promises);
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Error bulk assigning agent:', error);
    }
  };

  // Assign agent to order
  const handleAssignAgent = async (orderId: string, agentId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { assignedAgentId: agentId });
    } catch (error) {
      console.error('Error assigning agent:', error);
    }
  };

  // Mark order as urgent
  const handleMarkUrgent = async (orderId: string, urgent: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { urgent });
    } catch (error) {
      console.error('Error updating urgent status:', error);
    }
  };

  // Create shiprocket shipment
  const handleCreateShipment = async (orderId: string) => {
    // Implementation for Shiprocket API integration
    console.log('Creating shipment for order:', orderId);
  };

  // Get payment badge variant
  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  // Seed sample data
  const handleSeedData = async () => {
    if (!db || !storage) {
      console.error('Database or storage not available');
      alert('Database or storage not available');
      return;
    }

    setSeeding(true);
    try {
      console.log('Adding sample orders with dummy files...');
      
      // Sample customers
      const sampleCustomers = [
        {
          first_name: 'Rahul',
          last_name: 'Sharma',
          email: 'rahul.sharma@email.com',
          phone_number: '+91 9876543210',
          address: {
            street: '123 Main Street',
            city: 'Gwalior',
            state: 'MP',
            pincode: '474001'
          }
        },
        {
          first_name: 'Priya',
          last_name: 'Patel',
          email: 'priya.patel@email.com',
          phone_number: '+91 9876543211',
          address: {
            street: '456 Park Road',
            city: 'Gwalior',
            state: 'MP',
            pincode: '474002'
          }
        },
        {
          first_name: 'Amit',
          last_name: 'Kumar',
          email: 'amit.kumar@email.com',
          phone_number: '+91 9876543212',
          address: {
            street: '789 College Street',
            city: 'Gwalior',
            state: 'MP',
            pincode: '474003'
          }
        }
      ];

      // Sample file groups and names
      const sampleFileGroups = [
        {
          groupName: 'Resume Documents',
          files: ['Resume_RahulSharma.pdf', 'CoverLetter.pdf', 'Certificates.pdf']
        },
        {
          groupName: 'Project Report',
          files: ['ProjectReport_Chapter1.pdf', 'ProjectReport_Chapter2.pdf', 'ProjectReport_References.pdf', 'ProjectReport_Appendix.pdf']
        },
        {
          groupName: 'Assignment Submission',
          files: ['Assignment1_DataStructures.pdf', 'Assignment2_Algorithms.pdf', 'Assignment3_DatabaseDesign.pdf']
        },
        {
          groupName: 'Legal Documents',
          files: ['Contract_Agreement.pdf', 'Terms_and_Conditions.pdf', 'Privacy_Policy.pdf']
        },
        {
          groupName: 'Academic Transcripts',
          files: ['Semester1_Transcript.pdf', 'Semester2_Transcript.pdf', 'Final_GradeSheet.pdf', 'Degree_Certificate.pdf']
        }
      ];

      // Sample order statuses
      const statuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Not Delivered'];
      const paymentMethods: PaymentMethod[] = ['COD', 'Prepaid'];
      const deliveryTypes: DeliveryType[] = ['own', 'shiprocket'];

      // Create sample orders
      for (let i = 0; i < 8; i++) {
        const customer = sampleCustomers[i % sampleCustomers.length];
        const fileGroup = sampleFileGroups[i % sampleFileGroups.length];
        const isUrgent = Math.random() > 0.7;
        
        // Generate order data
        const orderData = {
          orderId: `ORD${Date.now()}${i}`,
          customer: customer,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          payment: {
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            status: Math.random() > 0.3 ? 'paid' : 'pending'
          },
          delivery: {
            type: deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)]
          },
          items: [
            {
              name: `${fileGroup.groupName} - Printing`,
              quantity: Math.floor(Math.random() * 5) + 1,
              price: Math.floor(Math.random() * 200) + 50
            }
          ],
          total: Math.floor(Math.random() * 500) + 100,
          totals: {
            subtotal: Math.floor(Math.random() * 450) + 80,
            total: Math.floor(Math.random() * 500) + 100,
            tax: Math.floor(Math.random() * 50) + 10
          },
          urgent: isUrgent,
          createdAt: serverTimestamp(),
          date: new Date().toISOString(),
          timeline: [
            {
              action: 'order_created',
              ts: serverTimestamp(),
              actor: 'System',
              note: 'Order created successfully'
            }
          ]
        };

        // Add order to Firestore
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        console.log(`Created order: ${orderRef.id}`);

        // Create dummy files for this order
        await createDummyFiles(orderRef.id, fileGroup);
      }

      console.log('Sample data added successfully!');
      alert('8 sample orders with dummy files have been added successfully! Each order contains realistic PDF files that you can preview and download.');
      
    } catch (error) {
      console.error('Error adding sample data:', error);
      alert('Error adding sample data. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  // Create dummy files for an order
  const createDummyFiles = async (orderId: string, fileGroup: { groupName: string; files: string[] }) => {
    if (!storage) return;

    try {
      for (let i = 0; i < fileGroup.files.length; i++) {
        const fileName = fileGroup.files[i];
        
        // Create a dummy PDF content (simple text-based PDF)
        const dummyContent = createDummyPDFContent(fileName, fileGroup.groupName);
        const blob = new Blob([dummyContent], { type: 'application/pdf' });
        
        // Create storage reference
        const fileRef = ref(storage, `orders/${orderId}/${fileName}`);
        
        // Upload file with metadata
        const metadata = {
          customMetadata: {
            groupName: fileGroup.groupName,
            order: (i + 1).toString(),
            uploadedBy: 'admin-demo'
          }
        };
        
        await uploadBytes(fileRef, blob, metadata);
        console.log(`Uploaded dummy file: ${fileName}`);
      }
    } catch (error) {
      console.error('Error creating dummy files:', error);
    }
  };

  // Create dummy PDF content (simplified PDF structure)
  const createDummyPDFContent = (fileName: string, groupName: string): string => {
    const pageCount = Math.floor(Math.random() * 10) + 1; // 1-10 pages
    const currentDate = new Date().toLocaleDateString();
    
    let content = `Dummy Document: ${fileName}
    
Group: ${groupName}
Created: ${currentDate}
Pages: ${pageCount}

This is a sample document created for demonstration purposes.

Document Content:
================

`;

    // Add different content based on file name
    if (fileName.toLowerCase().includes('resume')) {
      content += `RESUME

Personal Information:
- Name: John Doe
- Email: john.doe@email.com
- Phone: +91 98765 43210
- Address: 123 Main St, Gwalior, MP

Experience:
- Software Developer at Tech Corp (2020-2023)
- Junior Developer at StartUp Inc (2018-2020)

Education:
- B.Tech Computer Science (2014-2018)

Skills:
- React, Node.js, Python, Java
- Database: MySQL, MongoDB
- Tools: Git, Docker, AWS`;
    } else if (fileName.toLowerCase().includes('project')) {
      content += `PROJECT REPORT

Title: ${fileName.replace('.pdf', '').replace(/_/g, ' ')}

Abstract:
This project demonstrates the implementation of modern software development practices
and methodologies in building scalable web applications.

1. Introduction
2. Literature Review
3. Methodology
4. Implementation
5. Results and Analysis
6. Conclusion
7. References

Technology Stack:
- Frontend: React.js, TypeScript
- Backend: Node.js, Express
- Database: MongoDB
- Deployment: Docker, AWS`;
    } else if (fileName.toLowerCase().includes('assignment')) {
      content += `ASSIGNMENT

Subject: ${fileName.replace('.pdf', '').replace(/_/g, ' ')}

Question 1: Explain the concept and implementation details.
Answer: The implementation involves multiple steps and considerations...

Question 2: Analyze the given problem statement.
Answer: Based on the analysis, the following approach is recommended...

Question 3: Design and implement the solution.
Answer: The solution architecture includes the following components...

Total Marks: 100
Expected Score: 85+`;
    } else if (fileName.toLowerCase().includes('certificate')) {
      content += `CERTIFICATE

This is to certify that the bearer has successfully completed the course/program
mentioned herein and has demonstrated proficiency in the subject matter.

Certificate Details:
- Course Name: Advanced Software Development
- Institution: Tech Institute
- Duration: 6 months
- Grade: A+
- Issue Date: ${currentDate}

Authorized Signature: [Digital Signature]`;
    } else {
      content += `DOCUMENT

This is a general document containing important information and data.
The content is structured and formatted for professional presentation.

Key Points:
- Point 1: Important information
- Point 2: Relevant data
- Point 3: Supporting evidence
- Point 4: Conclusion

For more information, please contact the document issuer.`;
    }

    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Arial
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length + 200}
>>
stream
BT
/F1 10 Tf
50 750 Td
${content.split('\n').map(line => `(${line.trim()}) Tj 0 -15 Td`).join('\n')}
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000356 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${content.length + 500}
%%EOF`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders, view uploaded files, and track deliveries
          </p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedOrders.size} selected
              </span>
              <Select onValueChange={handleBulkAssignAgent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign to agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(agent => agent.status === 'active').map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedOrders(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
          <Button 
            onClick={handleSeedData} 
            variant="outline"
            disabled={seeding}
          >
            {seeding ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Seeding Data...
              </>
            ) : (
              "Add Sample Data"
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as OrderStatus }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Not Delivered">Not Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, paymentMethod: value === 'all' ? undefined : value as PaymentMethod }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payments</SelectItem>
                  <SelectItem value="COD">COD</SelectItem>
                  <SelectItem value="Prepaid">Prepaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Type</label>
              <Select value={filters.deliveryType || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, deliveryType: value === 'all' ? undefined : value as DeliveryType }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All delivery types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All delivery types</SelectItem>
                  <SelectItem value="own">Own Delivery</SelectItem>
                  <SelectItem value="shiprocket">Shiprocket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filters.urgent ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, urgent: !prev.urgent || undefined }))}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Urgent Only
            </Button>
            
            <Button
              variant={filters.assignedAgent === 'unassigned' ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                assignedAgent: prev.assignedAgent === 'unassigned' ? undefined : 'unassigned' 
              }))}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Unassigned
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredOrders.filter(order => 
                          !order.assignedAgentId && order.delivery.type === 'own'
                        ).length > 0 &&
                        filteredOrders.filter(order => 
                          !order.assignedAgentId && order.delivery.type === 'own'
                        ).every(order => selectedOrders.has(order.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Type</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const canBeSelected = !order.assignedAgentId && order.delivery.type === 'own';
                  return (
                    <TableRow 
                      key={order.id} 
                      className={order.urgent ? "bg-red-50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          disabled={!canBeSelected}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {order.urgent && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {order.orderId || order.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customer.first_name} {order.customer.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer.phone_number || order.customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Not Delivered">Not Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            <SelectItem value="Returned">Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={order.delivery.type} 
                          onValueChange={(value) => updateDeliveryType(order.id, value as 'own' | 'shiprocket')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="own">Own Delivery</SelectItem>
                            <SelectItem value="shiprocket">Shiprocket</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant={getPaymentBadgeVariant(order.payment.status)}>
                            {order.payment.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {order.payment.method}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.totals?.total || order.total)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.createdAt?.toDate() || order.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  fetchOrderFiles(order.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - {order.orderId || order.id}</DialogTitle>
                              </DialogHeader>
                              <OrderDetailsDialog 
                                order={order} 
                                agents={agents}
                                orderFiles={orderFiles}
                                filesLoading={filesLoading}
                                groupedFiles={groupedFiles}
                                downloadFile={downloadFile}
                                downloadAllFiles={downloadAllFiles}
                                previewFile={previewFileFunc}
                                formatFileSize={formatFileSize}
                                getFileIcon={getFileIcon}
                                formatCurrency={formatCurrency}
                              />
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {!order.assignedAgentId && order.delivery.type === 'own' && (
                                <>
                                  {agents.map(agent => (
                                    <DropdownMenuItem
                                      key={agent.id}
                                      onClick={() => handleAssignAgent(order.id, agent.id)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Assign to {agent.first_name}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                              
                              {order.delivery.type === 'shiprocket' && !order.delivery.shiprocket_shipment_id && (
                                <DropdownMenuItem onClick={() => handleCreateShipment(order.id)}>
                                  <Truck className="h-4 w-4 mr-2" />
                                  Create Shipment
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem onClick={() => handleMarkUrgent(order.id, !order.urgent)}>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {order.urgent ? 'Remove Urgent' : 'Mark Urgent'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-muted-foreground">
                {Object.keys(filters).length > 0 || searchTerm 
                  ? "Try adjusting your filters or search term"
                  : "Orders will appear here once customers place them"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={closePreview}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {getFileIcon(previewFile.type)}
                  {previewFile.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(previewFile)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closePreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading preview...</span>
                </div>
              ) : (
                <div className="h-full max-h-[70vh] overflow-auto border rounded-lg">
                  {previewFile.type.startsWith('image/') ? (
                    <img 
                      src={previewUrl} 
                      alt={previewFile.name}
                      className="w-full h-auto"
                    />
                  ) : previewFile.type === 'application/pdf' ? (
                    <iframe
                      src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full h-full min-h-[500px]"
                      title={previewFile.name}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <FileText className="h-16 w-16 mb-4" />
                      <p>Preview not available for this file type</p>
                      <p className="text-sm">{previewFile.type}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => downloadFile(previewFile)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download to view
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Order Details Dialog Component with File Viewing
interface OrderDetailsDialogProps {
  order: Order;
  agents: any[];
  orderFiles: OrderFile[];
  filesLoading: boolean;
  groupedFiles: Record<string, OrderFile[]>;
  downloadFile: (file: OrderFile) => Promise<void>;
  downloadAllFiles: (orderId: string) => Promise<void>;
  previewFile: (file: OrderFile) => Promise<void>;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (type: string) => any;
  formatCurrency: (amount: number) => string;
}

function OrderDetailsDialog({ 
  order, 
  agents, 
  orderFiles, 
  filesLoading, 
  groupedFiles, 
  downloadFile, 
  downloadAllFiles,
  previewFile,
  formatFileSize, 
  getFileIcon, 
  formatCurrency 
}: OrderDetailsDialogProps) {
  const getAssignedAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned';
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent';
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="files">Files ({orderFiles.length})</TabsTrigger>
        <TabsTrigger value="customer">Customer</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Order ID</label>
                <p>{order.orderId || order.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge className="ml-2">{order.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Urgent</label>
                <Badge variant={order.urgent ? "destructive" : "secondary"} className="ml-2">
                  {order.urgent ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Created At</label>
                <p>{new Date(order.createdAt?.toDate() || order.date).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium">Delivery Type</label>
                <Badge className="ml-2">
                  {order.delivery.type === 'own' ? 'Own Delivery' : 'Shiprocket'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Agent</label>
                <p>{getAssignedAgentName(order.assignedAgentId)}</p>
              </div>
              {order.delivery.tracking_url && (
                <div>
                  <label className="text-sm font-medium">Tracking</label>
                  <p>
                    <a 
                      href={order.delivery.tracking_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Track Package
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <p>{order.payment.method}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <Badge className="ml-2">{order.payment.status}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Total Amount</label>
                <p className="font-bold text-lg">{formatCurrency(order.totals?.total || order.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="files" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Uploaded Files ({orderFiles.length})</CardTitle>
            {orderFiles.length > 0 && (
              <Button 
                onClick={() => downloadAllFiles(order.id)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2">Loading files...</span>
              </div>
            ) : orderFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No files uploaded for this order
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedFiles).map(([groupName, files]) => (
                  <div key={groupName} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {groupName} ({files.length} files)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {files.map((file, index) => (
                        <div 
                          key={`${file.name}-${index}`}
                          className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Upload #{file.order}
                              </p>
                              {file.uploadedAt && (
                                <p className="text-xs text-muted-foreground">
                                  {new Date(file.uploadedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => previewFile(file)}
                                className="px-2"
                                title="Preview File"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file)}
                                className="px-2"
                                title="Download File"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customer" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p>{order.customer.first_name} {order.customer.last_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <p>{order.customer.phone_number || order.customer.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p>{order.customer.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <p>{order.customer.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="items" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity || 1}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{formatCurrency(item.price * (item.quantity || 1))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.timeline?.map((event, index) => (
                <div key={index} className="flex items-start gap-3 border-l-2 border-muted pl-4 pb-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 -ml-5 border-2 border-background"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.action.replace('_', ' ').toUpperCase()}</p>
                      <span className="text-sm text-muted-foreground">
                        {event.ts?.toDate ? event.ts.toDate().toLocaleString() : 'Unknown time'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">By: {event.actor}</p>
                    {event.note && <p className="text-sm mt-1">{event.note}</p>}
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground">No timeline events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default OrderManagement;
