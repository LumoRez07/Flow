/*
 * Flow - A high-performance teleprompter for Windows.
 * Copyright (C) 2026 Waled Alturkmani (LumoRez07)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as proStub from "./pro-stub.js";
import { isProEdition } from "./distribution.js";

let loadedProModule = null;

export async function getProModule() {
  if (loadedProModule) {
    return loadedProModule;
  }

  const isPro = await isProEdition();
  if (!isPro) {
    loadedProModule = proStub;
    return loadedProModule;
  }

  try {
    // Attempt dynamic import from private submodule directory
    const pro = await import("../pro/index.js");
    loadedProModule = pro;
  } catch (error) {
    // If submodule is empty or not present, fallback safely to stub
    console.info("Pro submodule not installed, running in standard community mode.");
    loadedProModule = proStub;
  }

  return loadedProModule;
}
