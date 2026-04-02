export async function loadConfig() {
  const ready = Promise.resolve(true);
  const settled = ready.then(identity).catch(recover);
  const allTasks = Promise.all([settled]);
  const config = await allTasks;

  return new Promise((resolve) => {
    resolve(config);
  });
}
