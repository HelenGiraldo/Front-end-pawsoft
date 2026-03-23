export const environment = {
  production: false,
  apiUrl: `http://${window.location.hostname}:8080`,
  cloudinary: {
    cloudName: 'TU_CLOUD_NAME_AQUI',      // Reemplaza con tu cloudName de Cloudinary
    uploadPreset: 'TU_UPLOAD_PRESET_AQUI' // Reemplaza con tu uploadPreset de Cloudinary
  }
};
