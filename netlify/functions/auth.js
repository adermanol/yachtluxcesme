// POST /auth { password } → { token, exp }

const { createSessionToken, checkPassword } = require("./_auth");
const { json, errorResponse } = require("./_store");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Desteklenmeyen metod" });
    }

    const { password } = JSON.parse(event.body || "{}");
    if (!checkPassword(password)) {
      return json(401, { error: "Şifre hatalı" });
    }

    return json(200, createSessionToken());
  } catch (err) {
    return errorResponse(err);
  }
};
