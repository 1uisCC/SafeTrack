const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.enviarNotificacionEvidencia = functions.firestore
    .document('evidencias/{evidenciaId}')
    .onCreate(async (snap, context) => {
        const message = {
            notification: {
                title: '🚨 ¡Nueva evidencia registrada!',
                body: 'Un usuario ha reportado un incidente cerca de ti.',
            },
            topic: 'alertas_seguridad'
        };
        return admin.messaging().send(message);
    });