const jwt = require("jsonwebtoken");

function initSocket(server) {
    const io = require("socket.io")(server, {
        cors: { origin: "*" }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token"));

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = user;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("WS connected:", socket.user);
    });

    return io;
}

module.exports = initSocket;
