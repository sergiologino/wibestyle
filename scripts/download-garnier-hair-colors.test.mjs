import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import { isLikelyHairTexture, whiteBackgroundRatio } from "./download-garnier-hair-colors.mjs";

test("rejects white marketing banners as hair color textures", async () => {
  const banner = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: 280,
            height: 600,
            channels: 3,
            background: "#111111",
          },
        }).png().toBuffer(),
        left: 90,
        top: 300,
      },
      {
        input: await sharp({
          create: {
            width: 420,
            height: 120,
            channels: 3,
            background: "#e40046",
          },
        }).png().toBuffer(),
        left: 480,
        top: 200,
      },
    ])
    .jpeg()
    .toBuffer();

  assert.equal(await isLikelyHairTexture(banner), false);
  assert.ok((await whiteBackgroundRatio(banner)) > 0.4);
});

test("accepts full-frame hair texture images", async () => {
  const texture = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: "#761515",
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: 900,
            height: 120,
            channels: 3,
            background: "#bb3b3b",
          },
        }).blur(18).png().toBuffer(),
        left: 50,
        top: 260,
      },
      {
        input: await sharp({
          create: {
            width: 850,
            height: 90,
            channels: 3,
            background: "#f09a9a",
          },
        }).blur(22).png().toBuffer(),
        left: 70,
        top: 620,
      },
    ])
    .jpeg()
    .toBuffer();

  assert.equal(await isLikelyHairTexture(texture), true);
  assert.ok((await whiteBackgroundRatio(texture)) < 0.08);
});
