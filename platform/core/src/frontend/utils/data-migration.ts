/**
 * Data Migration Utilities
 * Migrates data from localStorage to database
 */

export interface LocalStorageJob {
  _id?: string;
  title: string;
  company: string;
  location: string;
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  url?: string;
  notes?: string;
  description?: string;
  requirements?: string | string[];
  responsibilities?: string | string[];
  qualifications?: string | string[];
  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class DataMigrationService {

  /**
   * Export data from localStorage
   */
  static exportFromLocalStorage(): LocalStorageJob[] {
    try {
      const jobs = localStorage.getItem('jobs');
      const jobApplications = localStorage.getItem('jobApplications');

      let allJobs: LocalStorageJob[] = [];

      // Try to get data from different possible localStorage keys
      if (jobs) {
        const parsedJobs = JSON.parse(jobs);
        if (Array.isArray(parsedJobs)) {
          allJobs = [...allJobs, ...parsedJobs];
        }
      }

      if (jobApplications) {
        const parsedApplications = JSON.parse(jobApplications);
        if (Array.isArray(parsedApplications)) {
          allJobs = [...allJobs, ...parsedApplications];
        }
      }

      // Check for other common localStorage keys
      const possibleKeys = ['jobTracker', 'jobData', 'applications', 'jobsList'];
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              allJobs = [...allJobs, ...parsed];
            }
          } catch (e) {
            console.warn(`Failed to parse localStorage key: ${key}`);
          }
        }
      }

      // Remove duplicates based on title + company
      const unique = allJobs.filter((job, index, self) =>
        index === self.findIndex(j => j.title === job.title && j.company === job.company)
      );

      console.log(`Found ${unique.length} jobs in localStorage`);
      return unique;

    } catch (error) {
      console.error('Failed to export from localStorage:', error);
      return [];
    }
  }

  /**
   * Transform localStorage data to database format
   */
  static transformForDatabase(jobs: LocalStorageJob[]): any[] {
    return jobs.map(job => ({
      title: job.title || 'Untitled Position',
      company: job.company || 'Unknown Company',
      location: job.location || 'Unknown Location',
      status: job.status || 'interested',
      url: job.url || null,
      notes: job.notes || null,
      description: job.description || null,
      requirements: Array.isArray(job.requirements)
        ? job.requirements.join('\n')
        : job.requirements || null,
      responsibilities: Array.isArray(job.responsibilities)
        ? job.responsibilities.join('\n')
        : job.responsibilities || null,
      qualifications: Array.isArray(job.qualifications)
        ? job.qualifications.join('\n')
        : job.qualifications || null,
      appliedAt: job.appliedAt || null
    }));
  }

  /**
   * Send data to database
   */
  static async importToDatabase(jobs: any[]): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const response = await fetch('/api/data/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobs })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        imported: result.imported,
        errors: result.errors || []
      };

    } catch (error) {
      console.error('Failed to import to database:', error);
      return {
        success: false,
        imported: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Complete migration process
   */
  static async migrateAll(): Promise<{
    success: boolean;
    found: number;
    imported: number;
    errors: string[];
    summary: string;
  }> {
    try {
      // Step 1: Export from localStorage
      const localJobs = this.exportFromLocalStorage();

      if (localJobs.length === 0) {
        return {
          success: true,
          found: 0,
          imported: 0,
          errors: [],
          summary: 'No data found in localStorage to migrate'
        };
      }

      // Step 2: Transform data
      const transformedJobs = this.transformForDatabase(localJobs);

      // Step 3: Import to database
      const result = await this.importToDatabase(transformedJobs);

      const summary = result.success
        ? `Successfully migrated ${result.imported} of ${localJobs.length} jobs to database`
        : `Migration failed: ${result.errors.join('; ')}`;

      return {
        success: result.success,
        found: localJobs.length,
        imported: result.imported,
        errors: result.errors,
        summary
      };

    } catch (error) {
      return {
        success: false,
        found: 0,
        imported: 0,
        errors: [error.message],
        summary: `Migration failed: ${error.message}`
      };
    }
  }

  /**
   * Backup localStorage data before migration
   */
  static backupLocalStorage(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Backup all localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backup.data[key] = localStorage.getItem(key);
      }
    }

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Clear job-related localStorage after successful migration
   */
  static clearJobDataFromLocalStorage(): void {
    const jobKeys = ['jobs', 'jobApplications', 'jobTracker', 'jobData', 'applications', 'jobsList'];

    jobKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage key: ${key}`);
      }
    });
  }
}