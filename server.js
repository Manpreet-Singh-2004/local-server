const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const app = express();
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.static(__dirname));

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

    res.redirect(`/download/${encodeURIComponent(name)}`);
});

app.get("/download/:name", (req, res) => {
    const name = req.params.name;
    const targetDir = path.join(__dirname, "uploads", name);

    if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        const fileLinks = files.map(file => `
            <div class="file-link">
                <span class="file-icons">
                    <a href="/download/${encodeURIComponent(name)}/${encodeURIComponent(file)}" download>
                        <i class="fas fa-download"></i>
                    </a>
                </span>
                <span class="file-name">${file}</span>
                <span class="file-icons">
                    <a href="/view/${encodeURIComponent(name)}/${encodeURIComponent(file)}" target="_blank">
                        <i class="far fa-eye"></i>
                    </a>
                </span>
            </div>
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

app.get("/download-all", (req, res) => {
    const name = req.query.name;
    const targetDir = path.join(__dirname, "uploads", name);

    if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        const filePaths = files.map(file => path.join(targetDir, file));

        // Create a zip file containing all the files to be downloaded
        const zipFilePath = path.join(__dirname, "uploads", `${name}.zip`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", {
            zlib: { level: 9 } // Compression level (0 to 9)
        });

        output.on("close", function () {
            res.download(zipFilePath, `${name}.zip`, function (err) {
                // Delete the zip file after sending
                fs.unlink(zipFilePath, (err) => {
                    if (err) {
                        console.error("Error deleting zip file:", err);
                    }
                });
            });
        });

        archive.on("error", function (err) {
            console.error("Error creating zip:", err);
            res.status(500).send("Internal Server Error");
        });

        archive.pipe(output);
        filePaths.forEach(filePath => {
            archive.file(filePath, { name: path.basename(filePath) });
        });
        archive.finalize();
    } else {
        res.status(404).send(`<h1>No files found for ${name}</h1>`);
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
