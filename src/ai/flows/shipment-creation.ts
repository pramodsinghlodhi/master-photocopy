'use server';
/**
 * @fileOverview A flow for creating shipments with Shiprocket.
 *
 * - createShipment - A function that creates a shipment and returns tracking info.
 * - CreateShipmentInput - The input type for the createShipment function.
 * - CreateShipmentOutput - The return type for the createShipment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';

const CreateShipmentInputSchema = z.object({
  orderId: z.string().describe("The unique ID of the order."),
  customerName: z.string().describe("The name of the customer."),
  customerAddress: z.string().describe("The customer's full shipping address."),
  customerPhone: z.string().describe("The customer's phone number."),
  orderTotal: z.number().describe("The total value of the order."),
  paymentMethod: z.string().describe("The payment method (e.g., 'Prepaid' or 'COD')."),
});
export type CreateShipmentInput = z.infer<typeof CreateShipmentInputSchema>;

const CreateShipmentOutputSchema = z.object({
  provider: z.string().describe("The shipping provider's name (e.g., Shiprocket)."),
  trackingId: z.string().describe("The tracking ID for the shipment."),
  status: z.string().describe("The initial status of the shipment."),
});
export type CreateShipmentOutput = z.infer<typeof CreateShipmentOutputSchema>;


export async function createShipment(input: CreateShipmentInput): Promise<CreateShipmentOutput> {
  return createShipmentFlow(input);
}


// This is a mock implementation. In a real application, you would make an API call to Shiprocket here.
// You would need to handle authentication, request body formatting, and error handling as per the Shiprocket API documentation.
const createShipmentFlow = ai.defineFlow(
  {
    name: 'createShipmentFlow',
    inputSchema: CreateShipmentInputSchema,
    outputSchema: CreateShipmentOutputSchema,
  },
  async (input: any) => {
    console.log("Attempting to create shipment for order:", input.orderId);

    // To connect to the real Shiprocket API, you would uncomment and configure the following:
    const useMock = !process.env.SHIPROCKET_API_TOKEN;

    if (useMock) {
        console.warn("SHIPROCKET_API_TOKEN not found in .env. Using mock response.");
        // Mock response for demonstration purposes
        const mockTrackingId = `SR-${Math.floor(100000000 + Math.random() * 900000000)}`;
        console.log("Generated mock tracking ID:", mockTrackingId);
        
        return {
          provider: 'Shiprocket (Mock)',
          trackingId: mockTrackingId,
          status: 'Booked',
        };
    }
    
    const shiprocketApiUrl = 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc';
    const shiprocketApiToken = process.env.SHIPROCKET_API_TOKEN;

    // A simple name parser, you might need a more robust one
    const nameParts = input.customerName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'N/A';
    
    // A simple address parser, real implementation would require a more robust solution
    // This is a placeholder and assumes a structured address.
    const addressParts = input.customerAddress.split(',');
    const city = addressParts.length > 1 ? addressParts[1].trim() : 'Gwalior';
    const pincode = addressParts.length > 2 ? addressParts[2].trim().split(' ')[0] : '474001'; 
    const state = 'Madhya Pradesh'; // Hardcoded for simplicity


    const requestBody = {
        order_id: input.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary', // Assuming a default pickup location
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: input.customerAddress,
        billing_city: city,
        billing_pincode: pincode,
        billing_state: state,
        billing_country: 'India',
        billing_email: 'customer@example.com', // Would need customer email from your data
        billing_phone: input.customerPhone,
        shipping_is_billing: true,
        order_items: [
            {
                name: `Order ${input.orderId}`,
                sku: `SKU-${input.orderId}`,
                units: 1,
                selling_price: input.orderTotal,
                hsn: ''
            }
        ],
        payment_method: input.paymentMethod,
        sub_total: input.orderTotal,
        length: 10, // These would need to be estimated or calculated based on products
        breadth: 10,
        height: 10,
        weight: 0.5,
    };
    
    try {
        const response = await axios.post(shiprocketApiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${shiprocketApiToken}`
            }
        });

        const { awb_code, shipment_id } = response.data.payload;
        
        return {
            provider: 'Shiprocket',
            trackingId: awb_code,
            status: 'Booked'
        };

    } catch (error: any) {
        console.error("Shiprocket API Error:", error.response?.data || error.message);
        throw new Error("Failed to create shipment with Shiprocket.");
    }
  }
);