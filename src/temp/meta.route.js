const express = require("express");
const router = express.Router();
const store = require("./memory.store");

router.get("/", (req, res) => {
    res.json({
        ok: true,
        ...store.getStats(),
    });
});

module.exports = router;
