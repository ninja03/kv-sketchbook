import { Handlers } from "$fresh/server.ts";
import { addImage, getUserBySession, updateImage } from "🛠️/db.ts";
import { State, User } from "🛠️/types.ts";

interface Data {
  user: User | null;
}
export const handler: Handlers<Data, State> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const user = await getUserBySession(ctx.state.session ?? "");
    if (user === null) {
      return new Response("Unauthorized", { status: 401 });
    }

    const file = form.get("image") as File | null;
    const imageId = form.get("imageId") as string | null;
    console.log("imageId", imageId);

    if (!file) {
      return new Response("Bad Request", { status: 400 });
    }
    const reader = file.stream().getReader();
    const result = await reader.read();
    const bytes = result.value;
    if (!bytes) {
      return new Response("Bad Request", { status: 400 });
    }

    if (imageId) {
      await updateImage(user.id, imageId, file);
    } else {
      await addImage(user.id, file);
    }

    return new Response("OK");
  },
};
