import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'gps-tracking',
  webDir: 'www',
  plugins: {
    BackgroundGeolocation: {
      locationProvider: "ACTIVITY_PROVIDER",
      interval: 1000, // Intervalo para atualizações (em ms)
      fastestInterval: 5000, // Atualização mais rápida
      activitiesInterval: 1000, // Intervalo para detecção de atividades
      stopOnTerminate: false, // Não pare ao fechar o app
      startOnBoot: true, // Inicie ao ligar o dispositivo
    },
  },
};

export default config;
