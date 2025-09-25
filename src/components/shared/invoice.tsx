import React from 'react';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface InvoiceProps {
  order: Order;
  showPrintButton?: boolean;
}

export const Invoice: React.FC<InvoiceProps> = ({ order, showPrintButton = true }) => {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'online':
      case 'prepaid':
        return 'Pay Online';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return method;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      {/* Print Button */}
      {showPrintButton && (
        <div className="mb-4 no-print">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print Invoice
          </button>
        </div>
      )}

      {/* Invoice Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-blue-600 mb-2">
              Masterphoto Copy
            </h1>
            <p className="text-gray-600">Professional Printing & Copy Services</p>
            <p className="text-gray-600">📧 support@masterphotocopy.com</p>
            <p className="text-gray-600">📱 +91 XXXXXXXXXX</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <p className="text-lg"><strong>Order ID:</strong> {order.orderId}</p>
            <p className="text-gray-600">Date: {formatDate(order.date || order.createdAt)}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill To:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">
                {order.customer.first_name} {order.customer.last_name}
              </p>
              <p className="text-gray-600">{order.customer.email}</p>
              <p className="text-gray-600">{order.customer.phone_number}</p>
              {order.customer.address && (
                <p className="text-gray-600">{order.customer.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Information:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Payment Method:</span>
                <Badge variant={order.payment.method === 'COD' ? 'secondary' : 'default'}>
                  {getPaymentMethodText(order.payment.method)}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Payment Status:</span>
                <Badge variant={order.payment.status === 'Paid' ? 'default' : 'secondary'}>
                  {order.payment.status}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Urgent Delivery:</span>
                <Badge variant={order.urgent ? 'destructive' : 'outline'}>
                  {order.urgent ? 'Yes' : 'No'}
                </Badge>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Order Status:</span>
                <Badge variant="outline">
                  {order.status}
                </Badge>
              </div>

              {order.totals.discount && order.totals.discount > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium">Coupon Applied:</span>
                  <Badge variant="default">
                    Yes ({formatCurrency(order.totals.discount)} off)
                  </Badge>
                </div>
              )}

              {(!order.totals.discount || order.totals.discount === 0) && (
                <div className="flex justify-between">
                  <span className="font-medium">Coupon Applied:</span>
                  <Badge variant="outline">No</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-semibold">Item</th>
                  <th className="text-center py-3 font-semibold">Pages</th>
                  <th className="text-center py-3 font-semibold">Settings</th>
                  <th className="text-right py-3 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Document {index + 1}
                        </p>
                      </div>
                    </td>
                    <td className="text-center py-4">
                      {item.totalPages} pages
                    </td>
                    <td className="text-center py-4">
                      <div className="text-sm space-y-1">
                        <div>
                          <Badge variant="outline" className="mr-1">
                            {item.settings.colorMode === 'color' ? 'Color' : 'B&W'}
                          </Badge>
                        </div>
                        <div>
                          <Badge variant="outline" className="mr-1">
                            {item.settings.sides === 'double' ? 'Double-sided' : 'Single-sided'}
                          </Badge>
                        </div>
                        {item.settings.binding && item.settings.binding !== 'none' && (
                          <div>
                            <Badge variant="outline">
                              {item.settings.binding}
                            </Badge>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">
                            Qty: {item.settings.quantity || 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4 font-medium">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Price Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal ({order.items.length} item{order.items.length > 1 ? 's' : ''})</span>
              <span>{formatCurrency(order.totals.subtotal)}</span>
            </div>

            {order.totals.discount && order.totals.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount Applied</span>
                <span>-{formatCurrency(order.totals.discount)}</span>
              </div>
            )}

            {order.totals.shipping > 0 && (
              <div className="flex justify-between">
                <span>
                  Shipping Fee
                  {order.urgent && <Badge variant="destructive" className="ml-2">Urgent</Badge>}
                </span>
                <span>{formatCurrency(order.totals.shipping)}</span>
              </div>
            )}

            {order.totals.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(order.totals.tax)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-xl font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(order.totals.total)}</span>
            </div>

            {order.payment.method === 'COD' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Cash on Delivery:</strong> Please keep the exact amount ready. 
                  {formatCurrency(order.totals.total)} to be paid upon delivery.
                </p>
              </div>
            )}

            {order.payment.status === 'Paid' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  <strong>Payment Confirmed:</strong> Your payment of {formatCurrency(order.totals.total)} has been received.
                  {order.payment.razorpay_payment_id && (
                    <span className="block mt-1">
                      Transaction ID: {order.payment.razorpay_payment_id}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-gray-600 text-sm border-t pt-6">
        <p className="mb-2">Thank you for choosing Masterphoto Copy!</p>
        <p>For any queries, contact us at support@masterphotocopy.com</p>
        <p className="mt-4">This is a computer-generated invoice.</p>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;