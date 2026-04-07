// Copia este archivo como environment.ts y rellena los valores reales.
// NO subas environment.ts al repositorio.
export const environment = {
  production: false,
  apiUrl: `http://${window.location.hostname}:8081`,
  cloudinary: {
    cloudName: 'TU_CLOUD_NAME',
    uploadPreset: 'TU_UPLOAD_PRESET'
  }
};
