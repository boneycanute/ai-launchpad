import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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
    const { userId, agentName, fileName, fileType } = await req.json();

    if (!userId || !agentName || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct the S3 key
    const baseFileName = fileType === "knowledge" ? fileName : "agent_avatar";
    const key = `${userId}/${agentName}/${baseFileName}`;

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
