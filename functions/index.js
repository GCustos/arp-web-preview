const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const bufferApiKey = defineSecret("BUFFER_API_KEY");

const CHANNELS = {
  linkedin: "6a720a8999afb44349fe0523",
  facebook: "6a7211ba99afb44349fe66c5",
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

async function publishToChannel(channelId, text, imageUrl, apiKey) {
  const input = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: "shareNow",
  };
  if (imageUrl) {
    input.assets = [{ image: { url: imageUrl } }];
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

exports.publishToSocial = onCall({ secrets: [bufferApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Hay que iniciar sesión para publicar.");
  }

  const { text, imageUrl } = request.data || {};
  if (!text || typeof text !== "string") {
    throw new HttpsError("invalid-argument", "Falta el texto del post.");
  }

  const apiKey = bufferApiKey.value();
  const entries = await Promise.all(
    Object.entries(CHANNELS).map(async ([network, channelId]) => [
      network,
      await publishToChannel(channelId, text, imageUrl, apiKey),
    ])
  );

  return Object.fromEntries(entries);
});
