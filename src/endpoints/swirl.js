// default template
module.exports = (router, db) => {
  const storedData = [];
  //   const storedCaptchas = [];
  //   let lastCaptchaId = null;
  //   router.get("/captcha", async (req, res) => {

  //     storedCaptchas.push(captchaID);
  //     res.redirect(
  //       `https://api-for-rpiysws.saahild.com/captcha/${captchaID}/render`
  //     );
  //   });
  router.post("/submit", async (req, res) => {
    // sweet now that we have the data we need to do a captcha :pf:
    console.log(req.body);
    if (!req.body.captcha_id) {
      const captchaID = await fetch(
        "https://api-for-rpiysws.saahild.com/captcha/"
      )
        .then((r) => r.json())
        .then((d) => d.id);

      return res.send(`<html>
            
            <h1> Please complete this captcha</h1>
            <img src="${`https://api-for-rpiysws.saahild.com/captcha/${captchaID}/render`}" />
          <form method="POST">
            <label>Captcha:</label>
            <input type="text" name="captcha-code" />
            <input type="hidden" name="captcha_id" value="${captchaID}" />
            ${Object.entries(req.body)
              .map(
                ([k, v]) => `<input type="hidden" name="${k}" value="${v}" />`
              )
              .join("\n")}
              <button type="submit">submit</button>
          </form>
            </html>`);
    }
    // try to validate captcha
    const validation = await fetch(
      `https://api-for-rpiysws.saahild.com/captcha/${req.body.captcha_id}/solve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: req.body["captcha-code"] }),
      }
    );
    validation.json().then(console.log);
    if (validation.status !== "200") {
      return res.send(`<html>
            <h1> Please complete this captcha</h1>
            <img src="${`https://api-for-rpiysws.saahild.com/captcha/${req.body.captcha_id}/render`}" />
          <form method="POST">
            <label>Captcha:</label>
            <input type="text" name="captcha-code" />
            <input type="hidden" name="captcha_id" value="${
              req.body.captcha_id
            }" />
            ${Object.entries(req.body)
              .filter(([k]) => !k.startsWith("captcha"))
              .map(
                ([k, v]) => `<input type="hidden" name="${k}" value="${v}" />`
              )
              .join("\n")}
              <button type="submit">submit</button>
          </form>
            </html>`);
    }
    // ok since its valid now... send the stuff
    console.log(`A OK to send!`);
  });
};
