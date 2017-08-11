import { Membrane } from './Membrane';

(async () => {
  const membrane = new Membrane('async');
  await Promise.resolve();
  membrane.destroy();
})();
