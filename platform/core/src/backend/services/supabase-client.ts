import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase configuration missing - storage operations will be disabled')
  console.warn('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file')
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export class SupabaseStorageService {
  private bucketName = 'job-files'

  async initializeBucket(): Promise<void> {
    if (!supabase) {
      console.warn('⚠️  Supabase not configured - skipping bucket initialization')
      return
    }

    try {
      // Create bucket if it doesn't exist
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.warn('Warning: Could not list Supabase buckets:', listError.message)
        console.warn('Assuming bucket exists and continuing...')
        return
      }

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName)

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp',
            'text/plain',
            'text/markdown'
          ],
          fileSizeLimit: 25 * 1024 * 1024 // 25MB
        })

        if (error) {
          console.warn('Warning: Could not create Supabase bucket:', error.message)
          console.warn('Assuming bucket exists and continuing...')
        } else {
          console.log('✅ Supabase storage bucket created successfully')
        }
      } else {
        console.log('✅ Supabase storage bucket already exists')
      }
    } catch (error) {
      console.warn('Warning: Supabase bucket initialization failed:', error)
      console.warn('Continuing without bucket verification...')
    }
  }

  async uploadFile(file: Buffer, fileName: string, jobId: string, mimeType: string): Promise<{
    url: string;
    path: string;
    size: number;
  }> {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
    }

    const filePath = `jobs/${jobId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath,
      size: file.length
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    if (!supabase) {
      console.warn('⚠️  Supabase not configured - cannot delete file')
      return false
    }

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return true
  }

  getPublicUrl(filePath: string): string {
    if (!supabase) {
      console.warn('⚠️  Supabase not configured - cannot get public URL')
      return ''
    }

    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath)

    return data.publicUrl
  }
}

export const supabaseStorage = new SupabaseStorageService()