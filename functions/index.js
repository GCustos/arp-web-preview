const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const bufferApiKey = defineSecret("BUFFER_API_KEY");

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
