// .devcontainer/devcontainer.js
module.exports = {
  name: "Node.js & React Dev Container",
  build: {
    dockerfile: "Dockerfile",
    context: ".."
  },
  settings: {
    "terminal.integrated.shell.linux": "/bin/bash"
  },
  extensions: [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ],
  postCreateCommand: "npm install --prefix backend && npm install --prefix frontend"
};