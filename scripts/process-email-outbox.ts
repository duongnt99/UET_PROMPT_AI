import "dotenv/config";
import { processEmailOutbox } from "../src/lib/email";

processEmailOutbox(50)
  .then(() => console.info("Outbox processed"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
