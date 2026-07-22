import multer from 'multer';

// Use memory storage (files stored in RAM buffer, no temporary disk I/O)
const storage = multer.memoryStorage();

export const uploadSingleFile = (fieldName = 'file') => {
  return (req, res, next) => {
    const upload = multer({
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // Upper bound hard limit (50 MB)
      },
    }).single(fieldName);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum allowed size limit.',
            errors: [{ field: fieldName, message: 'File is too large.' }],
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
          errors: [{ field: fieldName, message: err.message }],
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          message: 'An unexpected error occurred during file parsing.',
          errors: [],
        });
      }
      next();
    });
  };
};
