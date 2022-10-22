import Express from "express";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import tmp from "tmp";

dotenv.config();
const PORT = process.env.PORT;

const app: Express.Application = Express();

app.get("/api/", async (req: Express.Request, res: Express.Response) => {
  const dsl = req.query.dsl;
  const sub = req.query.sub;
  const sty = req.query.sty;
  const variation = req.query.variation;
  const timeout = req.query.timeout;
  if (
    typeof dsl === "string" &&
    typeof sub === "string" &&
    typeof sty === "string" &&
    typeof variation === "string" &&
    (typeof timeout === "string" || typeof timeout === "undefined")
  ) {
    const timeout_sec = timeout ? parseInt(timeout) : 30;
    const dsl_url = encodeURIComponent(dsl);
    const sub_url = encodeURIComponent(sub);
    const sty_url = encodeURIComponent(sty);
    const variation_url = encodeURIComponent(variation);
    const overall_url = `http://localhost:8000/?dsl=${dsl_url}&sub=${sub_url}&sty=${sty_url}&variation=${variation_url}`;

    let browser: puppeteer.Browser | undefined = undefined;
    let page: puppeteer.Page | undefined = undefined;
    try {
      console.log("Generating");
      browser = await puppeteer.launch();
      page = await browser.newPage();
      await page.setDefaultTimeout(timeout_sec * 1000);
      await page.setDefaultNavigationTimeout(timeout_sec * 1000);
      await page.setViewport({width: 1920, height: 1080});
      await page.goto(overall_url);
      console.log("Waiting for completion");
      await page.waitForFunction(
        "document.getElementById('status').innerText === 'Completed' || document.getElementById('status').innerText === 'Failed'"
      );
      console.log("Execution completed");
      const status: any = await page.evaluate(() => {
        return document.getElementById("status")?.innerText;
      });
      if (status === "Completed") {
        const handle = await page.$("#svg");
        const tmpFileName = tmp.tmpNameSync();
        await handle?.screenshot({ path: tmpFileName + ".png" });
        console.log("Success");
        // Code 200: Ok
        res.status(200).sendFile(tmpFileName + ".png");
      } else if (status === "Failed") {
        const errorMessage = await page.evaluate(() => {
          return document.getElementById("errorbox")?.innerHTML;
        });
        console.log("Engine error");
        // Code 422: Unprocessable Entity
        res
          .status(422)
          .send(
            "<pre>Status 422 Penrose Engine Error:\n" + errorMessage + "</pre>"
          );
      }
    } catch (err) {
      console.log("Server error");
      // Code 500: Server error
      res.status(500).send("<pre>Status 500 Server Error:\n" + err + "</pre>");
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  } else {
    console.log("Bad query");
    let message = "<pre>Status 400: Bad Query:\n";
    message += `dsl = ${dsl}\n`;
    message += `sty = ${sty}\n`;
    message += `sub = ${sub}\n`;
    message += `variation = ${variation}\n`;
    message += `timeout = ${timeout}</pre>`;
    // Code 400: Bad Request
    res.status(400).send(message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

console.log("Ready!");
