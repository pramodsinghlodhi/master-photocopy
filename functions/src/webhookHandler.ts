import * as admin from "firebase-admin";
import { Request, Response } from "express";

interface WebhookPayload {
  contact?: {
    status: 'existing' | 'updated' | 'new';
    phone_number: string;
    uid?: string;
    first_name: string;
    last_name: string;
    email: string;
    language_code: string;
    country: string;
  };
  message?: {
    whatsapp_business_phone_number_id?: string;
    whatsapp_message_id?: string;
    replied_to_whatsapp_message_id?: string;
    is_new_message: boolean;
    body?: string;
    status?: string;
    media?: {
      type: string;
      link: string;
      caption?: string;
      mime_type?: string;
      file_name?: string;
      original_filename?: string;
    };
  };
  whatsapp_webhook_payload?: any;
}

export const webhookHandler = async (req: Request, res: Response) => {
  const db = admin.firestore();
  
  try {
    const raw: WebhookPayload = req.body;
    
    // Save raw payload for audit
    const docRef = await db.collection("webhooks").add({
      rawPayload: raw,
      source: raw.contact?.status || "unknown",
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      processed: false
    });

    // Extract contact and message information
    const contact = raw.contact;
    const message = raw.message;

    // Process contact information - upsert user/customer
    if (contact?.phone_number) {
      await upsertContact(contact, db);
    }

    // Find and update related orders
    let mappedOrderId: string | null = null;
    if (contact?.phone_number) {
      mappedOrderId = await updateRelatedOrders(contact.phone_number, message, db);
    }

    // Mark webhook as processed
    await docRef.update({ 
      processed: true, 
      mappedToOrderId: mappedOrderId,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send({ ok: true, mapped: !!mappedOrderId });
  } catch (err) {
    console.error("webhook error", err);
    res.status(500).send({ ok: false, error: String(err) });
  }
};

async function upsertContact(contact: WebhookPayload['contact'], db: admin.firestore.Firestore) {
  if (!contact) return;

  const userRef = db.collection("users").doc(contact.uid || contact.phone_number);
  
  const userData = {
    phone: contact.phone_number,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    country: contact.country,
    language_code: contact.language_code,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    meta: {
      verifiedPhone: true
    }
  };

  // Check if user exists
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    // Update existing user
    await userRef.update(userData);
  } else {
    // Create new user
    await userRef.set({
      ...userData,
      uid: contact.uid || contact.phone_number,
      role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function updateRelatedOrders(phoneNumber: string, message?: WebhookPayload['message'], db?: admin.firestore.Firestore): Promise<string | null> {
  if (!db) return null;
  
  // Find orders by customer phone that are not in final states
  const ordersSnap = await db.collection("orders")
    .where("customer.phone_number", "==", phoneNumber)
    .where("status", "in", ["Pending", "Processing", "Shipped", "Out for Delivery"])
    .limit(5)
    .get();

  if (ordersSnap.empty) {
    return null;
  }

  // Update timeline for all matching orders
  const batch = db.batch();
  let firstOrderId: string | null = null;

  ordersSnap.docs.forEach((doc: any, index: number) => {
    if (index === 0) firstOrderId = doc.id;
    
    const timelineEntry = {
      ts: admin.firestore.FieldValue.serverTimestamp(),
      actor: "webhook",
      action: message?.media ? "media_received" : "message_received",
      note: JSON.stringify({
        messageId: message?.whatsapp_message_id || null,
        mediaType: message?.media?.type || null,
        mediaLink: message?.media?.link || null,
        body: message?.body || null
      })
    };

    batch.update(doc.ref, {
      timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If media is received, add to attachments
    if (message?.media) {
      batch.update(doc.ref, {
        attachments: admin.firestore.FieldValue.arrayUnion({
          type: message.media.type,
          url: message.media.link,
          filename: message.media.original_filename || message.media.file_name,
          mimeType: message.media.mime_type,
          caption: message.media.caption,
          addedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      });
    }
  });

  await batch.commit();
  return firstOrderId;
}
