import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.join(__dirname, '../../../../..');

export const PATHS = {
  RUNTIME_DIR: process.env.RUNTIME_DIR || path.join(PROJECT_ROOT, '.runtime'),
  TEMP_UPLOADS: process.env.TEMP_UPLOADS || path.join(PROJECT_ROOT, '.runtime/temp-uploads'),
  STORAGE: process.env.STORAGE_DIR || path.join(PROJECT_ROOT, '.runtime/storage'),
  LOCAL: process.env.LOCAL_DIR || path.join(PROJECT_ROOT, '.runtime/local'),
  DIST: process.env.DIST_DIR || path.join(PROJECT_ROOT, 'dist'),
};

// Ensure directories exist on import
Object.values(PATHS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
