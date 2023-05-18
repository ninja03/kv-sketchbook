/**
 * This module implements the DB layer for the Tic Tac Toe game. It uses Deno's
 * key-value store to store data, and uses BroadcastChannel to perform real-time
 * synchronization between clients.
 */

import { downloadImage, uploadToCloudinary } from "./cloudinary.ts";
import { Image, OauthSession, TimelineImage, User } from "./types.ts";

const kv = await Deno.openKv();

export async function getAndDeleteOauthSession(
  session: string,
): Promise<OauthSession | null> {
  const res = await kv.get<OauthSession>(["oauth_sessions", session]);
  if (res.versionstamp === null) return null;
  await kv.delete(["oauth_sessions", session]);
  return res.value;
}

export async function setOauthSession(session: string, value: OauthSession) {
  await kv.set(["oauth_sessions", session], value);
}

export async function setUserWithSession(user: User, session: string) {
  await kv
    .atomic()
    .set(["users", user.id], user)
    .set(["users_by_login", user.login], user)
    .set(["users_by_session", session], user)
    .set(["users_by_last_signin", new Date().toISOString(), user.id], user)
    .commit();
}

export async function getUserBySession(session: string) {
  const res = await kv.get<User>(["users_by_session", session]);
  return res.value;
}

export async function getUserById(id: string) {
  const res = await kv.get<User>(["users", id]);
  return res.value;
}

export async function getUserByLogin(login: string) {
  const res = await kv.get<User>(["users_by_login", login]);
  return res.value;
}

export async function deleteSession(session: string) {
  await kv.delete(["users_by_session", session]);
}

export async function updateImage(uid: string, id: string, data: File) {
  const user = await getUserById(uid);
  if (!user) throw new Error("user not found");

  const prev = await kv.get<Image>(["images2", uid, id]);
  if (!prev.value) throw new Error("image not found");

  const body = new Uint8Array(await data.arrayBuffer());

  // Cloudinaryにアップロード
  const imageUrl = await uploadToCloudinary(body);

  const image: Image = {
    id,
    uid,
    // data: body,
    url: imageUrl,
    type: data.type,
    createdAt: prev.value.createdAt,
    updatedAt: new Date(),
  };

  await kv.set(["images2", uid, id], image);

  // const timelineImage: TimelineImage = {
  //   id,
  //   uid,
  //   userName: user.name,
  //   avatarUrl: user.avatarUrl,
  //   createdAt: new Date(),
  // };
  // await kv.set(["timeline", id], timelineImage);
}

export async function addImage(uid: string, data: File) {
  const myUUID = crypto.randomUUID();
  const id = new Date().getTime() + "-" + myUUID;
  const user = await getUserById(uid);
  if (!user) throw new Error("user not found");

  const body = new Uint8Array(await data.arrayBuffer());

  // Cloudinaryにアップロード
  const imageUrl = await uploadToCloudinary(body);

  const image: Image = {
    id,
    uid,
    // data: body,
    url: imageUrl,
    type: data.type,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await kv.set(["images2", uid, id], image);

  const timelineImage: TimelineImage = {
    id,
    uid,
    userName: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: new Date(),
  };
  await kv.set(["timeline2", id], timelineImage);
}

export async function listGlobalTimelineImage(reverse = false) {
  const iter = await kv.list<TimelineImage>(
    { prefix: ["timeline2"] },
    { reverse },
  );
  const images: TimelineImage[] = [];
  for await (const item of iter) {
    images.push(item.value);
  }
  return images;
}

export async function listImage(uid: string, reverse = false) {
  const iter = await kv.list<Image>({ prefix: ["images2", uid] }, { reverse });
  const images: Image[] = [];
  for await (const item of iter) {
    item.value.data = await downloadImage(item.value.url);
    images.push(item.value);
  }
  return images;
}

export async function getImage(uid: string, id: string) {
  const res = await kv.get<Image>(["images2", uid, id]);
  if (res.value) {
    res.value.data = await downloadImage(res.value.url);
  }
  return res.value;
}

export async function deleteImage(uid: string, id: string) {
  await kv
    .atomic()
    .delete(["images2", uid, id])
    .delete(["timeline2", id])
    .commit();
}
