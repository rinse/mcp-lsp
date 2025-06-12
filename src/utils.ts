import { readFile } from "fs";

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readFileAsync(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    return readFile(filePath, { encoding: "utf-8" }, (err, data) => {
      err != null ? reject(err) : resolve(data);
    });
  });
}
