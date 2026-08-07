const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const bufferApiKey = defineSecret("BUFFER_API_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");

const CHANNELS = {
  linkedin: { id: "6a720a8999afb44349fe0523" },
  facebook: {
    id: "6a7211ba99afb44349fe66c5",
    metadata: { facebook: { type: "post" } },
  },
  instagram: {
    id: "6a71dc9599afb44349fcd1a9",
    metadata: { instagram: { type: "post", shouldShareToFeed: true } },
    requiresImage: true,
  },
};

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

async function publishToChannel(channel, text, imageUrl, apiKey) {
  if (channel.requiresImage && !imageUrl) {
    return { ok: false, error: "Este canal requiere foto." };
  }

  const input = {
    text,
    channelId: channel.id,
    schedulingType: "automatic",
    mode: "shareNow",
  };
  if (imageUrl) {
    input.assets = [{ image: { url: imageUrl } }];
  }
  if (channel.metadata) {
    input.metadata = channel.metadata;
  }

  const response = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query: CREATE_POST_MUTATION, variables: { input } }),
  });

  const json = await response.json();
  const result = json?.data?.createPost;
  if (json.errors?.length) {
    return { ok: false, error: json.errors[0].message };
  }
  if (result?.message) {
    return { ok: false, error: result.message };
  }
  return { ok: true, postId: result?.post?.id };
}

const ALLOWED_PUBLISHERS = [
  "guimarcon.arp@gmail.com",
  "josmorvel.arp@gmail.com",
  "natcrualb.arp@gmail.com",
];

exports.publishToSocial = onCall({ secrets: [bufferApiKey] }, async (request) => {
  if (!request.auth || !ALLOWED_PUBLISHERS.includes(request.auth.token.email)) {
    throw new HttpsError("permission-denied", "No tienes permiso para publicar.");
  }

  const { text, imageUrl } = request.data || {};
  if (!text || typeof text !== "string") {
    throw new HttpsError("invalid-argument", "Falta el texto del post.");
  }

  const apiKey = bufferApiKey.value();
  const entries = await Promise.all(
    Object.entries(CHANNELS).map(async ([network, channel]) => [
      network,
      await publishToChannel(channel, text, imageUrl, apiKey),
    ])
  );

  return Object.fromEntries(entries);
});

// Busca si el email de un lead web coincide con un contacto ya conocido
// en el CRM interno (contactos/clientes de arp-inspecciones), para dar
// contexto ("esto es Fulano, de Cliente X") en vez de tratarlo como desconocido.
async function buscarContactoCRM(email) {
  const db = admin.firestore();
  const contactoSnap = await db.collection("contactos").where("email", "==", email).limit(1).get();
  if (contactoSnap.empty) return null;

  const contactoId = contactoSnap.docs[0].id;
  const nombre = contactoSnap.docs[0].data().nombre || null;

  const clientesSnap = await db.collection("clientes").get();
  for (const doc of clientesSnap.docs) {
    const vinculo = (doc.data().contactos || []).find((v) => v.contactoId === contactoId);
    if (vinculo) {
      return { nombre, cliente: doc.data().nombre, rol: vinculo.rol || null };
    }
  }
  return { nombre, cliente: null, rol: null };
}

async function enviarEmailContacto(apiKey, destinatario, datos, esNuevo, crm) {
  const asunto = (esNuevo ? "Nuevo contacto web" : "Nuevo mensaje (contacto repetido)") + " — " + datos.nombre;
  const crmLine = crm
    ? `<p><strong>Ya conocido en el CRM${crm.cliente ? " — " + crm.cliente + (crm.rol ? " (" + crm.rol + ")" : "" ) : ""}.</strong></p>`
    : "";
  const html = `
    ${crmLine}
    <p><strong>Nombre:</strong> ${datos.nombre}</p>
    <p><strong>Empresa:</strong> ${datos.empresa || "—"}</p>
    <p><strong>Email:</strong> ${datos.email}</p>
    <p><strong>Teléfono:</strong> ${datos.telefono || "—"}</p>
    <p><strong>Tipo de instalación:</strong> ${(datos.tipo || []).join(", ") || "—"}</p>
    <p><strong>Mensaje:</strong><br>${(datos.mensaje || "").replace(/\n/g, "<br>")}</p>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "ARP Web <web@arpprevencion.com>",
      to: [destinatario],
      subject: asunto,
      html,
    }),
  });

  const respBody = await resp.text();
  if (!resp.ok) {
    console.error("Resend error", resp.status, respBody);
  } else {
    console.log("Resend OK", respBody);
  }
}

exports.submitContact = onCall({ secrets: [resendApiKey] }, async (request) => {
  const { nombre, empresa, email, telefono, tipo, mensaje } = request.data || {};
  if (!nombre || !email || !mensaje) {
    throw new HttpsError("invalid-argument", "Faltan campos obligatorios (nombre, email, mensaje).");
  }

  const emailLower = String(email).trim().toLowerCase();
  const db = admin.firestore();
  const docRef = db.collection("solicitudesWeb").doc(emailLower);
  const existing = await docRef.get();
  const esNuevo = !existing.exists;

  const crm = await buscarContactoCRM(emailLower);

  await docRef.set(
    {
      nombre,
      empresa: empresa || "",
      telefono: telefono || "",
      email: emailLower,
      tipoInstalacion: Array.isArray(tipo) ? tipo : [],
      ultimoMensaje: mensaje,
      ultimaVez: admin.firestore.FieldValue.serverTimestamp(),
      primeraVez: esNuevo ? admin.firestore.FieldValue.serverTimestamp() : existing.data().primeraVez,
      numContactos: admin.firestore.FieldValue.increment(1),
      atendido: false,
      clienteConocido: crm,
    },
    { merge: true }
  );

  await docRef.collection("mensajes").add({
    mensaje,
    telefono: telefono || "",
    empresa: empresa || "",
    tipoInstalacion: Array.isArray(tipo) ? tipo : [],
    fecha: admin.firestore.FieldValue.serverTimestamp(),
  });

  const empresaConfig = await db.collection("config").doc("empresa").get();
  const destinatario = empresaConfig.data()?.email || "info@arpprevencion.com";

  await enviarEmailContacto(
    resendApiKey.value(),
    destinatario,
    { nombre, empresa, email: emailLower, telefono, tipo, mensaje },
    esNuevo,
    crm
  );

  return { ok: true, esNuevo, clienteConocido: !!crm };
});
