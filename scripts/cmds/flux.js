module.exports = {
config: { 
name: "flux", 
author: "jun jaam",
category: "ai-generated" 
},
onStart: async ({ message: { reply: r }, args: a }) => {
let pr = a.join(" ");
if(!pr) return r("add query");
ratio = "1:1", m = pr.match(/--(\d)$/);
 if (m) {
 ratio = { "1": "1:1", "2": "9:16", "3": "3:2", "4": "16:9" }[m[1]] || "1:1";
pr = pr.replace(/--\d$/, "").trim();
}
try {
r({
body: pr,
attachment: await global.utils.getStreamFromURL(`https://samirxpikachuio.onrender.com/fluxpro?prompt=${encodeURIComponent(pr)}&ratio=${ratio}`),
});
} catch (err) {
 r(err.message);
  }
 },
};
