const http = require("http");
const app = require("./app");
const initSocket = require("./socket");

const server = http.createServer(app);
const io = initSocket(server);

app.set("io", io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server started on port", PORT));
