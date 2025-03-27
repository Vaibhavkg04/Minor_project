const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Set up Socket.IO on the same server
const io = new Server(server);

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
	console.log(`Socket Connected:`, socket.id);

	socket.on("room:join", (data) => {
		const { email, room } = data;
		emailToSocketIdMap.set(email, socket.id);
		socketidToEmailMap.set(socket.id, email);
		io.to(room).emit("user:joined", { email, id: socket.id });
		socket.join(room);
		io.to(socket.id).emit("room:join", data);
	});

	socket.on("user:call", ({ to, offer }) => {
		io.to(to).emit("incomming:call", { from: socket.id, offer });
	});

	socket.on("call:accepted", ({ to, ans }) => {
		io.to(to).emit("call:accepted", { from: socket.id, ans });
	});

	socket.on("peer:nego:needed", ({ to, offer }) => {
		io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
	});

	socket.on("peer:nego:done", ({ to, ans }) => {
		io.to(to).emit("peer:nego:final", { from: socket.id, ans });
	});
});

// Serve the React build folder
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// Serve the React app on any unknown route
app.get("*", (req, res) => {
	res.sendFile(path.join(buildPath, "index.html"));
});

// Start the server
const PORT = 8000;
server.listen(PORT, "0.0.0.0", () =>
	console.log(`Server running on port ${PORT}`)
);
