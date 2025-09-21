// src/lib/pdf.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Order } from './types';

export async function generateInvoicePdf(order: Order): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, x: number, y: number, options: { font?: any; size?: number; color?: any } = {}) => {
    page.drawText(text, {
      x,
      y,
      font: options.font || font,
      size: options.size || 12,
      color: options.color || rgb(0, 0, 0),
    });
  };
  
  const primaryColor = rgb(37/255, 99/255, 235/255); // #2563eb

  // Header
  drawText('Masterphoto Copy', 50, height - 50, { font: boldFont, size: 24, color: primaryColor });
  drawText('INVOICE', width - 150, height - 50, { font: boldFont, size: 24 });

  // Invoice Info
  let yPos = height - 100;
  drawText(`Invoice #: ${order.id}`, 50, yPos);
  drawText(`Date: ${new Date(order.date).toLocaleDateString()}`, 50, yPos - 15);
  
  // Customer Info
  drawText('Bill To:', 50, yPos - 45, { font: boldFont });
  const customerName = `${order.customer.first_name} ${order.customer.last_name}`;
  drawText(customerName, 50, yPos - 60);
  drawText(order.customer.email, 50, yPos - 75);
  if (order.customer.phone_number) drawText(order.customer.phone_number, 50, yPos - 90);
  if (order.customer.address) drawText(order.customer.address, 50, yPos - 105);

  // Table Header
  yPos = height - 250;
  page.drawRectangle({
      x: 50,
      y: yPos - 5,
      width: width - 100,
      height: 25,
      color: primaryColor,
  });
  drawText('Description', 60, yPos, { font: boldFont, color: rgb(1,1,1) });
  drawText('Qty', 350, yPos, { font: boldFont, color: rgb(1,1,1) });
  drawText('Unit Price', 420, yPos, { font: boldFont, color: rgb(1,1,1) });
  drawText('Total', width - 100, yPos, { font: boldFont, color: rgb(1,1,1) });
  
  // Table Rows
  yPos -= 30;
  order.items.forEach(item => {
    const settings = item.settings;
    const desc = `${item.name} (${settings.colorMode}, ${settings.sides}, ${settings.binding} bind)`;
    const itemSubtotal = item.price / item.settings.quantity;

    drawText(desc, 60, yPos, {size: 10});
    drawText(String(item.settings.quantity), 355, yPos, {size: 10});
    drawText(`Rs. ${itemSubtotal.toFixed(2)}`, 425, yPos, {size: 10});
    drawText(`Rs. ${item.price.toFixed(2)}`, width - 95, yPos, {size: 10});
    yPos -= 20;
  });

  // Totals Section
  yPos -= 20;
  page.drawLine({
      start: { x: width - 250, y: yPos},
      end: { x: width - 50, y: yPos},
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
  })
  yPos -= 20;

  const subtotal = order.items.reduce((acc, item) => acc + item.price, 0);

  drawText('Subtotal:', width - 240, yPos, { font: boldFont });
  drawText(`Rs. ${subtotal.toFixed(2)}`, width - 95, yPos, { font: boldFont });
  yPos -= 20;

  // You can add logic here for shipping, discounts etc.
  
  yPos -= 10;
   page.drawRectangle({
      x: width - 250,
      y: yPos - 5,
      width: 200,
      height: 25,
      color: primaryColor,
  });
  drawText('Total', width - 240, yPos, { font: boldFont, color: rgb(1,1,1) });
  drawText(`Rs. ${order.total.toFixed(2)}`, width - 95, yPos, { font: boldFont, color: rgb(1,1,1) });


  // Footer
  drawText('Thank you for your business!', 50, 50, {size: 10, color: rgb(0.5, 0.5, 0.5)});

  // Return the PDF bytes
  return await pdfDoc.save();
}
