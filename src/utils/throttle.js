export async function throttleAll(tasks, limit = 10) {
  const results = [];
  let i = 0;
  let running = 0;

  return new Promise((resolve) => {
    const next = () => {
      while (running < limit && i < tasks.length) {
        const task = tasks[i++];
        running++;
        task()
          .then((res) => results.push(res))
          .catch(() => results.push(null))
          .finally(() => {
            running--;
            if (i === tasks.length && running === 0) {
              resolve(results);
            } else {
              next();
            }
          });
      }
    };
    next();
  });
}
