/**
 * Utilitaire de compression et d'optimisation d'images côté client avant envoi vers Supabase Storage.
 * Réduit la taille des photos (ex: de 5-10 Mo à 150-300 Ko) tout en préservant une netteté optimale pour l'expertise assurance.
 */
export async function optimizeImageFile(
  file: File,
  maxWidth: number = 1150,
  maxHeight: number = 1150,
  quality: number = 0.72
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    // Si ce n'est pas une image (ex: PDF), on retourne le fichier et son DataURL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve({ file, dataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcul des nouvelles dimensions avec ratio respecté
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, dataUrl: e.target?.result as string });
          return;
        }

        // Fond blanc pour les PNG transparents et netteté optimale
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Conversion en WebP si possible (plus léger) ou JPEG haute compatibilité
        const outputType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, dataUrl });
              return;
            }

            // Générer un nouveau fichier optimisé
            const safeName = file.name.replace(/\.[^/.]+$/, "") + '.jpg';
            const optimizedFile = new File([blob], safeName, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve({ file: optimizedFile, dataUrl });
          },
          outputType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
