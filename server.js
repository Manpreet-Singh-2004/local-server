const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.static(__dirname)); // This line allows serving static files from the current directory.

// Function to remove files older than 2 hours
function removeOldFiles() {
    const uploadsDir = path.join(__dirname, "uploads");
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago (milliseconds)

    fs.readdirSync(uploadsDir).forEach(name => {
        const userDir = path.join(uploadsDir, name);
        fs.readdirSync(userDir).forEach(file => {
            const filePath = path.join(userDir, file);
            const fileStats = fs.statSync(filePath);
            if (fileStats.birthtimeMs < twoHoursAgo) {
                fs.unlinkSync(filePath);
            }
        });

        // Check if the user directory is empty and remove it if so
        if (fs.readdirSync(userDir).length === 0) {
            fs.rmdirSync(userDir);
        }
    });
}

// Cleanup files every 30 minutes (adjust the interval as needed)
setInterval(removeOldFiles, 30 * 60 * 1000); // 30 minutes (milliseconds)

// Serve frontend.html at the URL http://localhost:3000/file-upload
app.get("/file-upload", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend.html"));
});

app.post("/upload", upload.array("file"), (req, res) => {
    const name = req.body.name;
    const files = req.files;
    const targetDir = path.join(__dirname, "uploads", name);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }

    files.forEach(file => {
        const targetFilePath = path.join(targetDir, file.originalname);
        fs.renameSync(file.path, targetFilePath);
    });

    res.redirect(`/download/${name}`);
});

app.get("/download/:name", (req, res) => {
    const name = req.params.name;
    const targetDir = path.join(__dirname, "uploads", name);

    if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        const fileLinks = files.map(file => `
            <span class="file-icons">
                <a href="/download/${name}/${file}" download>
                    <i class="fas fa-download"></i>
                </a>
            </span>
            <span>${file}</span>
            <span class="file-icons">
                <a href="/view/${name}/${file}" target="_blank">
                    <i class="far fa-eye"></i>
                </a>
            </span>
            <br>
        `).join("");
        res.send(`
            <h1>Download Files for ${name}</h1>
            ${fileLinks}
        `);
    } else {
        res.send(`<h1>No files found for ${name}</h1>`);
    }
});

app.get("/download/:name/:file", (req, res) => {
    const name = req.params.name;
    const file = req.params.file;
    const filePath = path.join(__dirname, "uploads", name, file);
    res.download(filePath);
});

app.get("/view/:name/:file", (req, res) => {
    const name = req.params.name;
    const file = req.params.file;
    const filePath = path.join(__dirname, "uploads", name, file);
    res.sendFile(filePath, function (err) {
        if (err) {
            console.error("Error:", err);
        } else {
            // Delete the file after sending
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
