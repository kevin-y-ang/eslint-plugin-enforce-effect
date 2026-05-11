export async function readConfig() {
  try {
    return await loadConfig();
  } catch (error) {
    return recoverFrom(error);
  }
}
