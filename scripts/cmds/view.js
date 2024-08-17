module.exports = {
  config: {
    name: "listfiles",
    aliases: ["files", "view"],
    version: "1.1",
    author: "Abdul Kaiyum",
    description: "List media files from GitHub",
    category: "storage",
    guide: "{pn} <optional_search_tag>",
  },
  onStart: async function ({ api, event, args }) {
    const tag = args[0] || null;

    try {
      const files = await octokit.repos.getContent({
        owner: "abdul-kaiyum1",
        repo: "save",
        path: tag ? `${tag}/` : "",
      });

      if (!files.data.length) {
        return api.sendMessage(`No files found${tag ? ` under tag: ${tag}` : ""}.`, event.threadID);
      }

      // Paginate and list files
      const fileList = files.data
        .filter(item => item.type === "file")
        .map(file => `- ${file.name}`)
        .join("\n");

      return api.sendMessage(`Files:\n${fileList}`, event.threadID);
    } catch (error) {
      console.error("Error listing files:", error);
      return api.sendMessage("Error occurred while listing the files.", event.threadID);
    }
  }
};