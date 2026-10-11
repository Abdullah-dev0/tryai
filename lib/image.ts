import type { FileUIPart } from "ai";
import { IMAGE_MAX_DIMENSION, MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/limits";

export async function imageFileToPart(file: File): Promise<FileUIPart> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);

	const context = canvas.getContext("2d");
	if (!context) throw new Error("Could not read image");
	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();

	for (const quality of [0.8, 0.6, 0.4]) {
		const url = canvas.toDataURL("image/jpeg", quality);
		if (url.length <= MAX_IMAGE_DATA_URL_LENGTH) {
			return { type: "file", mediaType: "image/jpeg", filename: file.name, url };
		}
	}
	throw new Error("Image is too large");
}
