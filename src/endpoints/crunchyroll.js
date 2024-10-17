const { rateLimit } = require("express-rate-limit").default;
const experimentalEnd = new Date("07/18/2024").getTime();
const betaEnd = new Date("07/25/2024").getTime();
// default template
// fyi all id's are when it was created on an ep as thats unique enough
const uuid = require("uuid");
const { isMalLink } = require("../util/mal_plugin");
module.exports = (router, db) => {
  router.use(async (req, res, next) => {
    const visits = (await db.get("visits")) || 0;
    req.visits = visits;
    await db.set("visits", visits + 1);
    next();
  });
  router.all("/", (req, res) => res.json("Hello, world!"));
  router.get("/visits", async (req, res) => {
    const visits = req.visits;
    res.json({ visits });
  });
  const defLimit = rateLimit({ windowMs: 1000, limit: 2 });
  router.get("/comments/:epid/:epname", defLimit, async (req, res) => {
    // db.get(`${req.params.epid}_${req.params.epname}`)
    const isAuthed = req.query.auth == process.env.CR_AUTH;

    console.log(isAuthed);
    let result =
      (await db.get(`${req.params.epid}_${req.params.epname}`)) || [];
    const userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
    const userIdSupplied = Boolean(userId);
    result = result.map((i) => {
      if (userIdSupplied) {
        if (Array.isArray(i.user_who_liked))
          i.has_liked = i.user_who_liked.includes(userId);
        if (Array.isArray(i.user_who_disliked))
          i.has_disliked = i.user_who_disliked.includes(userId);
      }
      if (userId == i.userId) {
        i.is_mine = true;
      } else {
        i.is_mine = false;
      }
      if (!isAuthed) {
        delete i["userId"];
        delete i["user_who_liked"];
        delete i["user_who_disliked"];
      }
      return i;
    });
    res.json(result);
  });
  router.get("/db/get_all", async (req, res) => {
    const isAuthed = req.query.auth == process.env.CR_AUTH;
    if (!isAuthed) return res.status(401).end();
    const result = {};
    for await (let [key, value] of db.iterator()) {
      result[key] = value;
    }
    res.json(result);
  });
  router.post(
    "/comments/:epid/:epname/:comment_id/like",
    defLimit,
    async (req, res) => {
      const userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
      if (!userId)
        return res.status(400).json({ message: `User ID not found` });
      if (userId.split("-").length < 3)
        return res.status(400).json({
          message: `User ID invalid\nOnly use this application via crunchyroll`,
        });
      const id = req.params.comment_id || req.query.id;
      if (!id)
        return res
          .status(400)
          .json({ message: `No Valid Message ID provided` });
      // const ep_data = await db.get(`${}`)
      let comments =
        (await db.get(`${req.params.epid}_${req.params.epname}`)) || [];
      const theComment = comments.findIndex(
        (e) => e.created_at == id || e.id == id,
      );
      if (
        Array.isArray(comments[theComment].user_who_liked) &&
        comments[theComment].user_who_liked.includes(userId)
      ) {
        // remove like on comment
        comments[theComment].user_who_liked.push(userId);
        // filter dups
        comments[theComment].user_who_liked = comments[
          theComment
        ].user_who_liked.filter((e) => e !== userId);
        comments[theComment].user_who_liked = [
          ...new Set(comments[theComment].user_who_liked),
        ];
        comments[theComment].likes = comments[theComment].user_who_liked.length;
        await db.set(`${req.params.epid}_${req.params.epname}`, comments);
        res.status(200).json({ message: "Un-Liked Comment" });
      } else {
        if (!comments[theComment].user_who_liked)
          comments[theComment].user_who_liked = [];
        comments[theComment].user_who_liked.push(userId);
        // filter dups
        comments[theComment].user_who_liked = [
          ...new Set(comments[theComment].user_who_liked),
        ];
        comments[theComment].likes = comments[theComment].user_who_liked.length;
        await db.set(`${req.params.epid}_${req.params.epname}`, comments);
        res.status(200).json({ message: "Liked Comment" });
      }
      // todo
      // res.status(419).end()
    },
  );
  router.post(
    "/comments/:epid/:epname/:comment_id/",
    async function (req, res) {
      // edit comment
      // needs userId , content to edit the messaage with,
      // needs to update content, update edit stamp, return OK
      const userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
      if (!userId)
        return res.status(400).json({ message: `User ID not found` });
      if (userId.split("-").length < 3)
        return res.status(400).json({
          message: `User ID invalid\nOnly use this application via crunchyroll`,
        });
      const id = req.params.comment_id || req.query.id;
      if (!id)
        return res
          .status(400)
          .json({ message: `No Valid Message ID provided` });
      if (!req.body.content)
        return res.status(400).json({ message: "No Content to update msg" });
      // const ep_data = await db.get(`${}`)
      let comments =
        (await db.get(`${req.params.epid}_${req.params.epname}`)) || [];
      const theComment = comments.findIndex(
        (e) => e.created_at == id || e.id == id,
      );
      if (userId !== comments[theComment].userId)
        return res
          .status(401)
          .json({ message: "Not allowed to edit others comments" });
      comments[theComment].content = req.body.content;
      comments[theComment].updated_at = Date.now();
      await db.set(`${req.params.epid}_${req.params.epname}`, comments);
      res.json({ message: "message updated" });
    },
  );
  router.delete("/comments/:epid/:epname/:comment_id/", async (req, res) => {
    // del comment
    // needs userId ,
    // needs to update content, update edit stamp, return OK
    const userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
    if (!userId) return res.status(400).json({ message: `User ID not found` });
    if (userId.split("-").length < 3)
      return res.status(400).json({
        message: `User ID invalid\nOnly use this application via crunchyroll`,
      });
    const id = req.params.comment_id || req.query.id;
    if (!id)
      return res.status(400).json({ message: `No Valid Message ID provided` });
    // const ep_data = await db.get(`${}`)
    let comments =
      (await db.get(`${req.params.epid}_${req.params.epname}`)) || [];
    const theComment = comments.findIndex(
      (e) => e.created_at == id || e.id == id,
    );
    if (userId !== comments[theComment].userId)
      return res
        .status(401)
        .json({ message: "Not allowed to edit others comments" });
    delete comments[theComment];
    comments = comments.filter(Boolean);
    await db.set(`${req.params.epid}_${req.params.epname}`, comments);
    res.json({ nessage: "Comment deleted!" });
    // await db.set
  });
  router.post(
    "/comments/:epid/:epname/:comment_id/dislike",
    defLimit,
    async (req, res) => {
      const userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
      if (!userId)
        return res.status(400).json({ message: `User ID not found` });
      if (userId.split("-").length < 3)
        return res.status(400).json({
          message: `User ID invalid\nOnly use this application via crunchyroll`,
        });
      const id = req.params.comment_id || req.query.id;
      if (!id)
        return res
          .status(400)
          .json({ message: `No Valid Message ID provided` });
      // const ep_data = await db.get(`${}`)
      let comments =
        (await db.get(`${req.params.epid}_${req.params.epname}`)) || [];
      const theComment = comments.findIndex(
        (e) => e.created_at == id || e.id == id,
      );
      if (
        Array.isArray(comments[theComment].user_who_disliked) &&
        comments[theComment].user_who_disliked.includes(userId)
      ) {
        // remove like on comment
        comments[theComment].user_who_disliked.push(userId);
        // filter dups
        comments[theComment].user_who_disliked = comments[
          theComment
        ].user_who_disliked.filter((e) => e !== userId);
        comments[theComment].user_who_disliked = [
          ...new Set(comments[theComment].user_who_disliked),
        ];
        comments[theComment].dislikes =
          comments[theComment].user_who_disliked.length;
        await db.set(`${req.params.epid}_${req.params.epname}`, comments);
        res.status(200).json({ message: "Un-DisLiked Comment" });
      } else {
        if (!comments[theComment].user_who_disliked)
          comments[theComment].user_who_disliked = [];
        comments[theComment].user_who_disliked.push(userId);
        // filter dups
        comments[theComment].user_who_disliked = [
          ...new Set(comments[theComment].user_who_disliked),
        ];
        comments[theComment].dislikes =
          comments[theComment].user_who_disliked.length;
        await db.set(`${req.params.epid}_${req.params.epname}`, comments);
        res.status(200).json({ message: "DisLiked Comment" });
      }
      // todo
      // res.status(419).end()
    },
  );
  router.get("/db/serialize", async (req, res) => {
    // remake db to make sure
    res.status(200);

    if (req.query.auth !== process.env.CR_AUTH)
      return res.status(401).json({ message: `No valid auth` });
    for await (let [key, value] of db.iterator()) {
      console.log(key, value);

      // lol why

      if (key.includes("_")) {
        // const item = value
        // console.log(item)

        value = value.map((item) => {
          const newBadges = [].filter(Boolean);
          if (item.created_at < experimentalEnd)
            newBadges.push({ name: "EXPERIMENTAL" });
          if (item.created_at < betaEnd) newBadges.push({ name: "BETA" });
          if (item.userId == process.env.CR_OWNER_ID)
            newBadges.push({ name: "OWNER" });
          if (
            process.env.CR_DONOR_IDS &&
            process.env.CR_DONOR_IDS.split(",").some((id) => id == item.userId)
          )
            newBadges.push({ name: "DONOR" });
          // reschema this
          return {
            user_data: item.user_data,
            content: item.content,
            userId: item.user_id,
            created_at: item.created_at,
            id: item.id,
            likes: item.likes,
            dislikes: item.dislikes,
            updated_at: item.updated_at,
            deleted: item.deleted,
            force_safe_mode: item.force_safe_mode,
            badges: Array.isArray(item.badges)
              ? [...item.badges, ...newBadges]
              : newBadges,
            ...item,
          };
        });
        db.set(key, value);
      }
    }
    res.json({ ok: true });
  });
  router.post(
    "/comments/:epid/:epname",
    rateLimit({ windowMs: 5000, limit: 3 }),
    async (req, res) => {
      const userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
      if (!userId)
        return res.status(400).json({ message: `User ID not found` });
      if (userId.split("-").length < 3)
        return res.status(400).json({
          message: `User ID invalid\nOnly use this application via crunchyroll`,
        });
      const { user_data, content } = req.body;
      const errors = [];
      if (!user_data) errors.push("Missing Property 'user_data'");
      if (!content) errors.push("Missing Property 'content'");
      if (typeof user_data !== "object")
        errors.push("'user_data' is not an object");
      if (typeof content !== "string") errors.push("'content' is not a string");
      if (!user_data.name) errors.push("Missing 'user_data.name' ");
      if (!user_data.avatar) errors.push("Missing 'user_data.avatar' ");
      if (typeof user_data.name !== "string")
        errors.push("'user_data.name' is not a string");
      if (typeof user_data.avatar !== "string")
        errors.push("'user_data.avatar' is not a string");
      if (!user_data.avatar.startsWith("https://"))
        errors.push(`Invalid avatar image.`);
      const vir = isMalLink(content);
      if (vir.isMal) errors.push(`Malicous URL (${vir.type}) found in body`);
      if (errors.length > 0)
        return res
          .status(403)
          .json({ message: `Multiple errors found`, errors });
      const comments =
        (await db.get(`${req.params.epid}_${req.params.epname}`)) || [];
      const created_at = Date.now(); // must be EXACT
      const id = uuid.v4();
      comments.push({
        user_data,
        content,
        userId,
        created_at,
        id,
        likes: 0,
        dislikes: 0,
        updated_at: created_at,
        deleted: false,
        force_safe_mode: false,
      });
      await db.set(`${req.params.epid}_${req.params.epname}`, comments);
      // send to webhook for audit purposes.
      fetch(process.env.SLACK_WEBHOOK, {
        method: "POST",
        body: JSON.stringify({
          content,
          id,
          userId,
          eplink: `https://crunchyroll.com/watch/${req.params.epname}`,
        }),
      });
      res.status(201).json({ message: "OK NEW" });
    },
  );
  // keep this at the end
  router.use((err, req, res, next) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    } else {
      res.status(404).json({ message: `404 ${req.path}` });
    }
  });
};
// module.exports.socket_handle = (socket,io,db) => {
//     socket.emit('ping')
//     socket.on('pong', () => {
//         socket.emit('ping')
//     })
// }
