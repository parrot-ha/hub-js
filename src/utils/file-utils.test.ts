import { describe, expect, test } from "@jest/globals";
import {
  readUserDir,
  readFile,
  createUserDirectory,
  deleteUserFile,
  getHomeDir,
  saveUserFile,
  saveUserYamlFile,
  parseUserYamlFile,
  flushFiles,
  saveFileSync,
  readUserFile,
} from "./file-utils";
import fs from "fs";

let deleteUserDir = false;

beforeAll(() => {
  // Create a test directory
  if (!fs.existsSync(getHomeDir())) {
    deleteUserDir = true;
    fs.mkdirSync(getHomeDir());
  }
});

afterAll(async () => {
  // Clean up the test directories and files
  if (deleteUserDir) {
    fs.rmdirSync(`${getHomeDir()}`, { recursive: true });
  } else {
    // If we don't delete the user directory, we should delete the test directory
    if (fs.existsSync(`${getHomeDir()}/fullLifecycleTest`)) {
      fs.rmdirSync(`${getHomeDir()}/fullLifecycleTest`, { recursive: true });
    }
  }
});

describe("test full lifecycle of file utils", () => {
  test("full lifecycle", () => {
    createUserDirectory("fullLifecycleTest");
    saveUserYamlFile("fullLifecycleTest/test.yaml", { myKey: "myValue" });
    saveUserFile("fullLifecycleTest/test.txt", "Hello, world!");
    saveFileSync("fullLifecycleTest/test2.txt", "Hello, world! 2");
    return flushFiles().then(() => {
      // Check if the files were created
      expect(fs.existsSync(`${getHomeDir()}/fullLifecycleTest/test.yaml`)).toBe(
        true,
      );
      expect(fs.existsSync(`${getHomeDir()}/fullLifecycleTest/test.txt`)).toBe(
        true,
      );

      // Read the files
      const yamlContents = fs.readFileSync(
        `${getHomeDir()}/fullLifecycleTest/test.yaml`,
        "utf8",
      );
      const txtContents = fs.readFileSync(
        `${getHomeDir()}/fullLifecycleTest/test.txt`,
        "utf8",
      );
      const txt2Contents = readUserFile("fullLifecycleTest", "test2.txt");

      // Check the contents
      expect(yamlContents).toContain("myKey: myValue");
      expect(txtContents).toBe("Hello, world!");

      // Delete the files
      deleteUserFile("fullLifecycleTest/test.yaml");
      deleteUserFile("fullLifecycleTest/test.txt");
      deleteUserFile("fullLifecycleTest/test2.txt");

      // Check if the files were deleted
      expect(fs.existsSync(`${getHomeDir()}/fullLifecycleTest/test.yaml`)).toBe(
        false,
      );
      expect(fs.existsSync(`${getHomeDir()}/fullLifecycleTest/test.txt`)).toBe(
        false,
      );

      fs.rmdirSync(`${getHomeDir()}/fullLifecycleTest`, { recursive: true });
    });
  });
});

test("save and read yaml file", async () => {
  createUserDirectory("testYamlFile");
  saveUserYamlFile("testYamlFile/test.yaml", { myKey: "myValue" });
  await new Promise((r) => setTimeout(r, 2000));
  expect(fs.existsSync(`${getHomeDir()}/testYamlFile/test.yaml`)).toBe(true);

  const contents = parseUserYamlFile("testYamlFile", "test.yaml");

  expect(contents).toBeDefined();
  expect(contents.myKey).toBe("myValue");
  deleteUserFile("testYamlFile/test.yaml");
  expect(fs.existsSync(`${getHomeDir()}/testYamlFile/test.yaml`)).toBe(false);
  fs.rmdirSync(`${getHomeDir()}/testYamlFile`, { recursive: true });
});

test("delete file with backup", async () => {
  createUserDirectory("testDeleteFileWithBackup");
  saveUserFile("testDeleteFileWithBackup/test.txt", "Hello, world!");
  await new Promise((r) => setTimeout(r, 2000));
  saveUserFile("testDeleteFileWithBackup/test.txt", "Hello, world2!");
  await new Promise((r) => setTimeout(r, 2000));

  expect(
    fs.existsSync(`${getHomeDir()}/testDeleteFileWithBackup/test.txt`),
  ).toBe(true);
  expect(
    fs.existsSync(`${getHomeDir()}/testDeleteFileWithBackup/test.txt.bak`),
  ).toBe(true);

  expect(readFile(`${getHomeDir()}/testDeleteFileWithBackup/test.txt`)).toBe(
    "Hello, world2!",
  );
  expect(
    readFile(`${getHomeDir()}/testDeleteFileWithBackup/test.txt`, true),
  ).toBe("Hello, world!");

  deleteUserFile("testDeleteFileWithBackup/test.txt");
  expect(
    fs.existsSync(`${getHomeDir()}/testDeleteFileWithBackup/test.txt`),
  ).toBe(false);
  expect(
    fs.existsSync(`${getHomeDir()}/testDeleteFileWithBackup/test.txt.bak`),
  ).toBe(false);

  // Clean up
  fs.rmdirSync(`${getHomeDir()}/testDeleteFileWithBackup`, { recursive: true });
});

test("dont save empty file with backup", async () => {
  // Clean up

  if (fs.existsSync(`${getHomeDir()}/testEmptyFileWithBackup`)) {
    fs.rmdirSync(`${getHomeDir()}/testEmptyFileWithBackup`, {
      recursive: true,
    });
  }

  createUserDirectory("testEmptyFileWithBackup");
  saveUserFile("testEmptyFileWithBackup/test.txt", "Hello, world!");
  await new Promise((r) => setTimeout(r, 2000));
  saveUserFile("testEmptyFileWithBackup/test.txt", "", false);
  await new Promise((r) => setTimeout(r, 2000));

  expect(
    fs.existsSync(`${getHomeDir()}/testEmptyFileWithBackup/test.txt`),
  ).toBe(true);
  expect(
    fs.existsSync(`${getHomeDir()}/testEmptyFileWithBackup/test.txt.bak`),
  ).toBe(false);

  expect(readFile(`${getHomeDir()}/testEmptyFileWithBackup/test.txt`)).toBe(
    "Hello, world!",
  );

  deleteUserFile("testEmptyFileWithBackup/test.txt");
  expect(
    fs.existsSync(`${getHomeDir()}/testEmptyFileWithBackup/test.txt`),
  ).toBe(false);
  expect(
    fs.existsSync(`${getHomeDir()}/testEmptyFileWithBackup/test.txt.bak`),
  ).toBe(false);

  // Clean up
  fs.rmdirSync(`${getHomeDir()}/testEmptyFileWithBackup`, { recursive: true });
});

describe("readDir", () => {
  beforeAll(() => {
    createUserDirectory("testFileUtils");
    fs.writeFileSync(`${getHomeDir()}/testFileUtils/test.txt`, "test");
    fs.writeFileSync(`${getHomeDir()}/testFileUtils/test2.txt`, "test2");
    fs.writeFileSync(`${getHomeDir()}/testFileUtils/test3.txt`, "test3");
  });

  afterAll(() => {
    deleteUserFile("testFileUtils/test.txt");
    deleteUserFile("testFileUtils/test2.txt");
    deleteUserFile("testFileUtils/test3.txt");
    fs.rmdirSync(`${getHomeDir()}/testFileUtils`, { recursive: true });
  });

  test("should return list of files in the directory", () => {
    let files = readUserDir("testFileUtils/");
    expect(files).toBeDefined();
    expect(files.length).toBe(3);
    expect(files.includes("test.txt")).toBe(true);
    expect(files.includes("test2.txt")).toBe(true);
    expect(files.includes("test3.txt")).toBe(true);
  });

  test("should return an empty array when the directory is empty", () => {
    createUserDirectory("empty-directory");
    const result = readUserDir("/empty-directory");
    expect(result).toEqual([]);
    fs.rmdirSync(`${getHomeDir()}/empty-directory`, { recursive: true });
    console.log("should return an empty array when the directory is empty");
  });

  test("should throw an error when the directory does not exist", () => {
    expect(() => readUserDir("/non-existent-directory")).toThrow(
      "ENOENT: no such file or directory",
    );
  });
});
