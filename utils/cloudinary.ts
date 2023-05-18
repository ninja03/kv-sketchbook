import { v2 as cloudinary } from "npm:cloudinary";
import { encode } from "https://deno.land/std@0.97.0/encoding/base64.ts";

export async function uploadToCloudinary(body: Uint8Array) {
  cloudinary.config({
    cloud_name: Deno.env.get("CLOUDINARY_CLOUD_NAME")!,
    api_key: Deno.env.get("CLOUDINARY_API_KEY")!,
    api_secret: Deno.env.get("CLOUDINARY_API_SECRET")!
  });

  // バイナリデータをCloudinaryにアップしたい
  // https://cloudinary.com/documentation/node_image_and_video_upload
  // The file to upload can be specified as a local path, a remote HTTP or HTTPS URL, a whitelisted storage bucket (S3 or Google Storage) URL, a base64 data URI, or an FTP URL. For details, see File source options.
  //image.data;

  // おくれる形式
  // https://cloudinary.com/documentation/upload_images#file_source_options

  // const res = await cloudinary.uploader.upload('5.png', {public_id: "denokun"});

  // https://cloudinary.com/documentation/upload_images#upload_via_a_base_64_data_uri
  // no larger than 100 MB
  const result = await cloudinary.uploader.upload("data:image/png;base64," + encode(body));
  console.log(result.secure_url);

  // テスト
  return result.secure_url;
}

if (import.meta.main) {
  const body = await Deno.readFile("5.png");
  await uploadToCloudinary(body);
}

// 画像をダウンロード
export async function downloadImage(url: string): Promise<Uint8Array> {
  const buf = await (await fetch(url)).arrayBuffer();
  return new Uint8Array(buf);
}