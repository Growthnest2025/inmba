import { httpServerHandler } from "cloudflare:node";
import app from "./src/app.js";

const PORT = 3000;

app.listen(PORT);

export default httpServerHandler({ port: PORT });