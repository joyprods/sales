export const compressImage = (
  file: File,
  maxDimension = 1024,
  quality = 0.6
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return reject(new Error('Canvas not supported'));

      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDimension) {
        height *= maxDimension / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width *= maxDimension / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));

          resolve(
            new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified
            })
          );
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Image load failed'));
    reader.readAsDataURL(file);
  });
};
