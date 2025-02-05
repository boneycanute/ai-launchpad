import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = "metaschool-launchpad";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Log what we received
    console.log('Received form data:', {
      file: formData.get('file') ? 'present' : 'missing',
      userId: formData.get('userId'),
      agentName: formData.get('agentName'),
      fileType: formData.get('fileType'),
    });
    
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const agentName = formData.get('agentName') as string;
    const fileType = formData.get('fileType') as 'knowledge' | 'avatar';

    if (!file) {
      console.error('Missing file');
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    if (!userId) {
      console.error('Missing userId');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    if (!agentName) {
      console.error('Missing agentName');
      return NextResponse.json({ error: 'Missing agentName' }, { status: 400 });
    }
    if (!fileType) {
      console.error('Missing fileType');
      return NextResponse.json({ error: 'Missing fileType' }, { status: 400 });
    }

    // Generate filename
    const extension = file.name.split(".").pop();
    const baseFileName = fileType === "knowledge" ? "knowledge_doc" : "agent_avatar";
    const fileName = fileType === "knowledge" 
      ? `${baseFileName}_${Date.now()}.${extension}`
      : `${baseFileName}.${extension}`;

    // Construct the S3 key
    const key = `${userId}/${agentName}/${fileName}`;
    
    console.log('Uploading to S3:', {
      bucket: BUCKET_NAME,
      key,
      contentType: file.type,
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);
    
    // Return the S3 URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('Upload successful, returning URL:', url);
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
