/*
  ARP Prevención — Web pública
  Lee del MISMO Firestore que arp-inspecciones (fuente única de verdad:
  un cambio en el panel admin de la app se refleja aquí sin tocar nada
  a mano en la web). Repos de código independientes, misma base de datos.

  Solo Firestore — sin Auth, esta web nunca inicia sesión, solo lee
  colecciones marcadas como públicas por regla (certificadosPublicos,
  config/empresa). Todo lo demás (inspecciones, formatos, checklist ENAC,
  usuarios...) sigue exactamente igual de protegido que hoy — esta web
  no toca ni puede tocar esas reglas.
*/
const firebaseConfig = {
  apiKey: "AIzaSyDncKj2_RBJWgzzjOn2079x47pf_ycGFlc",
  authDomain: "arp-inspecciones.firebaseapp.com",
  projectId: "arp-inspecciones",
  storageBucket: "arp-inspecciones.firebasestorage.app",
  messagingSenderId: "35880168451",
  appId: "1:35880168451:web:090e3c250b4416ed0b3236"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
