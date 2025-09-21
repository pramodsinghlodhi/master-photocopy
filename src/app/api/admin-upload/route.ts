import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB, getFirebaseAdminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export async function POST(req: NextRequest) {
  // 1. Auth check (admin only)
  const session = await getServerSession();
  // Type guard for admin role
  const user = session?.user as (Session['user'] & { role?: string; email?: string }) | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse form data
  const form = await req.formData();
  const file = form.get('file');
  const groupNameRaw = form.get('groupName');
  const folderNameRaw = form.get('folderName');
  const orderIdRaw = form.get('orderId');
  const groupName = typeof groupNameRaw === 'string' && groupNameRaw ? groupNameRaw : 'default-group';
  const folderName = typeof folderNameRaw === 'string' && folderNameRaw ? folderNameRaw : 'default-folder';
  const orderId = typeof orderIdRaw === 'string' && orderIdRaw ? orderIdRaw : uuidv4();

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // 3. Upload to Firebase Storage
  const storage = getFirebaseAdminStorage();
  const filePath = `orders/${orderId}/${groupName}/${folderName}/${file.name}`;
  const bucket = storage.bucket();
  const blob = bucket.file(filePath);
  const buffer = Buffer.from(await file.arrayBuffer());
  await blob.save(buffer, {
    contentType: file.type,
    public: false,
    metadata: {
      firebaseStorageDownloadTokens: uuidv4(),
    },
  });

  // 4. Store metadata in Firestore
  const db = getFirebaseAdminDB();
  const fileMeta = {
    name: file.name,
    size: file.size,
    type: file.type,
    path: filePath,
    url: `gs://${bucket.name}/${filePath}`,
    uploadedAt: new Date().toISOString(),
    groupName,
    folderName,
    orderId,
  uploadedBy: user.email || 'unknown',
  };
  await db.collection('orders').doc(orderId).collection('files').add(fileMeta);

  return NextResponse.json({ success: true, file: fileMeta });
}
