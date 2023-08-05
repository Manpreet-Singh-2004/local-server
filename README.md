# local-server
This repository contains the files for a local server, the server is set to delete files after 2 hours. anyone on the same wifi network can save their files, view them and download them from different devices. Also, if you have to send a file to any other person on the same wifi network then that too is possible using this. <br>
To run these files you must have node.js installed and setup. Then download all the files in the same folder and launch up the terminal or command prompt and use the command "node server.js" <br>
To access this HTML, use the command "ipconfig" to check your IPv4 address which is our local address (for example -: 192.168.1.2). The default port that is used for this local server is 3000. so in order to upload the files and download files, go to your browser and search for "http://*localaddress*:3000/frontend.html" (example -: http://192.168.1.2:3000/frontend.html) <br>
The files uploaded will be saved in the upload folder, and any device connected to the network will be able to add files, or see/download them. <br>
To make sure that unwanted personel wont be able to access the files, i have implemented the your name, feature, and all the people will be able to upload the files, but only those can access the file who know their name. <br>
The files will be stored for 2 hours and will be automatically deleted after the given time frame. <br>
