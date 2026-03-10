import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'AtjaYaaLa',
  webDir: 'www',
  
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 2000, // 3 segundos
      showSpinner:true,
          // Se quita sola
      backgroundColor: "#f0f4f8", // Color de fondo que combine con tu app
      androidScaleType: "CENTER_CROP",
            // Muestra el circulito de carga
      spinnerColor: "#231b6b"   // Color de tu azul de marca
    },
  },
};

export default config;
