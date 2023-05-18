import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserBySession } from "🛠️/db.ts";
import { State, User } from "🛠️/types.ts";

import { Header } from "🧱/Header.tsx";
import Canvas from "🏝️/canvas.tsx";
import { Breadcrumbs } from "🧱/Breadcrumbs.tsx";
import { APP_NAME } from "🛠️/const.ts";

interface Data {
  user: User;
  imageId: string;
}
export const handler: Handlers<Data, State> = {
  async GET(_, ctx) {
    const user = await getUserBySession(ctx.state.session ?? "");
    if (!user) return ctx.renderNotFound();

    const imageId = ctx.params.id;

    return ctx.render({ user, imageId });
  },
};

export default function Home(props: PageProps<Data>) {
  const { user, imageId } = props.data;

  return (
    <>
      <Head>
        <title>
          Edit | {APP_NAME}
        </title>
      </Head>
      <Header user={user} hideNew />
      <div class="mt-4">
        <Breadcrumbs
          pages={[
            {
              name: "Edit",
              href: "/edit",
              current: true,
            },
          ]}
        />
      </div>
      <div class="mt-8">
        <Canvas uid={user?.id || ""} imageId={imageId} />
      </div>
    </>
  );
}
